#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 && $# == 1 && -x $1 ]] || { echo 'root et chemin Node requis'; exit 1; }
bm_node_dir=$(dirname "$(readlink -f -- "$1")")
bm_deploy=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
install -d -o bm-linkedin -g bm-linkedin -m0700 /var/lib/bm-linkedin/state/prospecting
python3 - <<'PY'
import json,os,pwd,tempfile
from pathlib import Path
r=Path('/var/lib/bm-linkedin/state/prospecting');p=r/'schedule.json';uid=pwd.getpwnam('bm-linkedin').pw_uid;gid=pwd.getpwnam('bm-linkedin').pw_gid
if not p.exists():
 p.write_text(json.dumps({'version':1,'enabled':True,'time':'07:00','timezone':'Europe/Paris','dailyTarget':50,'maxAttemptsPerDay':3,'automaticInvitationsEnabled':False},indent=2));p.chmod(0o600);os.chown(p,uid,gid)
p=r/'brief.json'
if p.exists():
 d=json.loads(p.read_text());d['executionStatus']='Recherche quotidienne installée sur le VPS. Consulter prospecting-status pour l’activation et le dernier résultat réels.';p.write_text(json.dumps(d,ensure_ascii=False,indent=2));os.chown(p,uid,gid);p.chmod(0o600)
soul=Path('/home/hermes/.hermes/SOUL.md');marker='# Recherche US quotidienne — 2026-11-13'
if soul.exists() and marker not in soul.read_text():
 with soul.open('a') as f:f.write('\n\n'+marker+'\nEines a maintenant demandé l’activation de la recherche quotidienne de prospects US, objectif 50 nouveaux profils/jour à 07:00 Europe/Paris. Consulter bm-linkedin-control prospecting-status ines pour l’état réel; la mention antérieure non planifiée est obsolète. Lire le skill bm-linkedin-control mis à jour : commandes prospecting-pause, prospecting-resume, prospecting-run et prospects. L’envoi d’invitations reste désactivé. Ne pas annoncer un nombre trouvé avant d’avoir lu le dernier résultat daté.\n')
PY
sed "s|@NODE_DIRECTORY@|$bm_node_dir|g" "$bm_deploy/bm-linkedin-prospects.service" > /etc/systemd/system/bm-linkedin-prospects.service
install -m0644 "$bm_deploy/bm-linkedin-prospects.timer" /etc/systemd/system/bm-linkedin-prospects.timer
chmod 0644 /etc/systemd/system/bm-linkedin-prospects.service
systemd-analyze verify /etc/systemd/system/bm-linkedin-prospects.service /etc/systemd/system/bm-linkedin-prospects.timer
systemctl daemon-reload
systemctl enable --now bm-linkedin-prospects.timer
systemctl is-active bm-linkedin-prospects.timer
