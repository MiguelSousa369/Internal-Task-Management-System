#!/bin/sh
# Gestão de Tarefas em Linux: configura tudo e arranca, de uma vez.
#
# Correr a partir da pasta deploy/:
#
#     ./setup.sh
#
#   1. Verifica o Docker e o Docker Compose.
#   2. Pergunta o endereço (o IP deste servidor na rede interna, sugerido) e confirma que é desta
#      máquina - só um aviso.
#   3. Escreve deploy/.env com a password da base de dados e o segredo JWT gerados (sem passwords
#      por defeito).
#   4. Constrói e arranca tudo (docker compose up -d --build) e espera pela API.
#   5. Dados: na primeira vez, oferece importar uma base de dados existente (import-db.sh); se não
#      houver utilizadores, cria o admin com uma password gerada.
#   6. Espera pelo certificado HTTPS interno e mostra onde o descarregar para os PCs.
#   7. Garante que o Docker arranca com o sistema (systemd), para a aplicação voltar sozinha.
#
# Pode correr-se outra vez: o .env existente é mantido, o que estiver parado é arrancado e o
# endereço volta a ser mostrado. Windows: setup.ps1 faz o mesmo.
#
# Uso: ./setup.sh [endereço]

set -u
cd "$(dirname "$0")"

GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; CYAN='\033[36m'; RESET='\033[0m'
step() { printf '[%s] %s ... ' "$1" "$2"; }
ok()   { printf "${GREEN}%s${RESET}\n" "${1:-OK}"; }
warn() { printf "${YELLOW}%s${RESET}\n" "$1"; }
fail() { printf "${RED}%s${RESET}\n" "$1"; shift; for l in "$@"; do echo "  $l"; done; exit 1; }
env_value() { grep "^$1=" .env | head -n 1 | cut -d= -f2-; }
secret() { od -An -tx1 -N"$1" /dev/urandom | tr -d ' \n'; }

echo
printf "${CYAN}Gestão de Tarefas - setup${RESET}\n"
echo

# ---------------------------------------------------------------- 1. Docker

step 1/7 Docker
command -v docker >/dev/null 2>&1 || fail 'NÃO INSTALADO' 'Instala o Docker (curl -fsSL https://get.docker.com | sudo sh) e corre isto outra vez.'
docker info >/dev/null 2>&1 || fail 'SEM ACESSO' 'O Docker não está a correr ou este utilizador não tem acesso:' \
  'sudo systemctl start docker   e   sudo usermod -aG docker $USER  (sair e voltar a entrar)'
docker compose version >/dev/null 2>&1 || fail 'SEM COMPOSE' 'Falta o plugin Docker Compose (sudo apt install docker-compose-plugin).'
ok

# ---------------------------------------------------------------- 2. endereço

EXISTING=0
if [ -f .env ]; then
  EXISTING=1
  HOST=$(env_value TAREFAS_HOST)
  echo "A usar o deploy/.env existente (endereço: $HOST)."
else
  HOST=${1:-}
  SUGGESTED=$(ip route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p')
  [ -n "$SUGGESTED" ] || SUGGESTED=$(hostname -I 2>/dev/null | awk '{print $1}')
  while :; do
    if [ -z "$HOST" ]; then
      printf 'Endereço para aceder à aplicação [%s]: ' "$SUGGESTED"
      read -r HOST
      [ -n "$HOST" ] || HOST=$SUGGESTED
    fi
    if printf '%s' "$HOST" | grep -Eq '^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$'; then break; fi
    warn '  Só o IP ou o nome, ex.: 192.168.1.10 (sem http://, sem caminho).'
    HOST=''
  done
fi

step 2/7 'Endereço'
if printf '%s' "$HOST" | grep -Eq '^[0-9.]+$'; then
  if ip -4 addr 2>/dev/null | grep -q "inet $HOST/"; then
    ok "OK ($HOST é deste servidor)"
  else
    warn 'AVISO'
    echo "  $HOST não é um IP desta máquina. Os PCs não vão conseguir aceder se estiver errado."
    if [ "$EXISTING" = 0 ]; then
      printf '  Continuar mesmo assim? (s/N) '; read -r a
      case "$a" in [sSyY]*) ;; *) exit 1 ;; esac
    fi
  fi
else
  ok "$HOST (nome - tem de resolver para este servidor em todos os PCs)"
fi

# ---------------------------------------------------------------- 3. segredos / .env

step 3/7 'Passwords'
if [ "$EXISTING" = 1 ]; then
  ok 'mantidas (do deploy/.env)'
else
  umask 077
  cat > .env <<EOF
# Gestão de Tarefas - definições de produção, geradas pelo setup.sh. Manter este ficheiro privado.
TAREFAS_HOST=$HOST
POSTGRES_PASSWORD=$(secret 24)
JWT_SECRET=$(secret 48)

# Outras definições de backend/.env.example (RATE_LIMIT_MAX...) podem ser acrescentadas abaixo;
# aplicar com: docker compose up -d
EOF
  umask 022
  ok 'geradas (guardadas em deploy/.env)'
fi

# ---------------------------------------------------------------- 4. arranque

step 4/7 'A arrancar'
printf '(a primeira vez demora uns minutos) '
OUT=$(docker compose up -d --build 2>&1) || fail 'FALHOU' 'docker compose up disse:' "$(printf '%s\n' "$OUT" | tail -n 15)"
i=0
until docker compose exec -T backend wget -qO- http://127.0.0.1:3000/api/health </dev/null >/dev/null 2>&1; do
  i=$((i + 1))
  [ $i -lt 60 ] || fail 'FALHOU' 'A API não arrancou. Últimas linhas do log:' "$(docker compose logs --tail 15 backend 2>&1)"
  sleep 2
done
ok

# ---------------------------------------------------------------- 5. dados

step 5/7 'Dados'
echo
# Oferece a importação sempre que a base de dados ainda não tem utilizadores (não só na primeira
# vez: uma instalação anterior pode ter ficado a meio).
USERS=$(docker compose exec -T db psql -U tarefas -d tarefas -Atc 'SELECT count(*) FROM "User"' </dev/null 2>/dev/null | tr -d '\r')
if [ "${USERS:-0}" = 0 ]; then
  SOURCE=''
  [ -f ../backend/.env ] && SOURCE=$(grep '^DATABASE_URL=' ../backend/.env | head -n 1 | cut -d= -f2- | tr -d '"')
  if [ -n "$SOURCE" ]; then
    echo "  Encontrei uma base de dados em backend/.env ($(printf '%s' "$SOURCE" | sed 's#//[^@]*@#//***@#'))."
    printf '  Importar os dados dela para esta instalação? (s/N) '
  else
    printf '  Importar os dados de uma base de dados existente? (s/N) '
  fi
  read -r a
  case "$a" in
    [sSyY]*)
      if [ -z "$SOURCE" ]; then printf '  URL (postgresql://user:pass@localhost:5432/bd): '; read -r SOURCE; fi
      ./import-db.sh --yes "$SOURCE" || fail 'FALHOU' 'A importação falhou (ver acima). Corrige e corre ./import-db.sh outra vez.'
      ;;
  esac
fi
ADMIN_PASSWORD=$(secret 9)
CREATED=$(docker compose exec -T -e ADMIN_NOME=Administrador -e ADMIN_USERNAME=admin -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  backend npx tsx prisma/createAdmin.ts --if-empty </dev/null 2>&1) || fail 'FALHOU' "$CREATED"
printf '      Utilizadores ... '
if printf '%s' "$CREATED" | grep -q 'Admin criado'; then ok 'admin criado'; else ok 'já existem (mantidos)'; ADMIN_PASSWORD=''; fi

# ---------------------------------------------------------------- 6. certificado

step 6/7 'Certificado HTTPS'
i=0
until docker compose exec -T web test -f /data/caddy/pki/authorities/local/root.crt </dev/null >/dev/null 2>&1; do
  i=$((i + 1))
  [ $i -lt 30 ] || fail 'FALHOU' 'O Caddy não criou a autoridade de certificação: docker compose logs web'
  sleep 2
done
ok "OK (raiz em http://$HOST/ca.crt)"

# ---------------------------------------------------------------- 7. arranque automático

step 7/7 'Arranque com o sistema'
if command -v systemctl >/dev/null 2>&1; then
  if [ "$(systemctl is-enabled docker 2>/dev/null)" = enabled ]; then
    ok 'OK (o Docker arranca com o sistema)'
  elif sudo systemctl enable docker >/dev/null 2>&1; then
    ok 'ativado (o Docker arranca com o sistema)'
  else
    warn 'NÃO ATIVADO'
    echo '  Corre: sudo systemctl enable docker'
  fi
else
  warn 'VERIFICAR'
  echo '  Sem systemd: garante que o serviço do Docker arranca com o sistema.'
fi

# ---------------------------------------------------------------- fim

echo
printf "${GREEN}A Gestão de Tarefas está a correr.${RESET}\n"
echo
echo "  Abrir:        https://$HOST"
if [ -n "$ADMIN_PASSWORD" ]; then
  echo "  Utilizador:   admin"
  echo "  Password:     $ADMIN_PASSWORD   (mostrada só agora - muda-a ou cria o teu utilizador)"
fi
echo
echo "  Em cada PC, uma vez, para o browser confiar no HTTPS (PowerShell como Administrador):"
# printf '%s' e não echo: o echo do sh transforma "\t" (de \tarefas-ca.crt) num tab.
printf '    %s\n' "iwr http://$HOST/ca.crt -OutFile \$env:TEMP\\tarefas-ca.crt; Import-Certificate \$env:TEMP\\tarefas-ca.crt -CertStoreLocation Cert:\\LocalMachine\\Root"
echo "  Detalhes e outras opções: docs/deploy.md"
echo
