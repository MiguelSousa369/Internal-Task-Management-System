# Instalar em produção

A aplicação corre em Docker num servidor da rede interna: o frontend, a API e a base de dados,
atrás do [Caddy](https://caddyserver.com), que serve tudo em HTTPS com uma autoridade de
certificação própria (rede interna, sem Let's Encrypt).

```
browsers (rede interna) ──HTTPS 443──► Caddy ──► frontend + /api ──► backend ──► PostgreSQL
                                       (única coisa exposta)                     (só interno)
```

Os mesmos ficheiros servem para Linux e para Windows: em Linux usa-se `setup.sh` /
`import-db.sh`, em Windows `setup.ps1` / `import-db.ps1`.

## O que é preciso

- **Um servidor com Docker** e o plugin Docker Compose:
  - Linux: `curl -fsSL https://get.docker.com | sudo sh`, depois
    `sudo usermod -aG docker $USER` e sair e voltar a entrar.
  - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- **Um IP fixo na rede interna** (reserva DHCP ou IP estático). É por ele que os PCs acedem, e o
  certificado é emitido para ele.
- **Portas 80 e 443 livres** no servidor. A 443 serve a aplicação; a 80 só redireciona para HTTPS
  e serve o certificado raiz para instalar nos PCs.

## 1. Instalar

```sh
# Linux
git clone https://github.com/MiguelSousa369/Internal-Task-Management-System.git
cd Internal-Task-Management-System/deploy
./setup.sh
```

```powershell
# Windows
git clone https://github.com/MiguelSousa369/Internal-Task-Management-System.git
cd Internal-Task-Management-System\deploy
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

O script:

1. Verifica o Docker.
2. Pergunta o endereço — sugere o IP do servidor; aceita também um nome, se todos os PCs o
   resolverem — e confirma que é desta máquina.
3. Escreve `deploy/.env` com a password da base de dados e o segredo JWT gerados. **Guardar este
   ficheiro**: sem ele a aplicação não arranca e as sessões deixam de ser válidas.
4. Constrói as imagens e arranca tudo; a API aplica as migrações da base de dados ao arrancar.
5. Na primeira vez, oferece importar uma base de dados existente (ver
   [Migrar de uma instalação antiga](#migrar-de-uma-instalação-antiga)). Se não houver
   utilizadores, cria o `admin` com uma password gerada, mostrada no fim — mudá-la ou criar os
   utilizadores reais e desativar este.
6. Espera pelo certificado HTTPS (em Windows, faz também esse PC confiar nele).
7. Garante que tudo volta depois de reiniciar: em Linux ativa o serviço do Docker no arranque; em
   Windows faz o Docker Desktop arrancar ao iniciar sessão (só corre com uma sessão iniciada).

Pode correr-se outra vez sem perigo: mantém o `.env`, arranca o que estiver parado e volta a
mostrar o endereço.

## 2. Confiar no certificado em cada PC

O certificado é emitido pela autoridade interna do Caddy, que os PCs ainda não conhecem. Sem este
passo o browser mostra um aviso de segurança e **as notificações de pedidos novos não
funcionam** (o browser só as permite em HTTPS válido).

Uma vez por PC, em **PowerShell como Administrador** (trocar o IP):

```powershell
iwr http://192.168.1.10/ca.crt -OutFile $env:TEMP\tarefas-ca.crt; Import-Certificate $env:TEMP\tarefas-ca.crt -CertStoreLocation Cert:\LocalMachine\Root
```

Ou à mão: abrir `http://192.168.1.10/ca.crt`, abrir o ficheiro descarregado →
**Instalar certificado** → Computador local → **Autoridades de Certificação de Raiz
Fidedignas**. O Chrome e o Edge usam o arquivo do Windows; o Firefox tem o seu (Definições →
Privacidade e segurança → Certificados → Importar).

Em muitos PCs ao mesmo tempo: distribuir o `ca.crt` por GPO (Configuração do Computador →
Políticas → Definições do Windows → Definições de Segurança → Políticas de Chave Pública →
Autoridades de Certificação de Raiz Fidedignas).

A autoridade é válida por 10 anos e fica no volume `caddy-data` — **não apagar esse volume**, ou é
criada uma nova e é preciso repetir este passo em todos os PCs.

## Ecrã TV

Para ter as tarefas numa TV na parede (um PC, mini-PC ou TV com browser ligado a ela):

1. Na aplicação, em **Utilizadores**, criar um utilizador com o perfil **TV** (ex.: `tvsala`). Só
   consegue ver: não abre tarefas nem altera nada.
2. Nesse PC, [confiar no certificado](#2-confiar-no-certificado-em-cada-pc) e abrir
   `https://192.168.1.10/#tv`; entrar com o utilizador TV. Abre logo no modo TV.
3. Ecrã inteiro: o botão "Ecrã inteiro" (aparece ao mexer o rato) ou F11.

A sessão renova-se enquanto a página está aberta, por isso a TV não volta ao login sozinha. Para
abrir em ecrã inteiro sempre que o PC liga, um atalho no arranque do Windows (`shell:startup`)
com o Edge em modo quiosque:

```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk https://192.168.1.10/#tv --edge-kiosk-type=fullscreen
```

(No modo quiosque sai-se com Alt+F4.) Para tirar o acesso à TV, desativar o utilizador: a sessão
é cortada de imediato.

## Migrar de uma instalação antiga

Para trazer os dados de um PostgreSQL que já existia (por exemplo, o que a aplicação usava a correr
em modo de desenvolvimento, instalado diretamente no servidor):

```sh
./import-db.sh                                              # usa o DATABASE_URL de backend/.env
./import-db.sh postgresql://user:pass@localhost:5432/bd     # ou indicar a origem
```

```powershell
powershell -ExecutionPolicy Bypass -File .\import-db.ps1
powershell -ExecutionPolicy Bypass -File .\import-db.ps1 -Source postgresql://user:pass@localhost:5432/bd
```

O `setup` oferece isto sozinho na primeira instalação. O script:

- exporta a origem com o `pg_dump` de um contentor PostgreSQL temporário (não é preciso tê-lo
  instalado). A origem **não é alterada**;
- guarda uma cópia dos dados atuais da instalação em `deploy/backups/antes-import_*.sql`;
- substitui os dados, volta a arrancar a API (que aplica migrações pendentes) e mostra quantos
  utilizadores, tarefas e comentários foram importados. Se a importação falhar, repõe a cópia.

Em Windows, `localhost` na origem passa a `host.docker.internal`; o PostgreSQL de origem tem de
aceitar ligações dessa rede (`listen_addresses` e `pg_hba.conf`).

Depois de confirmar que está tudo certo, parar a versão antiga (os `npm run dev`) e, se já não for
precisa, o PostgreSQL antigo.

## Atualizar

```sh
cd Internal-Task-Management-System
git pull
cd deploy
docker compose up -d --build
```

As migrações da base de dados são aplicadas automaticamente quando a API arranca.

## Backups

Cópia da base de dados (Linux; em Windows igual, com `backups\`):

```sh
cd deploy
mkdir -p backups
docker compose exec -T db pg_dump -U tarefas tarefas > backups/tarefas_$(date +%Y%m%d).sql
```

Guardar também o `deploy/.env`. Para repor uma cópia:

```sh
docker compose stop backend
docker compose exec -T db psql -U tarefas -d tarefas -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
docker compose exec -T db psql -U tarefas -d tarefas < backups/tarefas_AAAAMMDD.sql
docker compose start backend
```

Para fazer cópias todos os dias em Linux, uma linha no `crontab -e` (trocar o caminho):

```
0 2 * * * cd /opt/Internal-Task-Management-System/deploy && docker compose exec -T db pg_dump -U tarefas tarefas > backups/tarefas_$(date +\%Y\%m\%d).sql
```

## Comandos úteis

Todos a partir de `deploy/`:

```sh
docker compose ps                    # estado dos serviços
docker compose logs -f backend       # logs da API
docker compose logs -f web           # logs do Caddy (HTTPS)
docker compose restart backend       # reiniciar a API
docker compose down                  # parar tudo (os dados ficam nos volumes)
```

Criar outro Admin (por exemplo, se se perder a password):

```sh
docker compose exec -e ADMIN_NOME="Nome" -e ADMIN_USERNAME=nome -e ADMIN_PASSWORD="password" backend npm run create-admin
```

## Definições

O `deploy/.env` tem o endereço (`TAREFAS_HOST`) e os segredos. Outras definições do
[backend/.env.example](../backend/.env.example) podem ser acrescentadas lá (ex.:
`RATE_LIMIT_MAX`); aplicar com `docker compose up -d`.

Mudar o endereço (ex.: o servidor mudou de IP): editar `TAREFAS_HOST` no `.env` e
`docker compose up -d`. O certificado é emitido para o novo endereço pela mesma autoridade — os
PCs não precisam de nada novo.

## Resolução de problemas

| Sintoma | Causa provável |
|---|---|
| O browser avisa que a ligação não é privada | O PC ainda não confia no certificado — [passo 2](#2-confiar-no-certificado-em-cada-pc). |
| Não aparecem notificações de pedidos novos | Igual ao anterior, ou as notificações foram bloqueadas para o site no browser. |
| `setup` falha em "A arrancar" com `port is already allocated` | Já há algo nas portas 80/443 (outro servidor web, ou a versão antiga). Pará-lo e correr outra vez. |
| A página não abre noutros PCs | Firewall do servidor: abrir as portas 80 e 443 (Linux: `sudo ufw allow 80,443/tcp`). |
| A API não arranca | `docker compose logs backend` — normalmente a base de dados ou uma migração. |
| Muitos "Demasiados pedidos" | Aumentar `RATE_LIMIT_MAX` no `.env` (por IP, a cada 15 minutos). |

## Notas de segurança

- Só o Caddy está exposto (80/443). A API e a base de dados ficam na rede interna do Docker; a
  base de dados nunca é publicada.
- Passwords e segredo JWT gerados na instalação; a API recusa arrancar em produção sem
  `JWT_SECRET`.
- Login limitado a 20 tentativas falhadas por IP a cada 15 minutos; pedidos em geral, a 2000.
- As passwords dos utilizadores são guardadas com bcrypt. As sessões renovam-se enquanto a app
  está a ser usada e expiram ao fim de 24 horas sem uso (`SESSION_HOURS`); desativar um utilizador
  corta-lhe a sessão de imediato.
