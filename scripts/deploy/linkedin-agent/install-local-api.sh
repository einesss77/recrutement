#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 && $# == 1 && -x $1 ]] || { echo 'root et chemin Node requis'; exit 1; }
[[ -f /var/lib/bm-linkedin/state/agent-store.sqlite3 && -f /var/lib/bm-linkedin/state/studio-store.env ]] || { echo 'Restaurer état SQLite et liaison privée avant activation'; exit 1; }
if systemctl is-active --quiet bm-linkedin.service; then echo 'Attendre la fin du cycle actif'; exit 1; fi
bm_node=$(readlink -f -- "$1")
bm_deploy=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
for unit in bm-linkedin-api.service bm-linkedin-store.service bm-linkedin-backup.service bm-linkedin-backup.timer; do
 sed "s|@NODE_BINARY@|$bm_node|g" "$bm_deploy/$unit" > "/etc/systemd/system/$unit"
 chmod 0644 "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl restart bm-linkedin-store.service
systemctl restart bm-linkedin-api.service
systemctl enable bm-linkedin-store.service bm-linkedin-api.service
systemctl enable --now bm-linkedin-backup.timer
systemctl start bm-linkedin-backup.service
