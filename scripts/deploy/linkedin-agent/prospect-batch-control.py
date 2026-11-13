#!/usr/bin/python3
"""Telegram bot's local pause/resume/status for message delivery only."""
import argparse,json,os,uuid
from pathlib import Path

root=Path('/home/hermes/bm-agents/livrables/prospects-us-manual')
parser=argparse.ArgumentParser();parser.add_argument('action',choices=['status','pause','resume']);args=parser.parse_args()
file=root/'auto-delivery-settings.json';settings=json.loads(file.read_text())
if args.action!='status':
    settings['enabled']=args.action=='resume';temp=file.with_name(file.name+'.'+uuid.uuid4().hex+'.tmp')
    with temp.open('x',encoding='utf-8') as f:os.chmod(temp,0o600);json.dump(settings,f);f.flush();os.fsync(f.fileno())
    os.replace(temp,file)
status=json.loads((root/'auto-delivery-status.json').read_text())
print(json.dumps({**status,'enabled':settings.get('enabled') is True,'scope':'Telegram prospect cards only; no LinkedIn access or invitations'},ensure_ascii=False))
