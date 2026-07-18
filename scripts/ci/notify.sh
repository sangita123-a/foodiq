#!/usr/bin/env bash
# Notify Slack / Teams / Email webhook on CI events.
# Env: SLACK_WEBHOOK_URL, TEAMS_WEBHOOK_URL, STATUS, TITLE, DETAILS, RUN_URL
set -euo pipefail

STATUS="${STATUS:-unknown}"
TITLE="${TITLE:-Foodiq CI}"
DETAILS="${DETAILS:-}"
RUN_URL="${RUN_URL:-}"
COLOR="good"
if [[ "$STATUS" == "failure" || "$STATUS" == "failed" ]]; then COLOR="danger"; fi
if [[ "$STATUS" == "cancelled" ]]; then COLOR="warning"; fi

TEXT="*${TITLE}*\nStatus: \`${STATUS}\`\n${DETAILS}\n${RUN_URL}"

if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  curl -sS -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"${TITLE}: ${STATUS}\",\"attachments\":[{\"color\":\"${COLOR}\",\"text\":\"${DETAILS}\\n${RUN_URL}\"}]}" \
    "$SLACK_WEBHOOK_URL" >/dev/null || true
  echo "Slack notified"
fi

if [[ -n "${TEAMS_WEBHOOK_URL:-}" ]]; then
  curl -sS -X POST -H 'Content-type: application/json' \
    --data "{\"@type\":\"MessageCard\",\"summary\":\"${TITLE}\",\"themeColor\":\"0078D7\",\"title\":\"${TITLE}\",\"text\":\"Status: ${STATUS}<br/>${DETAILS}<br/>${RUN_URL}\"}" \
    "$TEAMS_WEBHOOK_URL" >/dev/null || true
  echo "Teams notified"
fi

if [[ -n "${NOTIFY_EMAIL_WEBHOOK:-}" ]]; then
  curl -sS -X POST -H 'Content-type: application/json' \
    --data "{\"subject\":\"${TITLE}: ${STATUS}\",\"body\":\"${DETAILS}\\n${RUN_URL}\"}" \
    "$NOTIFY_EMAIL_WEBHOOK" >/dev/null || true
  echo "Email webhook notified"
fi

if [[ -z "${SLACK_WEBHOOK_URL:-}" && -z "${TEAMS_WEBHOOK_URL:-}" && -z "${NOTIFY_EMAIL_WEBHOOK:-}" ]]; then
  echo "No notification webhooks configured — skipping"
fi
