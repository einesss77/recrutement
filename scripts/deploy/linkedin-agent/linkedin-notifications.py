"""Notify the existing private owner chat from durable local results. No LinkedIn access."""
import argparse,datetime,json,os,re,sqlite3,subprocess,uuid
from contextlib import closing
from pathlib import Path
from urllib.parse import unquote,urlsplit,quote
from zoneinfo import ZoneInfo

UTC=datetime.timezone.utc
PARIS=ZoneInfo('Europe/Paris')
NAMES={'person':'Inès Favre','organization':'B&M Digital Consulting'}
ROOT=Path('/var/lib/bm-linkedin-notifications')
SHARED=Path('/home/hermes/bm-agents/livrables/linkedin-notifications')
STORE=Path('/var/lib/bm-linkedin/state/agent-store.sqlite3')
HOLD=Path('/var/lib/bm-linkedin/state/linkedin-automation-hold.json')

def stamp(now):return now.astimezone(UTC).isoformat()
def parsed(value):
    try:
        result=datetime.datetime.fromisoformat(str(value).replace('Z','+00:00'))
        return result if result.tzinfo else None
    except (ValueError,TypeError):return None

def compact(value,limit=500):
    text=re.sub(r'\s+',' ',str(value or '')).strip()
    text=re.sub(r'Bearer\s+\S+','Bearer [masqué]',text,flags=re.I)
    text=re.sub(r'\b(?:sk-|bm_worker_|li_agent_)[A-Za-z0-9_-]{12,}','[clé masquée]',text)
    text=re.sub(r'((?:token|password|secret|access_token|refresh_token)\s*[=:]\s*)[^\s,;]+',r'\1[masqué]',text,flags=re.I)
    return text[:limit]

def atomic(file,value):
    file.parent.mkdir(parents=True,exist_ok=True)
    temp=file.with_name(file.name+'.'+uuid.uuid4().hex+'.tmp')
    with temp.open('x',encoding='utf-8') as f:
        os.chmod(temp,0o600);json.dump(value,f,ensure_ascii=False,indent=2);f.flush();os.fsync(f.fileno())
    if file.exists() and hasattr(os,'chown'):
        info=file.stat();os.chown(temp,info.st_uid,info.st_gid)
    os.replace(temp,file)

def proof(item):
    try:
        url=urlsplit(item.get('linkedinUrl',''))
        match=re.fullmatch(r'/feed/update/(urn:li:(?:activity|share|ugcPost):[0-9]+)/?',unquote(url.path))
        if url.scheme!='https' or url.hostname not in ['www.linkedin.com','linkedin.com'] or url.username or url.password or url.port or not match:return None
        urn=match[1]
        if item.get('linkedinUrn') and item['linkedinUrn']!=urn:return None
        return {'urn':urn,'url':'https://www.linkedin.com/feed/update/'+urn+'/'}
    except (ValueError,TypeError):return None

def snapshot(store=STORE):
    uri='file:'+quote(store.resolve().as_posix(),safe='/:')+'?mode=ro'
    with closing(sqlite3.connect(uri,uri=True,timeout=5)) as db:
        row=db.execute('SELECT body FROM document WHERE id=1').fetchone()
    if not row:raise ValueError('Agent state missing')
    doc=json.loads(row[0]);accounts={}
    for account in NAMES:
        source=doc['accounts'][account]
        accounts[account]={'enabled':source['config']['enabled'],'queue':[],'jobs':[]}
        for q in source['queue']:
            safe={key:q.get(key) for key in ['id','day','status','publishAt','publishedAt','confirmedAt','publishJobId','linkedinUrl','linkedinUrn','error']}
            safe['title']=compact(q.get('post',{}).get('title'),180);accounts[account]['queue'].append(safe)
        for j in source['jobs']:
            accounts[account]['jobs'].append({k:j.get(k) for k in ['id','itemId','status','phase','message','createdAt','finishedAt','leaseExpiresAt']})
    return {'accounts':accounts,'worker':{k:doc['worker'].get(k) for k in ['status','message','lastSeenAt']}}

def local_health():
    def state(unit):
        result=subprocess.run(['/usr/bin/systemctl','show',unit,'--property=ActiveState','--value'],text=True,capture_output=True,timeout=5)
        if result.returncode:raise RuntimeError('Local service status unavailable')
        return result.stdout.strip()
    hold=None
    if HOLD.exists():
        try:
            if HOLD.stat().st_size>16000:raise ValueError('Oversized hold')
            value=json.loads(HOLD.read_text());hold={'reason':compact(value.get('reason')),'at':value.get('at')}
        except (ValueError,OSError):hold={'reason':'Le verrou de sécurité est illisible ; le moteur doit être vérifié.'}
    service=state('bm-linkedin.service')
    return {'timerActive':state('bm-linkedin.timer')=='active','serviceFailed':service=='failed','serviceRunning':service in ['active','activating','reloading'],'hold':hold}

def database(root):
    db=sqlite3.connect(root/'delivery.sqlite3',timeout=10);os.chmod(root/'delivery.sqlite3',0o600);db.execute('PRAGMA synchronous=FULL')
    db.executescript('CREATE TABLE IF NOT EXISTS events(key TEXT PRIMARY KEY,kind TEXT NOT NULL,account TEXT,status TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL,sent_at TEXT,message_id TEXT,error TEXT); CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);')
    return db

def reserve(db,key,kind,account,body,now,status='sending'):
    with db:
        return db.execute('INSERT OR IGNORE INTO events(key,kind,account,status,body,created_at) VALUES(?,?,?,?,?,?)',(key,kind,account,status,body,stamp(now))).rowcount==1

def meta(db,key,default=None):
    row=db.execute('SELECT value FROM meta WHERE key=?',(key,)).fetchone()
    return json.loads(row[0]) if row else default

def save_meta(db,key,value):
    with db:db.execute('INSERT OR REPLACE INTO meta VALUES(?,?)',(key,json.dumps(value)))

def publication_event(account,q):
    p=proof(q)
    if q.get('status')!='published' or not p:return None
    when=parsed(q.get('publishedAt'))
    time=when.astimezone(PARIS).strftime('%d/%m à %H:%M, heure de Paris') if when else 'Résultat confirmé dans le journal de publication.'
    body='Publication LinkedIn confirmée\n'+NAMES[account]+'\n\n'+compact(q.get('title'),180)+'\n'+time+'\n'+p['url']
    return {'key':'published:'+account+':'+p['urn'],'kind':'published','account':account,'body':body}

def problems(doc,now,activation_day,grace_minutes):
    result=[]
    for account,a in doc['accounts'].items():
        if not a.get('enabled'):continue
        jobs={j['id']:j for j in a.get('jobs',[])}
        for q in a['queue']:
            if not q.get('day') or q['day']<activation_day:continue
            job=jobs.get(q.get('publishJobId'),{});at=parsed(q.get('publishAt'));lease=parsed(job.get('leaseExpiresAt'))
            reason=None
            if q['status'] in ['blocked','uncertain']:reason=q.get('error') or job.get('message') or 'La publication demande une vérification.'
            elif q['status']=='publishing' and lease and now>lease:reason='Le délai de l’envoi est dépassé et son résultat n’est pas confirmé. Vérifier le reçu avant toute reprise.'
            elif q['status'] in ['scheduled','draft'] and at and now>at+datetime.timedelta(minutes=grace_minutes):reason='Le créneau est dépassé sans publication confirmée.'+(' Le contenu attend une validation.' if q['status']=='draft' else '')
            elif q['status']=='published' and not proof(q):reason='Le journal indique une publication sans permalien LinkedIn valide. Sa confirmation doit être vérifiée.'
            if not reason:continue
            identity=q.get('publishJobId') or q.get('publishAt') or q['id']
            key='problem:'+account+':'+q['id']+':'+identity
            body='Blocage LinkedIn — '+NAMES[account]+'\n\n'+compact(q.get('title'),180)+'\n'+compact(reason)+'\n\nDemande « statut LinkedIn » ici pour le détail. Aucun renvoi automatique d’un envoi incertain.'
            result.append({'key':key,'kind':'blocked','account':account,'body':body})
    return result

def global_problem(doc,health,now):
    enabled=[account for account,a in doc['accounts'].items() if a.get('enabled')]
    if not enabled:return None
    worker=doc.get('worker',{});last=parsed(worker.get('lastSeenAt'))
    if health.get('sourceError'):reason='Impossible de lire l’état réel de l’agent. Le service doit être vérifié.'
    elif health.get('hold'):reason=health['hold'].get('reason') or 'Le moteur est arrêté pour vérification.'
    elif not health.get('timerActive',True):reason='Le calendrier de publication du VPS est arrêté alors que les comptes sont activés.'
    elif health.get('serviceFailed') and worker.get('status')!='error':reason='Le service de publication s’est arrêté en erreur avant de confirmer son résultat.'
    elif health.get('serviceFailed') or worker.get('status')=='error':reason=worker.get('message') or 'Le moteur de publication s’est arrêté en erreur.'
    elif not last or now-last>datetime.timedelta(minutes=75):reason='Le moteur de publication ne donne plus signe de vie depuis plus de 75 minutes.'
    else:return None
    return {'accounts':enabled,'reason':compact(reason)}

def send_telegram(target,text):
    if not re.fullmatch(r'telegram:[1-9][0-9]*(?::[0-9]+)?',target):raise ValueError('Only the verified private owner chat is permitted')
    command=['runuser','-u','hermes','--','env','HOME=/home/hermes','HERMES_HOME=/home/hermes/.hermes','/home/hermes/.hermes/hermes-agent/.hermes/bin/hermes','send','--to',target,'--json']
    result=subprocess.run(command,input=text,text=True,capture_output=True,timeout=45)
    if result.returncode:raise RuntimeError('Telegram delivery not confirmed')
    receipt=json.loads(result.stdout)
    if receipt.get('success') is not True or not receipt.get('message_id') or str(receipt.get('chat_id'))!=target.split(':')[1]:raise RuntimeError('Telegram receipt incomplete or wrong recipient')
    return str(receipt['message_id'])

def run(root=ROOT,shared=SHARED,reader=snapshot,health_reader=local_health,sender=send_telegram,now=None,activate=False):
    now=now or datetime.datetime.now(UTC);assert now.tzinfo
    root.mkdir(parents=True,exist_ok=True,mode=0o700)
    config=json.loads((root/'config.json').read_text());target=config['target']
    if not re.fullmatch(r'telegram:[1-9][0-9]*(?::[0-9]+)?',target):raise ValueError('Invalid private owner target')
    initialized=parsed(config['activatedAt'])
    if not initialized:raise ValueError('Activation timestamp required')
    activation_day=initialized.astimezone(PARIS).date().isoformat()
    try:doc=reader();health=health_reader()
    except Exception:
        doc={'accounts':{account:{'enabled':True,'queue':[],'jobs':[]} for account in NAMES},'worker':{}}
        health={'sourceError':True}
    db=database(root);sent=[];uncertain=[]
    try:
        # A process that died after reserving a message cannot prove non-delivery.
        with db:db.execute("UPDATE events SET status='uncertain-delivery',error=? WHERE status='sending' AND created_at<?",('Processus interrompu après réservation ; aucun renvoi automatique.',stamp(now-datetime.timedelta(minutes=5))))
        events=[event for account,a in doc['accounts'].items() for q in a['queue'] if (event:=publication_event(account,q))]
        if not meta(db,'baselineReady',False):
            if health.get('sourceError'):raise RuntimeError('Cannot initialize without verified local state')
            for event in events:reserve(db,**event,now=now,status='baseline')
            save_meta(db,'baselineReady',True)
        issue=global_problem(doc,health,now);specific=problems(doc,now,activation_day,int(config.get('missedSlotGraceMinutes',35)))
        incident=meta(db,'openIncident')
        if issue:
            if not incident:incident={'id':uuid.uuid4().hex,'startedAt':stamp(now)};save_meta(db,'openIncident',incident)
            details='\n\n'+specific[0]['body'].split('\n\n',1)[-1] if specific else ''
            body='Agent LinkedIn bloqué\nComptes concernés : '+', '.join(NAMES[a] for a in issue['accounts'])+'\n\nCause : '+issue['reason']+details+'\n\nUne seule alerte est envoyée pour ce blocage tant qu’il persiste.'
            events.append({'key':'incident:'+incident['id'],'kind':'blocked','account':','.join(issue['accounts']),'body':body})
            for event in specific:reserve(db,**event,now=now,status='covered-by-incident')
        else:
            if incident and not health.get('serviceRunning',False):save_meta(db,'openIncident',None)
            events.extend(specific)
        if activate:
            lines=['Notifications LinkedIn activées','Profil Inès et page B&M.','Tu recevras le lien de chaque publication confirmée, ou une alerte si l’agent bloque.','Aucune visite LinkedIn supplémentaire.','','Dernières publications confirmées :']
            for account,a in doc['accounts'].items():
                latest=sorted((q for q in a['queue'] if publication_event(account,q)),key=lambda q:q.get('publishedAt') or '',reverse=True)[:1]
                for q in latest:lines.extend([NAMES[account]+' — '+compact(q.get('title'),150),proof(q)['url']])
            events.insert(0,{'key':'activation:v1','kind':'activation','account':'person,organization','body':'\n'.join(lines)})
        attempts=0
        for event in events:
            if attempts>=4:break
            if not reserve(db,**event,now=now):continue
            attempts+=1
            try:
                message_id=sender(target,event['body'])
                if not message_id:raise RuntimeError('Missing Telegram message id')
                with db:db.execute("UPDATE events SET status='delivered',sent_at=?,message_id=? WHERE key=?",(stamp(now),str(message_id),event['key']))
                sent.append({'kind':event['kind'],'account':event['account'],'messageId':str(message_id)})
            except Exception:
                # A timeout can still mean delivered. Never resend this event blindly.
                with db:db.execute("UPDATE events SET status='uncertain-delivery',error=? WHERE key=?",('Accusé de réception Telegram absent ; aucun renvoi automatique.',event['key']))
                uncertain.append({'kind':event['kind'],'account':event['account']})
        totals=dict(db.execute('SELECT status,COUNT(*) FROM events GROUP BY status'))
        recent=[{'kind':row[0],'account':row[1],'status':row[2],'createdAt':row[3],'sentAt':row[4]} for row in db.execute("SELECT kind,account,status,created_at,sent_at FROM events WHERE status NOT IN ('baseline','covered-by-incident') ORDER BY rowid DESC LIMIT 6")]
        status={'checkedAt':stamp(now),'enabled':True,'scope':'Notifications LinkedIn Inès et B&M ; aucun accès LinkedIn','sent':sent,'uncertain':uncertain,'deliveryHealthy':totals.get('uncertain-delivery',0)==0,'totals':totals,'recent':recent,'incidentOpen':bool(issue),'sourceAvailable':not health.get('sourceError',False)}
        atomic(shared/'status.json',status)
        return status
    finally:db.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--activate',action='store_true');args=parser.parse_args()
    result=run(activate=args.activate);print(json.dumps(result,ensure_ascii=False))
    raise SystemExit(1 if result['uncertain'] else 0)
