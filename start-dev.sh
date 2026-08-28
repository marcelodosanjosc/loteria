#!/usr/bin/env bash

# ==============================================================================
# Script de Inicialização do Ambiente de Desenvolvimento (Docker Compose)
# - Detecção dinâmica de portas livres para Frontend, Backend e PostgreSQL
# - Hot-reload ativado e sincronização de dependências
# ==============================================================================

set -e

# Cores para terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Função para encontrar a primeira porta livre a partir de uma porta base
find_available_port() {
  local start_port=$1
  local service_name=$2
  local port=$start_port

  while true; do
    if python3 -c "import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    s.bind(('0.0.0.0', int(sys.argv[1])))
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)" "$port" >/dev/null 2>&1; then
      if [ "$port" -ne "$start_port" ]; then
        echo -e "${YELLOW}[!] Porta padrão $start_port para $service_name está em uso. Usando porta $port.${NC}" >&2
      fi
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done
}

echo -e "${CYAN}${BOLD}=== Verificando portas disponíveis... ===${NC}"

# Localização de portas livres
FRONTEND_PORT=$(find_available_port 3000 "Frontend")
BACKEND_PORT=$(find_available_port 8000 "Backend")
DB_PORT=$(find_available_port 5432 "PostgreSQL")

export FRONTEND_PORT
export BACKEND_PORT
export DB_PORT

echo ""
echo -e "${GREEN}${BOLD}====================================================${NC}"
echo -e "${GREEN}${BOLD}       Ambiente de Desenvolvimento Loteria          ${NC}"
echo -e "${GREEN}${BOLD}====================================================${NC}"
echo -e "  🌐 ${BOLD}Frontend:${NC}     http://localhost:${FRONTEND_PORT}"
echo -e "  ⚙️  ${BOLD}Backend API:${NC}  http://localhost:${BACKEND_PORT}"
echo -e "  📖 ${BOLD}Swagger Docs:${NC} http://localhost:${BACKEND_PORT}/docs"
echo -e "  🗄️  ${BOLD}PostgreSQL:${NC}   localhost:${DB_PORT}"
echo -e "${GREEN}${BOLD}====================================================${NC}"
echo ""

# Identifica se o primeiro argumento é um subcomando direto do docker compose
SUBCOMMANDS="build down logs ps config stop restart pull exec run"
FIRST_ARG="$1"

if [[ " $SUBCOMMANDS " =~ " $FIRST_ARG " ]]; then
  echo -e "${CYAN}Executando 'docker compose $FIRST_ARG'...${NC}"
  docker compose -f docker-compose.dev.yml "$@"
else
  echo -e "${CYAN}Iniciando containers com Docker Compose...${NC}"
  docker compose -f docker-compose.dev.yml up "$@"
fi
