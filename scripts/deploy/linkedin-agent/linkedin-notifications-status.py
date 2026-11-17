#!/usr/bin/python3
"""Read-only notification status for the existing Hermes Telegram bot."""
import argparse,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('action',choices=['status']);parser.parse_args()
file=Path('/home/hermes/bm-agents/livrables/linkedin-notifications/status.json')
if not file.exists():raise SystemExit('Notifications non installées ou premier contrôle indisponible.')
def property(unit,name):
    result=subprocess.run(['/usr/bin/systemctl','show',unit,'--property='+name,'--value'],text=True,capture_output=True,timeout=5)
    if result.returncode:raise SystemExit('État systemd des notifications indisponible.')
    return result.stdout.strip()
status=json.loads(file.read_text())
status['timerActive']=property('bm-linkedin-notifications.timer','ActiveState')=='active'
status['publisherHooksConfigured']=all('bm-linkedin-notifications.service' in property('bm-linkedin.service',name).split() for name in ['OnSuccess','OnFailure'])
print(json.dumps(status,ensure_ascii=False))
