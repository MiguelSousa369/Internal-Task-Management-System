<#
.SYNOPSIS
    Gestão de Tarefas em Windows (Docker Desktop): configura tudo e arranca, de uma vez.

.DESCRIPTION
    Correr a partir da pasta deploy\:

        powershell -ExecutionPolicy Bypass -File .\setup.ps1

    1. Verifica que o Docker Desktop está a correr.
    2. Pergunta o endereço (o IP deste PC na rede interna, sugerido) e confirma que é desta
       máquina - só um aviso.
    3. Escreve deploy\.env com a password da base de dados e o segredo JWT gerados (sem
       passwords por defeito).
    4. Constrói e arranca tudo (docker compose up -d --build) e espera pela API.
    5. Dados: na primeira vez, oferece importar uma base de dados existente (import-db.ps1); se
       não houver utilizadores, cria o admin com uma password gerada.
    6. Espera pelo certificado HTTPS interno e faz este PC confiar nele (pede Administrador).
    7. Faz o Docker Desktop arrancar ao iniciar sessão, para a aplicação voltar sozinha.

    Pode correr-se outra vez: o .env existente é mantido, o que estiver parado é arrancado e o
    endereço volta a ser mostrado. Linux: setup.sh faz o mesmo.

.PARAMETER Address
    O endereço, para não perguntar.
#>
[CmdletBinding()]
param([string]$Address)

# Continue, não Stop: o docker escreve o progresso no stderr, que o Windows PowerShell 5.1
# transformaria em erros. Os códigos de saída são verificados.
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
Set-Location -LiteralPath $PSScriptRoot

function Step([string]$n, [string]$label) { Write-Host ("[$n] $label ... ") -NoNewline }
function Ok([string]$text = 'OK') { Write-Host $text -ForegroundColor Green }
function Warn([string]$text) { Write-Host $text -ForegroundColor Yellow }
function Fail([string]$text, [string[]]$hint) {
    Write-Host $text -ForegroundColor Red
    foreach ($line in $hint) { Write-Host "  $line" }
    exit 1
}
# Corre o docker através do cmd para o stderr vir como texto; devolve as linhas.
function Invoke-Docker([string]$arguments) {
    return cmd /c "docker $arguments 2>&1"
}
function Read-EnvValue([string]$file, [string]$name) {
    $line = Get-Content -LiteralPath $file | Where-Object { $_ -like "$name=*" } | Select-Object -First 1
    if ($line) { return $line.Substring($name.Length + 1).Trim('"') }
}
function New-Secret([int]$bytes) {
    $buf = New-Object byte[] $bytes
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
    return -join ($buf | ForEach-Object { $_.ToString('x2') })
}

Write-Host ''
Write-Host 'Gestão de Tarefas - setup' -ForegroundColor Cyan
Write-Host ''

# ---------------------------------------------------------------- 1. Docker

Step '1/7' 'Docker'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail 'NÃO INSTALADO' 'Instala o Docker Desktop (https://www.docker.com/products/docker-desktop/), arranca-o e corre isto outra vez.'
}
[void](Invoke-Docker 'info')
if ($LASTEXITCODE -ne 0) { Fail 'PARADO' 'Arranca o Docker Desktop, espera por "Engine running" e corre isto outra vez.' }
[void](Invoke-Docker 'compose version')
if ($LASTEXITCODE -ne 0) { Fail 'SEM COMPOSE' 'Atualiza o Docker Desktop (falta o Docker Compose) e corre isto outra vez.' }
Ok

# ---------------------------------------------------------------- 2. endereço

$localIps = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    ForEach-Object { $_.IPAddress })
$existing = Test-Path -LiteralPath .env
if ($existing) {
    $Address = Read-EnvValue '.env' 'TAREFAS_HOST'
    Write-Host "A usar o deploy\.env existente (endereço: $Address)."
}
else {
    $suggested = $null
    try {
        $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction Stop | Sort-Object RouteMetric | Select-Object -First 1
        $suggested = (Get-NetIPAddress -InterfaceIndex $route.ifIndex -AddressFamily IPv4 -ErrorAction Stop | Select-Object -First 1).IPAddress
    } catch { if ($localIps.Count) { $suggested = $localIps[0] } }
    while ($true) {
        if (-not $Address) {
            $Address = (Read-Host "Endereço para aceder à aplicação [$suggested]").Trim()
            if (-not $Address) { $Address = $suggested }
        }
        if ($Address -match '^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$') { break }
        Write-Host '  Só o IP ou o nome, ex.: 192.168.1.10 (sem http://, sem caminho).' -ForegroundColor Yellow
        $Address = ''
    }
}

Step '2/7' 'Endereço'
if ($Address -match '^[0-9.]+$') {
    if ($localIps -contains $Address) { Ok "OK ($Address é deste PC)" }
    else {
        Warn 'AVISO'
        Write-Host "  $Address não é um IP desta máquina. Os PCs não vão conseguir aceder se estiver errado."
        if (-not $existing -and (Read-Host '  Continuar mesmo assim? (s/N)') -notmatch '^[sSyY]') { exit 1 }
    }
}
else {
    Ok "$Address (nome - tem de resolver para este PC em todos os PCs)"
}

# ---------------------------------------------------------------- 3. segredos / .env

Step '3/7' 'Passwords'
if ($existing) {
    Ok 'mantidas (do deploy\.env)'
}
else {
    $content = @(
        '# Gestão de Tarefas - definições de produção, geradas pelo setup.ps1. Manter este ficheiro privado.'
        "TAREFAS_HOST=$Address"
        "POSTGRES_PASSWORD=$(New-Secret 24)"
        "JWT_SECRET=$(New-Secret 48)"
        ''
        '# Outras definições de backend/.env.example (RATE_LIMIT_MAX...) podem ser acrescentadas abaixo;'
        '# aplicar com: docker compose up -d'
        ''
    ) -join "`n"
    # UTF-8 sem BOM: o Docker Compose leria o BOM como parte do nome da primeira variável.
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), $content, (New-Object Text.UTF8Encoding($false)))
    Ok 'geradas (guardadas em deploy\.env)'
}

# ---------------------------------------------------------------- 4. arranque

Step '4/7' 'A arrancar'
Write-Host '(a primeira vez demora uns minutos) ' -NoNewline
$out = Invoke-Docker 'compose up -d --build'
if ($LASTEXITCODE -ne 0) {
    Fail 'FALHOU' (@('docker compose up disse:') + @($out | Select-Object -Last 15))
}
$apiUp = $false
for ($i = 0; $i -lt 60 -and -not $apiUp; $i++) {
    [void](Invoke-Docker 'compose exec -T backend wget -qO- http://127.0.0.1:3000/api/health')
    if ($LASTEXITCODE -eq 0) { $apiUp = $true } else { Start-Sleep -Seconds 2 }
}
if (-not $apiUp) {
    Fail 'FALHOU' (@('A API não arrancou. Últimas linhas do log:') + @(Invoke-Docker 'compose logs --tail 15 backend'))
}
Ok

# ---------------------------------------------------------------- 5. dados

Step '5/7' 'Dados'
Write-Host ''
# Oferece a importação sempre que a base de dados ainda não tem utilizadores (não só na primeira
# vez: uma instalação anterior pode ter ficado a meio).
$users = (Invoke-Docker 'compose exec -T db psql -U tarefas -d tarefas -Atc "SELECT count(*) FROM \"User\""' | Select-Object -First 1)
if ("$users".Trim() -eq '0' -or -not "$users".Trim()) {
    $source = $null
    $backendEnv = Join-Path $PSScriptRoot '..\backend\.env'
    if (Test-Path -LiteralPath $backendEnv) { $source = Read-EnvValue $backendEnv 'DATABASE_URL' }
    if ($source) {
        Write-Host "  Encontrei uma base de dados em backend\.env ($($source -replace '//[^@]*@', '//***@'))."
        $answer = Read-Host '  Importar os dados dela para esta instalação? (s/N)'
    }
    else {
        $answer = Read-Host '  Importar os dados de uma base de dados existente? (s/N)'
    }
    if ($answer -match '^[sSyY]') {
        if (-not $source) { $source = Read-Host '  URL (postgresql://user:pass@localhost:5432/bd)' }
        & (Join-Path $PSScriptRoot 'import-db.ps1') -Source $source -Yes
        if ($LASTEXITCODE -ne 0) { Fail 'FALHOU' 'A importação falhou (ver acima). Corrige e corre .\import-db.ps1 outra vez.' }
    }
}
$adminPassword = New-Secret 9
$created = Invoke-Docker "compose exec -T -e ADMIN_NOME=Administrador -e ADMIN_USERNAME=admin -e ADMIN_PASSWORD=$adminPassword backend npx tsx prisma/createAdmin.ts --if-empty"
if ($LASTEXITCODE -ne 0) { Fail 'FALHOU' $created }
Write-Host '      Utilizadores ... ' -NoNewline
if (($created -join "`n") -match 'Admin criado') { Ok 'admin criado' } else { Ok 'já existem (mantidos)'; $adminPassword = $null }

# ---------------------------------------------------------------- 6. certificado

Step '6/7' 'Certificado HTTPS'
$rootPath = '/data/caddy/pki/authorities/local/root.crt'
for ($i = 0; $i -lt 30; $i++) {
    [void](Invoke-Docker "compose exec -T web test -f $rootPath")
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}
# Copiado para esta pasta com um nome relativo simples: sem caminhos com espaços para o cmd.
[void](Invoke-Docker "compose cp web:$rootPath caddy-root.crt")
$crt = Join-Path $PSScriptRoot 'caddy-root.crt'
if ($LASTEXITCODE -ne 0) { Fail 'FALHOU' 'O Caddy não criou a autoridade de certificação: docker compose logs web' }
$thumb = (New-Object Security.Cryptography.X509Certificates.X509Certificate2($crt)).Thumbprint
if (Get-ChildItem Cert:\LocalMachine\Root | Where-Object Thumbprint -eq $thumb) {
    Ok 'OK (este PC já confia nele)'
}
else {
    $trust = "Import-Certificate -FilePath '$($crt -replace "'", "''")' -CertStoreLocation Cert:\LocalMachine\Root | Out-Null"
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
    try {
        if ($isAdmin) { Invoke-Expression $trust }
        else {
            # Só este passo precisa de Administrador: o Windows mostra o pedido. Codificado, para
            # não haver aspas a passar pelo Start-Process.
            $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($trust))
            Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList "-NoProfile -EncodedCommand $encoded"
        }
    } catch { }
    if (Get-ChildItem Cert:\LocalMachine\Root | Where-Object Thumbprint -eq $thumb) {
        Ok 'OK (este PC passa a confiar nele)'
    }
    else {
        Warn 'NÃO CONFIÁVEL'
        Write-Host '  O pedido de Administrador foi recusado: o browser deste PC vai mostrar um aviso.'
        Write-Host '  Corre isto outra vez e aceita o pedido.'
    }
}
Remove-Item -LiteralPath $crt -ErrorAction SilentlyContinue

# ---------------------------------------------------------------- 7. arranque com o Windows

# O Docker Desktop só corre depois de alguém iniciar sessão. Os mesmos três sítios que a opção
# "Start Docker Desktop when you sign in" e as aplicações de arranque do Windows usam.
Step '7/7' 'Docker ao iniciar sessão'
try {
    $exe = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    foreach ($name in 'settings-store.json', 'settings.json') {
        $file = Join-Path $env:APPDATA "Docker\$name"
        if (-not (Test-Path -LiteralPath $file)) { continue }
        $settings = Get-Content -LiteralPath $file -Raw | ConvertFrom-Json
        $key = if ($name -eq 'settings.json') { 'autoStart' } else { 'AutoStart' }
        if ($settings.PSObject.Properties[$key]) { $settings.$key = $true } else { $settings | Add-Member -NotePropertyName $key -NotePropertyValue $true }
        [IO.File]::WriteAllText($file, ($settings | ConvertTo-Json -Depth 20), (New-Object Text.UTF8Encoding($false)))
        break
    }
    if (Test-Path -LiteralPath $exe) {
        Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'Docker Desktop' -Value $exe
    }
    # Aplicações de arranque (Gestor de Tarefas / Definições): 02 = ativa, 03 = desativada.
    $approved = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
    if (Test-Path $approved) {
        Set-ItemProperty -Path $approved -Name 'Docker Desktop' -Type Binary -Value ([byte[]](2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
    }
    Ok 'OK (arranca ao iniciar sessão)'
}
catch {
    Warn 'NÃO ATIVADO'
    Write-Host "  $($_.Exception.Message)"
    Write-Host '  Ativa no Docker Desktop: Settings > General > "Start Docker Desktop when you sign in".'
}

# ---------------------------------------------------------------- fim

Write-Host ''
Write-Host 'A Gestão de Tarefas está a correr.' -ForegroundColor Green
Write-Host ''
Write-Host "  Abrir:        https://$Address"
if ($adminPassword) {
    Write-Host '  Utilizador:   admin'
    Write-Host "  Password:     $adminPassword   (mostrada só agora - muda-a ou cria o teu utilizador)"
}
Write-Host ''
Write-Host '  Em cada PC, uma vez, para o browser confiar no HTTPS (PowerShell como Administrador):'
Write-Host "    iwr http://$Address/ca.crt -OutFile `$env:TEMP\tarefas-ca.crt; Import-Certificate `$env:TEMP\tarefas-ca.crt -CertStoreLocation Cert:\LocalMachine\Root"
Write-Host '  Detalhes e outras opções: docs\deploy.md'
Write-Host '  Depois de reiniciar, a aplicação volta sozinha quando alguém inicia sessão no Windows'
Write-Host '  (o Docker Desktop só corre com uma sessão iniciada).'
Write-Host ''
