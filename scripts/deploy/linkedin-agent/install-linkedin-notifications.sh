#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'root required'; exit 1; }
bm_here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
if systemctl is-active --quiet bm-linkedin-notifications.service; then echo 'Une notification est en cours. Attendre sa confirmation avant installation.'; exit 1; fi
systemctl stop bm-linkedin-notifications.timer 2>/dev/null || true
install -d -m0755 /usr/local/lib/bm-linkedin-notifications
install -m0644 "$bm_here/linkedin-notifications.py" /usr/local/lib/bm-linkedin-notifications/worker.py
install -m0755 "$bm_here/linkedin-notifications-status.py" /usr/local/bin/bm-linkedin-alerts
python3 - <<'PY'
from pathlib import Path
import json,re,os,pwd,datetime
source=json.loads(Path('/var/lib/bm-prospect-batches/config.json').read_text())
receipt=json.loads(Path('/var/lib/bm-linkedin/state/prospecting/manual-batches/first-five-20261113.json').read_text())['telegramReceipt']
target=source['target']
assert re.fullmatch(r'telegram:[1-9][0-9]*(?::[0-9]+)?',target)
assert receipt['success'] is True and receipt.get('message_id') and target.split(':')[1]==str(receipt['chat_id'])
root=Path('/var/lib/bm-linkedin-notifications');root.mkdir(parents=True,exist_ok=True,mode=0o700)
file=root/'config.json'
if file.exists():
 config=json.loads(file.read_text());assert config['target']==target
else:
 config={'version':1,'target':target,'activatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'missedSlotGraceMinutes':35}
 file.write_text(json.dumps(config));file.chmod(0o600)
shared=Path('/home/hermes/bm-agents/livrables/linkedin-notifications');shared.mkdir(parents=True,exist_ok=True,mode=0o700)
owner=pwd.getpwnam('hermes');os.chown(shared,owner.pw_uid,owner.pw_gid)
PY
# Baseline historical results and confirm one genuine activation message, before
# enabling hooks. An ambiguous Telegram receipt must not be sent a second time.
PYTHONDONTWRITEBYTECODE=1 python3 /usr/local/lib/bm-linkedin-notifications/worker.py --activate
chown hermes:hermes /home/hermes/bm-agents/livrables/linkedin-notifications/status.json
install -m0644 "$bm_here/bm-linkedin-notifications.service" /etc/systemd/system/bm-linkedin-notifications.service
install -m0644 "$bm_here/bm-linkedin-notifications.timer" /etc/systemd/system/bm-linkedin-notifications.timer
install -d -m0755 /etc/systemd/system/bm-linkedin.service.d
cat > /etc/systemd/system/bm-linkedin.service.d/30-telegram-notifications.conf <<'UNIT'
[Unit]
OnSuccess=bm-linkedin-notifications.service
OnFailure=bm-linkedin-notifications.service
UNIT
chmod 0644 /etc/systemd/system/bm-linkedin.service.d/30-telegram-notifications.conf
systemctl daemon-reload
systemd-analyze verify /etc/systemd/system/bm-linkedin-notifications.service /etc/systemd/system/bm-linkedin-notifications.timer /etc/systemd/system/bm-linkedin.service
systemctl enable --now bm-linkedin-notifications.timer
systemctl start bm-linkedin-notifications.service
runuser -u hermes -- /usr/local/bin/bm-linkedin-alerts status
systemctl list-timers bm-linkedin-notifications.timer --all --no-pager
for bm_skill in "$bm_here/../../linkedin-agent/skills/telegram-control/SKILL.md" "$bm_here/../scripts/linkedin-agent/skills/telegram-control/SKILL.md"; do
 if [[ -f $bm_skill ]]; then install -o root -g root -m0644 "$bm_skill" /home/hermes/.hermes/skills/social-media/bm-linkedin-control/SKILL.md; break; fi
done
python3 - <<'PY'
from pathlib import Path
p=Path('/home/hermes/.hermes/SOUL.md');marker='# Notifications LinkedIn automatiques — 17 novembre 2026'
if marker not in p.read_text():
 with p.open('a') as f:
  f.write('\n\n'+marker+'\n\nÀ la demande explicite d’Eines, les confirmations de publication et alertes de blocage Inès/B&M sont désormais envoyées automatiquement dans son chat Telegram habituel par le VPS. Lire bm-linkedin-alerts status pour l’état daté des notifications, en complément de bm-linkedin-control status both pour les publications. La déduplication et les reçus Telegram persistent aux redémarrages. Un événement livré est distinct d’un événement réservé ou d’une livraison incertaine. Ne jamais effacer le registre ni renvoyer un message ambigu pour tester. Déclenchement sur succès/échec de bm-linkedin.service et surveillance locale toutes les deux minutes, sans ouverture de LinkedIn. Une seule alerte pour un blocage qui persiste ; chaque post confirmé a son propre message et son permalien. Détection des créneaux manqués après 35 minutes et moteur silencieux après 75 minutes. Ces notifications ne modifient pas les horaires, les publications ni la remise des prospects.\n')
PY
