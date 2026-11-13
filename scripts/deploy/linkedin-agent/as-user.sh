#!/usr/bin/env bash
set -euo pipefail
if [[ $EUID -ne 0 ]]; then echo 'Exécuter ce helper avec sudo.' >&2; exit 1; fi
if [[ $# -eq 0 ]]; then echo 'Utilisation : bm-linkedin-as-user node|codex|worker [arguments]' >&2; exit 1; fi
bm_command=$1
shift
case "$bm_command" in
  node) bm_executable='@NODE_BINARY@' ;;
  codex) bm_executable='/opt/bm-linkedin/current/runtime/codex/node_modules/.bin/codex' ;;
  worker) bm_executable='@NODE_BINARY@'; set -- /opt/bm-linkedin/current/scripts/linkedin-agent.mjs "$@" ;;
  *) echo 'Commande autorisée : node, codex ou worker.' >&2; exit 1 ;;
esac
cd /opt/bm-linkedin/current
exec runuser -u bm-linkedin -- env -i \
  PATH='@NODE_DIRECTORY@:/opt/bm-linkedin/current/runtime/codex/node_modules/.bin:/usr/local/bin:/usr/bin:/bin' \
  HOME=/var/lib/bm-linkedin/home \
  CODEX_HOME=/var/lib/bm-linkedin/home/.codex \
  STUDIO_AGENT_LOCAL_DIR=/var/lib/bm-linkedin/state \
  STUDIO_AGENT_RUNTIME=vps \
  STUDIO_CODEX_BINARY=/opt/bm-linkedin/current/runtime/codex/node_modules/.bin/codex \
  PLAYWRIGHT_BROWSERS_PATH=/opt/bm-linkedin/browsers \
  STUDIO_AGENT_API_URL=http://127.0.0.1:8788 \
  NODE_ENV=production \
  "$bm_executable" "$@"
