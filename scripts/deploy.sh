#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# deploy.sh — Deploy completo: Frontend (Vercel) + Backend (Railway)
# Uso: ./scripts/deploy.sh [frontend|backend|all]
# ─────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

# ── Carrega variáveis do .env da raiz (se existir) ──
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

# ── Cores ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ─────────────────────────────────────
# BACKEND — Railway via GraphQL API
# (bypassa o CLI buggado que não persiste o token)
# ─────────────────────────────────────
deploy_backend() {
  echo ""
  echo "🚂 Deployando Backend no Railway..."

  # Prioridade 1: variável de ambiente RAILWAY_TOKEN (token de API permanente)
  # Prioridade 2: accessToken do railway login (~/.railway/config.json)
  if [ -z "$RAILWAY_TOKEN" ]; then
    RAILWAY_CONFIG="$HOME/.railway/config.json"

    if [ ! -f "$RAILWAY_CONFIG" ]; then
      fail "Token Railway não encontrado. Defina RAILWAY_TOKEN no .env ou execute: railway login"
    fi

    RAILWAY_TOKEN=$(python3 -c "
import json, sys
with open('$RAILWAY_CONFIG') as f:
    d = json.load(f)
u = d.get('user', {})
tok = u.get('accessToken') or u.get('token')
if not tok:
    sys.exit(1)
print(tok)
" 2>/dev/null) || fail "Token Railway não encontrado. Defina RAILWAY_TOKEN no .env ou execute: railway login"
  fi

  # IDs do projeto estrategize-backend
  SERVICE_ID="647c6c5c-1876-461c-b346-3a3bdeba697c"
  LAST_DEPLOYMENT_ID=$(curl -s -X POST https://backboard.railway.com/graphql/v2 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RAILWAY_TOKEN" \
    -d "{\"query\":\"{ deployments(first: 1, input: { serviceId: \\\"$SERVICE_ID\\\" }) { edges { node { id } } } }\"}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['deployments']['edges'][0]['node']['id'])" 2>/dev/null) \
    || fail "Não foi possível buscar deployments. Verifique: railway login"

  # Redeploy
  NEW_ID=$(curl -s -X POST https://backboard.railway.com/graphql/v2 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RAILWAY_TOKEN" \
    -d "{\"query\":\"mutation { deploymentRedeploy(id: \\\"$LAST_DEPLOYMENT_ID\\\") { id status } }\"}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['deploymentRedeploy']['id'])" 2>/dev/null) \
    || fail "Falha ao iniciar deploy no Railway"

  ok "Deploy iniciado: $NEW_ID"
  echo "   Acompanhe em: https://railway.app/project/c164f609-1210-4ef8-9002-db1c5ed0951b"

  # Aguarda resultado
  echo -n "   Aguardando build"
  for i in {1..30}; do
    sleep 5
    STATUS=$(curl -s -X POST https://backboard.railway.com/graphql/v2 \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $RAILWAY_TOKEN" \
      -d "{\"query\":\"{ deployment(id: \\\"$NEW_ID\\\") { status } }\"}" \
      | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['deployment']['status'])" 2>/dev/null)
    echo -n "."
    if [ "$STATUS" = "SUCCESS" ]; then
      echo ""
      ok "Backend deployado com sucesso!"
      return 0
    elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CRASHED" ]; then
      echo ""
      fail "Deploy falhou com status: $STATUS"
    fi
  done
  echo ""
  warn "Timeout — verifique o status em railway.app"
}

# ─────────────────────────────────────
# FRONTEND — Vercel
# ─────────────────────────────────────
deploy_frontend() {
  echo ""
  echo "▲ Deployando Frontend na Vercel..."

  if ! command -v vercel &> /dev/null; then
    npm i -g vercel --quiet
  fi

  cd "$ROOT/frontend"
  OUTPUT=$(vercel --prod --yes 2>&1)

  URL=$(echo "$OUTPUT" | grep -o 'https://app\.estrategize\.co' | head -1)
  if [ -z "$URL" ]; then
    URL=$(echo "$OUTPUT" | grep "Aliased:" | grep -o 'https://[^ ]*' | head -1)
  fi

  ok "Frontend deployado: ${URL:-https://app.estrategize.co}"
  cd "$ROOT"
}

# ─────────────────────────────────────
# MAIN
# ─────────────────────────────────────
echo "🚀 Estrategize Deploy"
echo "─────────────────────"

case "$TARGET" in
  frontend) deploy_frontend ;;
  backend)  deploy_backend ;;
  all)      deploy_frontend; deploy_backend ;;
  *) fail "Uso: ./scripts/deploy.sh [frontend|backend|all]" ;;
esac

echo ""
echo "✅ Deploy concluído!"
