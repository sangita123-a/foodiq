#!/usr/bin/env bash
# Foodiq deploy helper — Vercel (frontend) + Render (backend).
# Optional fallback: SSH. Logs written to deploy.log for CI artifacts.
set -euo pipefail

TARGET="${1:-staging}" # development | staging | production
COMPONENT="${2:-all}"  # frontend | backend | all
LOG_FILE="${DEPLOY_LOG_FILE:-deploy.log}"
REQUIRE_DEPLOY="${REQUIRE_DEPLOY:-false}"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "[deploy] $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[deploy] target=${TARGET} component=${COMPONENT}"
echo "[deploy] sha=${GITHUB_SHA:-local} ref=${GITHUB_REF:-local}"
echo "========================================"

deploy_vercel() {
  if [[ -z "${VERCEL_TOKEN:-}" || -z "${VERCEL_ORG_ID:-}" || -z "${VERCEL_PROJECT_ID:-}" ]]; then
    echo "[deploy] Vercel secrets missing — skip frontend"
    return 1
  fi

  export VERCEL_ORG_ID VERCEL_PROJECT_ID
  local env_name="preview"
  local prod_flag=()
  if [[ "$TARGET" == "production" ]]; then
    env_name="production"
    prod_flag=(--prod)
  elif [[ "$TARGET" == "staging" ]]; then
    env_name="preview"
  else
    env_name="preview"
  fi

  echo "[deploy] Vercel pull (${env_name})..."
  npx --yes vercel@39 pull --yes --environment="${env_name}" --token="$VERCEL_TOKEN"

  echo "[deploy] Vercel build..."
  if [[ "$TARGET" == "production" ]]; then
    npx --yes vercel@39 build --prod --token="$VERCEL_TOKEN"
  else
    npx --yes vercel@39 build --token="$VERCEL_TOKEN"
  fi

  echo "[deploy] Vercel deploy..."
  local url
  url=$(npx --yes vercel@39 deploy --prebuilt "${prod_flag[@]}" --token="$VERCEL_TOKEN")
  echo "[deploy] Vercel URL: ${url}"
  echo "VERCEL_DEPLOY_URL=${url}" >> "$GITHUB_OUTPUT" 2>/dev/null || true
  echo "$url" > vercel-deploy-url.txt
  return 0
}

deploy_render() {
  if [[ -z "${RENDER_API_KEY:-}" ]]; then
    echo "[deploy] RENDER_API_KEY missing — skip backend Render deploy"
    return 1
  fi

  echo "[deploy] Triggering Render backend deploy..."
  if [[ -n "${RENDER_SERVICE_ID:-}" ]]; then
    node scripts/ci/trigger-render-deploy.js | tee -a render-deploy.log
  else
    node scripts/ci/deploy-render.js | tee -a render-deploy.log
  fi
  echo "[deploy] Render backend OK"
  return 0
}

deploy_ssh_backend() {
  if [[ -z "${DEPLOY_SSH_HOST:-}" || -z "${DEPLOY_SSH_USER:-}" ]]; then
    return 1
  fi
  local remote_dir="${DEPLOY_BACKEND_PATH:-/var/www/foodiq-api}"
  local key_file="${DEPLOY_SSH_KEY_FILE:-$HOME/.ssh/foodiq_deploy}"
  mkdir -p "$(dirname "$key_file")"
  if [[ -n "${DEPLOY_SSH_KEY:-}" && ! -f "$key_file" ]]; then
    echo "$DEPLOY_SSH_KEY" > "$key_file"
    chmod 600 "$key_file"
  fi
  echo "[deploy] SSH rsync backend → ${DEPLOY_SSH_HOST}:${remote_dir}"
  rsync -az --delete \
    --exclude node_modules --exclude .env --exclude uploads --exclude logs \
    -e "ssh -i ${key_file} -o StrictHostKeyChecking=accept-new" \
    foodiq-frontend/foodiq-backend/ \
    "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:${remote_dir}/"
  ssh -i "$key_file" -o StrictHostKeyChecking=accept-new \
    "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}" \
    "cd ${remote_dir} && npm ci --omit=dev && (pm2 restart foodiq-api || true)"
  echo "[deploy] SSH backend OK"
}

ROLLBACK_REF="${ROLLBACK_REF:-}"
if [[ -n "$ROLLBACK_REF" ]]; then
  echo "[deploy] rollback mode ref=${ROLLBACK_REF}"
fi

ok=0
frontend_ok=0
backend_ok=0

if [[ "$COMPONENT" == "frontend" || "$COMPONENT" == "all" ]]; then
  if deploy_vercel; then
    ok=1
    frontend_ok=1
  fi
fi

if [[ "$COMPONENT" == "backend" || "$COMPONENT" == "all" ]]; then
  if deploy_render; then
    ok=1
    backend_ok=1
  elif deploy_ssh_backend; then
    ok=1
    backend_ok=1
  fi
fi

echo "========================================"
echo "[deploy] summary frontend_ok=${frontend_ok} backend_ok=${backend_ok}"
echo "========================================"

if [[ "$ok" -eq 0 ]]; then
  echo "[deploy] No deploy credentials configured (ARTIFACT_ONLY=true)."
  echo "Set VERCEL_* for frontend and RENDER_API_KEY (+ optional RENDER_SERVICE_ID) for backend."
  if [[ "$REQUIRE_DEPLOY" == "true" ]]; then
    echo "[deploy] REQUIRE_DEPLOY=true — failing"
    exit 1
  fi
  exit 0
fi

# Production all-component deploys should have both sides when secrets exist
if [[ "$REQUIRE_DEPLOY" == "true" && "$COMPONENT" == "all" ]]; then
  if [[ -n "${VERCEL_TOKEN:-}" && "$frontend_ok" -eq 0 ]]; then
    echo "[deploy] Frontend deploy required but failed"
    exit 1
  fi
  if [[ -n "${RENDER_API_KEY:-}" && "$backend_ok" -eq 0 ]]; then
    echo "[deploy] Backend deploy required but failed"
    exit 1
  fi
fi

echo "[deploy] Done"
