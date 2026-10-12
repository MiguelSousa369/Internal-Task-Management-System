<#
.SYNOPSIS
    Importa uma base de dados PostgreSQL existente para esta instalação (Windows, Docker Desktop).

.DESCRIPTION
    Correr a partir da pasta deploy\, com a aplicação a correr (setup.ps1):

        powershell -ExecutionPolicy Bypass -File .\import-db.ps1
        powershell -ExecutionPolicy Bypass -File .\import-db.ps1 -Source postgresql://user:pass@localhost:5432/bd

    1. Exporta a origem com o pg_dump de um contentor postgres temporário (não é preciso o pg_dump
       instalado; "localhost" na origem passa a host.docker.internal, que é este PC).
    2. Guarda uma cópia dos dados atuais da instalação em deploy\backups\ (por segurança).
    3. Para o backend, substitui os dados e volta a arrancá-lo (aplica migrações pendentes).
       Se a importação falhar, repõe a cópia do passo 2.

    A origem não é alterada. Linux: import-db.sh faz o mesmo.

.PARAMETER Source
    URL da base de dados de origem. Por defeito, o DATABASE_URL de backend\.env.

.PARAMETER Yes
    Não pede confirmação.
#>
[CmdletBinding()]
param([string]$Source, [switch]$Yes)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
Set-Location -LiteralPath $PSScriptRoot

function Ok([string]$text = 'OK') { Write-Host $text -ForegroundColor Green }
function Fail([string]$text, [string[]]$hint) {
    Write-Host $text -ForegroundColor Red
    foreach ($line in $hint) { Write-Host "  $line" }
    exit 1
}
function Invoke-Docker([string]$arguments) { return cmd /c "docker $arguments 2>&1" }
# Os dumps passam por ficheiros e pelo cmd (< e >): o pipeline do PowerShell alteraria a
# codificação e os fins de linha.
function Invoke-Psql([string]$redirect) {
    return cmd /c "docker compose exec -T db psql -q -v ON_ERROR_STOP=1 -U tarefas -d tarefas $redirect 2>&1"
}
function Reset-Schema { [void](Invoke-Psql '-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'); return $LASTEXITCODE -eq 0 }

if (-not $Source) {
    $backendEnv = Join-Path $PSScriptRoot '..\backend\.env'
    if (Test-Path -LiteralPath $backendEnv) {
        $line = Get-Content -LiteralPath $backendEnv | Where-Object { $_ -like 'DATABASE_URL=*' } | Select-Object -First 1
        if ($line) { $Source = $line.Substring(13).Trim('"') }
    }
}
if (-not $Source) { Fail 'Sem origem.' 'Uso: .\import-db.ps1 -Source postgresql://user:pass@localhost:5432/bd' }
# O pg_dump não aceita os parâmetros do Prisma (?schema=public); dentro do contentor, o PC é
# host.docker.internal.
$Source = ($Source -split '\?')[0] -replace '@(localhost|127\.0\.0\.1)([:/])', '@host.docker.internal$2'
$masked = $Source -replace '//[^@]*@', '//***@'

if (-not (Test-Path -LiteralPath .env)) { Fail 'Instalação não encontrada.' 'Corre primeiro .\setup.ps1.' }
[void](Invoke-Docker 'compose exec -T db pg_isready -U tarefas')
if ($LASTEXITCODE -ne 0) { Fail 'A base de dados não está a correr.' 'Corre .\setup.ps1 (ou docker compose up -d).' }

if (-not $Yes) {
    Write-Host "Origem:  $masked"
    if ((Read-Host 'Isto substitui todos os dados desta instalação pelos da origem. Continuar? (s/N)') -notmatch '^[sSyY]') { exit 1 }
}

New-Item -ItemType Directory -Force backups | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$dump = "backups\import_$stamp.sql"
$before = "backups\antes-import_$stamp.sql"

Write-Host '  A exportar a origem ... ' -NoNewline
$image = (Invoke-Docker 'compose config --images db' | Select-Object -First 1)
if (-not $image -or $LASTEXITCODE -ne 0) { $image = 'postgres:18-alpine' }
cmd /c "docker run --rm $image pg_dump --no-owner --no-privileges `"$Source`" > $dump 2> $dump.err"
if ($LASTEXITCODE -ne 0) {
    $err = @(Get-Content "$dump.err")
    Remove-Item $dump, "$dump.err" -ErrorAction SilentlyContinue
    Fail 'FALHOU' ($err + 'Confirma o URL e que o PostgreSQL de origem aceita ligações da rede do Docker.')
}
Remove-Item "$dump.err"
Ok "OK ($dump)"

Write-Host '  A guardar os dados atuais ... ' -NoNewline
cmd /c "docker compose exec -T db pg_dump --no-owner --no-privileges -U tarefas tarefas > $before"
if ($LASTEXITCODE -ne 0) { Fail 'FALHOU' 'Não foi possível copiar os dados atuais; nada foi alterado.' }
Ok "OK ($before)"

Write-Host '  A importar ... ' -NoNewline
[void](Invoke-Docker 'compose stop backend')
# O schema public é recriado vazio; algumas versões do pg_dump também o criam.
$filtered = "$dump.import"
cmd /c "findstr /v /x /c:`"CREATE SCHEMA public;`" $dump > $filtered"
$imported = $false
if (Reset-Schema) {
    $out = Invoke-Psql "< $filtered"
    $imported = $LASTEXITCODE -eq 0
}
Remove-Item $filtered -ErrorAction SilentlyContinue
if (-not $imported) {
    Write-Host 'FALHOU' -ForegroundColor Red
    $out | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" }
    Write-Host '  A repor os dados anteriores ... ' -NoNewline
    $restored = $false
    if (Reset-Schema) { [void](Invoke-Psql "< $before"); $restored = $LASTEXITCODE -eq 0 }
    if ($restored) { Ok }
    else { Write-Host "FALHOU (repor à mão: $before)" -ForegroundColor Red }
    [void](Invoke-Docker 'compose start backend')
    exit 1
}
Ok

Write-Host '  A arrancar o backend ... ' -NoNewline
[void](Invoke-Docker 'compose start backend')
$apiUp = $false
for ($i = 0; $i -lt 60 -and -not $apiUp; $i++) {
    [void](Invoke-Docker 'compose exec -T backend wget -qO- http://127.0.0.1:3000/api/health')
    if ($LASTEXITCODE -eq 0) { $apiUp = $true } else { Start-Sleep -Seconds 2 }
}
if (-not $apiUp) { Fail 'FALHOU' (@('A API não arrancou depois da importação:') + @(Invoke-Docker 'compose logs --tail 15 backend')) }
Ok

$counts = Invoke-Psql "-At -c `"SELECT (SELECT count(*) FROM \`"User\`") || ' utilizadores, ' || (SELECT count(*) FROM \`"Task\`") || ' tarefas, ' || (SELECT count(*) FROM \`"TaskComment\`") || ' comentários'`""
Write-Host "  Importado: $counts"
exit 0
