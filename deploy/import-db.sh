#!/bin/sh
# Importa uma base de dados PostgreSQL existente (ex.: a que a aplicação usava antes, instalada
# diretamente no servidor) para a base de dados desta instalação, substituindo o que lá estiver.
#
# Correr a partir da pasta deploy/, com a aplicação a correr (./setup.sh):
#
#     ./import-db.sh                      # usa o DATABASE_URL de backend/.env
#     ./import-db.sh postgresql://user:pass@localhost:5432/bd
#
#   1. Exporta a origem com o pg_dump de um contentor postgres temporário (não é preciso o pg_dump
#      instalado; com --network host, "localhost" é este servidor).
#   2. Guarda uma cópia dos dados atuais da instalação em deploy/backups/ (por segurança).
#   3. Para o backend, substitui os dados e volta a arrancá-lo (aplica migrações pendentes).
#      Se a importação falhar, repõe a cópia do passo 2.
#
# A origem não é alterada. Windows: import-db.ps1 faz o mesmo.

set -u
cd "$(dirname "$0")"

GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; RESET='\033[0m'
fail() { printf "${RED}%s${RESET}\n" "$1"; shift; for l in "$@"; do echo "  $l"; done; exit 1; }
psql_db() { docker compose exec -T -e PGOPTIONS='-c client_min_messages=warning' db psql -q -v ON_ERROR_STOP=1 -U tarefas -d tarefas "$@"; }
reset_schema() { psql_db -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' >/dev/null; }

YES=0
[ "${1:-}" = '--yes' ] && { YES=1; shift; }
SOURCE=${1:-}
if [ -z "$SOURCE" ] && [ -f ../backend/.env ]; then
  SOURCE=$(grep '^DATABASE_URL=' ../backend/.env | head -n 1 | cut -d= -f2- | tr -d '"')
fi
[ -n "$SOURCE" ] || fail 'Sem origem.' 'Uso: ./import-db.sh postgresql://user:pass@localhost:5432/bd'
# O pg_dump não aceita os parâmetros do Prisma (?schema=public).
SOURCE=${SOURCE%%\?*}
MASKED=$(printf '%s' "$SOURCE" | sed 's#//[^@]*@#//***@#')

[ -f .env ] || fail 'Instalação não encontrada.' 'Corre primeiro ./setup.sh.'
docker compose exec -T db pg_isready -U tarefas </dev/null >/dev/null 2>&1 || fail 'A base de dados não está a correr.' 'Corre ./setup.sh (ou docker compose up -d).'

if [ "$YES" = 0 ]; then
  echo "Origem:  $MASKED"
  printf "${YELLOW}Isto substitui todos os dados desta instalação pelos da origem. Continuar? (s/N) ${RESET}"
  read -r a
  case "$a" in [sSyY]*) ;; *) exit 1 ;; esac
fi

mkdir -p backups
STAMP=$(date +%Y%m%d_%H%M%S)
DUMP="backups/import_$STAMP.sql"
BEFORE="backups/antes-import_$STAMP.sql"

printf '  A exportar a origem ... '
IMAGE=$(docker compose config --images db 2>/dev/null | head -n 1)
docker run --rm --network host "${IMAGE:-postgres:18-alpine}" \
  pg_dump --no-owner --no-privileges "$SOURCE" > "$DUMP" 2> "$DUMP.err" \
  || { ERR=$(cat "$DUMP.err"); rm -f "$DUMP" "$DUMP.err"; fail 'FALHOU' "$ERR" 'Confirma o URL e que o PostgreSQL de origem aceita ligações em localhost.'; }
rm -f "$DUMP.err"
printf "${GREEN}OK${RESET} (%s)\n" "$DUMP"

printf '  A guardar os dados atuais ... '
docker compose exec -T db pg_dump --no-owner --no-privileges -U tarefas tarefas </dev/null > "$BEFORE" \
  || fail 'FALHOU' 'Não foi possível copiar os dados atuais; nada foi alterado.'
printf "${GREEN}OK${RESET} (%s)\n" "$BEFORE"

printf '  A importar ... '
docker compose stop backend >/dev/null 2>&1
# O schema public é recriado vazio acima; algumas versões do pg_dump também o criam.
if reset_schema && grep -v '^CREATE SCHEMA public;$' "$DUMP" | psql_db >/dev/null 2> "$DUMP.err"; then
  rm -f "$DUMP.err"
  printf "${GREEN}OK${RESET}\n"
else
  printf "${RED}FALHOU${RESET}\n"
  cat "$DUMP.err"
  printf '  A repor os dados anteriores ... '
  reset_schema && psql_db < "$BEFORE" >/dev/null && printf "${GREEN}OK${RESET}\n" || printf "${RED}FALHOU${RESET} (repor à mão: %s)\n" "$BEFORE"
  docker compose start backend >/dev/null 2>&1
  exit 1
fi

printf '  A arrancar o backend ... '
docker compose start backend >/dev/null 2>&1
i=0
until docker compose exec -T backend wget -qO- http://127.0.0.1:3000/api/health </dev/null >/dev/null 2>&1; do
  i=$((i + 1))
  [ $i -lt 60 ] || fail 'FALHOU' 'A API não arrancou depois da importação:' "$(docker compose logs --tail 15 backend 2>&1)"
  sleep 2
done
printf "${GREEN}OK${RESET}\n"

COUNTS=$(psql_db -At -c "SELECT (SELECT count(*) FROM \"User\") || ' utilizadores, ' || (SELECT count(*) FROM \"Task\") || ' tarefas, ' || (SELECT count(*) FROM \"TaskComment\") || ' comentários'" </dev/null)
echo "  Importado: $COUNTS"
