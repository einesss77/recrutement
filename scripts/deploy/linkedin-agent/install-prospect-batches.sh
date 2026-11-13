#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'root required'; exit 1; }
bm_here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
systemctl stop bm-prospect-batches.timer 2>/dev/null || true
install -d -m0755 /usr/local/lib/bm-prospect-batches
install -m0644 "$bm_here/prospect-batch-delivery.py" /usr/local/lib/bm-prospect-batches/worker.py
install -m0755 "$bm_here/prospect-batch-control.py" /usr/local/bin/bm-linkedin-batches
python3 - <<'PY'
from pathlib import Path
import json,re,os,pwd,subprocess
root=Path('/var/lib/bm-prospect-batches');root.mkdir(parents=True,exist_ok=True,mode=0o700)
seed=json.loads(Path('/var/lib/bm-linkedin/state/prospecting/manual-batches/first-five-20261113.json').read_text());receipt=seed['telegramReceipt']
assert receipt['success'] is True and seed['deliveryStatus']=='delivered'
job=next(j for j in json.loads(Path('/home/hermes/.hermes/cron/jobs.json').read_text())['jobs'] if j['id']=='7beaec0d1cdc')
target=job['deliver'];assert re.fullmatch(r'telegram:[1-9][0-9]*(?::[0-9]+)?',target) and target.split(':')[1]==str(receipt['chat_id'])
config=root/'config.json'
if config.exists():assert json.loads(config.read_text())['target']==target
else:config.write_text(json.dumps({'version':1,'target':target}));config.chmod(0o600)
shared=Path('/home/hermes/bm-agents/livrables/prospects-us-manual');shared.mkdir(parents=True,exist_ok=True,mode=0o700)
settings=shared/'auto-delivery-settings.json'
if not settings.exists():settings.write_text(json.dumps({'version':1,'enabled':True}));settings.chmod(0o600)
result=subprocess.run(['python3','/usr/local/lib/bm-prospect-batches/worker.py','--dry-run'],capture_output=True,text=True,check=True)
status=shared/'auto-delivery-status.json';status.write_text(result.stdout);status.chmod(0o600)
x=pwd.getpwnam('hermes')
for p in [shared,settings,status]:os.chown(p,x.pw_uid,x.pw_gid)
print(result.stdout,end='')
PY
install -m0644 "$bm_here/bm-prospect-batches.service" /etc/systemd/system/bm-prospect-batches.service
install -m0644 "$bm_here/bm-prospect-batches.timer" /etc/systemd/system/bm-prospect-batches.timer
systemctl daemon-reload
systemd-analyze verify /etc/systemd/system/bm-prospect-batches.service /etc/systemd/system/bm-prospect-batches.timer
systemctl enable --now bm-prospect-batches.timer
systemctl is-active bm-prospect-batches.timer
systemctl list-timers bm-prospect-batches.timer --no-pager
