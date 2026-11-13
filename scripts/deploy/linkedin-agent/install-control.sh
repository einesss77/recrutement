#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 && $# == 1 && -x $1 ]] || { echo 'root et chemin Node requis'; exit 1; }
getent passwd hermes >/dev/null || { echo 'Hermes absent : contrôle Telegram non installé'; exit 1; }
bm_node=$(readlink -f -- "$1")
bm_deploy=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
sed "s|@NODE_BINARY@|$bm_node|g" "$bm_deploy/bm-linkedin-control.service" > /etc/systemd/system/bm-linkedin-control.service
chmod 0644 /etc/systemd/system/bm-linkedin-control.service
install -o root -g root -m0755 "$bm_deploy/control-cli.py" /usr/local/bin/bm-linkedin-control
install -d -o root -g root -m0755 /home/hermes/.hermes/skills/social-media/bm-linkedin-control
install -o root -g root -m0644 "$bm_deploy/../scripts/linkedin-agent/skills/telegram-control/SKILL.md" /home/hermes/.hermes/skills/social-media/bm-linkedin-control/SKILL.md
python3 - <<'PY'
from pathlib import Path
import datetime,shutil
p=Path('/home/hermes/.hermes/SOUL.md')
marker='# Pilotage LinkedIn depuis Telegram — 2026-11-13'
text=p.read_text()
if marker not in text:
 backup=Path('/var/lib/bm-linkedin/state')/('hermes-soul-before-control-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.md')
 shutil.copyfile(p,backup);backup.chmod(0o600)
 with p.open('a') as f:
  f.write('\n\n'+marker+'\n\nÀ la demande explicite d’Eines, le bot Telegram pilote désormais le moteur indépendant de publications B&M et Ines via /usr/local/bin/bm-linkedin-control. Avant de répondre à une demande sur les posts, créations, calendrier, pause, reprise ou prospects LinkedIn, lis /home/hermes/.hermes/skills/social-media/bm-linkedin-control/SKILL.md et exécute les contrôles correspondants. Les droits hermes suffisent désormais : ne conclus plus que les résultats métier sont inaccessibles sur la seule base de journaux systemd privés ou du studio web. Commence par bm-linkedin-control status both. Une pause demandée doit être appliquée aux comptes via cet outil puis vérifiée; une pause du gateway Hermes ne bloque pas le minuteur système. Ne reprends jamais un compte pour tester. Respecte les autorisations et réglages réels; aucun succès de publication sans preuve. Le contrôle des posts ne comprend pas d’invitations automatiques ni de collecte quotidienne de prospects déjà planifiée. Ne lis ni ne copies les secrets privés du worker.\n')
PY
systemctl daemon-reload
systemctl enable --now bm-linkedin-control.service
systemctl restart bm-linkedin-control.service
for bm_attempt in 1 2 3 4 5; do
 if runuser -u hermes -- /usr/local/bin/bm-linkedin-control status both | python3 -c 'import sys,json; rows=[json.loads(x) for x in sys.stdin]; assert len(rows)==2 and all(x["ok"] for x in rows); print(json.dumps({"telegramControlReady":True,"accounts":[x["accountId"] for x in rows]}))'; then
  exit 0
 fi
 sleep 2
done
echo 'Le contrôle Telegram ne répond pas après installation' >&2
exit 1
