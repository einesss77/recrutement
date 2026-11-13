"""Deliver existing prospect cards to the owner's Telegram. Never access LinkedIn."""
import argparse,datetime,fcntl,json,os,re,sqlite3,subprocess,uuid
from pathlib import Path
from zoneinfo import ZoneInfo

PARIS=ZoneInfo('Europe/Paris')
BATCH_SIZE=5
DAILY_LIMIT=50
INTERVAL_SECONDS=1800

def atomic(file,value):
    temp=file.with_name(file.name+'.'+uuid.uuid4().hex+'.tmp')
    with temp.open('x',encoding='utf-8') as f:
        os.chmod(temp,0o600);json.dump(value,f,ensure_ascii=False,indent=2);f.flush();os.fsync(f.fileno())
    if file.exists():
        info=file.stat();os.chown(temp,info.st_uid,info.st_gid)
    os.replace(temp,file)

def profile_url(value):
    if not isinstance(value,str) or not re.fullmatch(r'https://www\.linkedin\.com/in/[A-Za-z0-9%_-]+/?',value):raise ValueError('Invalid public profile URL')
    return value.lower().rstrip('/')+'/'

def database(root):
    db=sqlite3.connect(root/'delivery.sqlite3');db.execute('PRAGMA busy_timeout=10000');db.execute('PRAGMA synchronous=FULL')
    db.executescript('CREATE TABLE IF NOT EXISTS batches(id TEXT PRIMARY KEY,day TEXT NOT NULL,attempted_at TEXT NOT NULL,status TEXT NOT NULL,count INTEGER NOT NULL,body TEXT NOT NULL,message_id TEXT); CREATE TABLE IF NOT EXISTS contacts(url TEXT PRIMARY KEY,batch_id TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);')
    return db

def import_delivered_seed(db,file):
    if not file or not file.exists():return
    data=json.loads(file.read_text());key='seed:'+data['id']
    if db.execute('SELECT 1 FROM meta WHERE key=?',(key,)).fetchone():return
    receipt=data.get('telegramReceipt',{})
    if data.get('deliveryStatus')!='delivered' or receipt.get('success') is not True or not receipt.get('message_id'):raise ValueError('Initial delivery is not confirmed')
    at=datetime.datetime.fromisoformat(data['deliveredAt']);assert at.tzinfo
    people=data['prospects'];urls=[profile_url(p['profileUrl']) for p in people];assert len(set(urls))==len(urls)
    with db:
        db.execute('INSERT INTO batches VALUES(?,?,?,?,?,?,?)',(data['id'],at.astimezone(PARIS).date().isoformat(),at.isoformat(),'delivered',len(people),data['text'],str(receipt['message_id'])))
        for url,p in zip(urls,people):db.execute('INSERT INTO contacts VALUES(?,?,?)',(url,data['id'],json.dumps(p,ensure_ascii=False)))
        db.execute('INSERT INTO meta VALUES(?,?)',(key,'imported'))

def queued_source(source_file,now):
    """Keep unsent daily exports when latest.json is replaced by tomorrow's run."""
    paths=[source_file];archive=source_file.parent/'batches';today=now.astimezone(PARIS).date()
    if archive.exists():
        for file in sorted(archive.glob('*.json')):
            if file.is_symlink() or not re.fullmatch(r'\d{4}-\d{2}-\d{2}\.json',file.name):continue
            try:age=(today-datetime.date.fromisoformat(file.stem)).days
            except ValueError:continue
            if 0<=age<=7:paths.append(file)
    exports=[]
    for file in paths:
        if not file.exists():continue
        value=json.loads(file.read_text());date=datetime.date.fromisoformat(value['date'])
        if not isinstance(value.get('prospects'),list):raise ValueError('Invalid public research export')
        exports.append((date,value))
    if not exports:raise ValueError('No public research source available')
    people=[];dates=[]
    for date,value in sorted(exports,key=lambda pair:pair[0]):
        if not 0<=(today-date).days<=7:continue
        dates.append(date.isoformat())
        people.extend({**p,'_sourceDate':date.isoformat()} for p in value['prospects'] if isinstance(p,dict))
    return{'date':max(dates) if dates else max(date for date,_ in exports).isoformat(),'sourceDates':sorted(set(dates)),'prospects':people}

def candidates(db,source):
    known={row[0] for row in db.execute('SELECT url FROM contacts')};seen=set();people=[]
    for p in source.get('prospects',[]):
        try:
            if any(not isinstance(p.get(k),str) or not p[k].strip() for k in ['name','company','role','location','profileUrl','commercialAngle']):continue
            url=profile_url(p['profileUrl'])
            if url in known or url in seen:continue
            seen.add(url);people.append({**p,'profileUrl':url})
        except (ValueError,TypeError):continue
    return people

def message(people,date):
    compact=lambda value,limit:re.sub(r'\s+',' ',value).strip()[:limit]
    lines=['B&M — '+str(len(people))+' contacts US à examiner','Invitations à envoyer manuellement depuis ton compte.','']
    for index,p in enumerate(people,1):
        angle=re.sub(r'^Hypothèse\s*:\s*','',p['commercialAngle'],flags=re.I)
        lines.extend([f"{index}. {compact(p['name'],90)} — {compact(p['company'],100)}",compact(p['role'],120)+' · '+compact(p['location'],100),'Intérêt possible : '+compact(angle,230),p['profileUrl'],''])
    lines.append(f'Sources publiques du {date}. Fonction actuelle, intérêt réel et statut de connexion/invitation à confirmer. Aucun profil ouvert par cet envoi.')
    text='\n'.join(lines)
    if len(text)>4000:raise ValueError('Telegram message too long')
    return text

def send_telegram(target,text):
    command=['runuser','-u','hermes','--','env','HOME=/home/hermes','HERMES_HOME=/home/hermes/.hermes','/home/hermes/.hermes/hermes-agent/.hermes/bin/hermes','send','--to',target,'--json']
    result=subprocess.run(command,input=text,text=True,capture_output=True,timeout=45)
    if result.returncode:raise RuntimeError('Telegram sender did not confirm delivery')
    receipt=json.loads(result.stdout)
    if receipt.get('success') is not True or not receipt.get('message_id') or str(receipt.get('chat_id'))!=target.split(':')[1]:raise RuntimeError('Telegram receipt incomplete or wrong recipient')
    return str(receipt['message_id'])

def run(root,source_file,settings_file,status_file,seed=None,sender=send_telegram,now=None,dry_run=False):
    now=now or datetime.datetime.now(datetime.timezone.utc);assert now.tzinfo
    root.mkdir(parents=True,exist_ok=True,mode=0o700)
    with (root/'delivery.lock').open('a+') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:return {'status':'already-running'}
        config=json.loads((root/'config.json').read_text());target=config['target']
        if not re.fullmatch(r'telegram:[1-9][0-9]*(?::[0-9]+)?',target):raise ValueError('Only configured private owner Telegram chat is allowed')
        settings=json.loads(settings_file.read_text());source=queued_source(source_file,now)
        db=database(root)
        try:
            import_delivered_seed(db,seed)
            day=now.astimezone(PARIS).date().isoformat();remaining=candidates(db,source)
            today=db.execute('SELECT COALESCE(SUM(count),0) FROM batches WHERE day=?',(day,)).fetchone()[0]
            latest=db.execute('SELECT attempted_at FROM batches ORDER BY attempted_at DESC LIMIT 1').fetchone()
            pending=db.execute("SELECT COUNT(*) FROM batches WHERE status IN ('sending','uncertain')").fetchone()[0]
            state={'checkedAt':now.isoformat(),'enabled':settings.get('enabled') is True,'batchSize':BATCH_SIZE,'intervalMinutes':30,'dailyLimit':DAILY_LIMIT,'todayReserved':today,'remainingContacts':len(remaining),'sourceDate':source.get('date'),'sourceDates':source.get('sourceDates',[]),'automaticInvitations':False,'linkedInAccess':False}
            def report(status,**extra):
                value={**state,'status':status,**extra}
                if not dry_run:atomic(status_file,value)
                return value
            if pending:return report('uncertain-delivery-needs-review')
            if not state['enabled']:return report('paused')
            if today>=DAILY_LIMIT:return report('daily-limit-reached')
            if latest:
                eligible=datetime.datetime.fromisoformat(latest[0])+datetime.timedelta(seconds=INTERVAL_SECONDS)
                if now<eligible:return report('not-due',eligibleAfter=eligible.isoformat())
            source_day=datetime.date.fromisoformat(source['date']);age=(now.astimezone(PARIS).date()-source_day).days
            if age<0 or age>7:return report('waiting-for-current-source')
            if not remaining:return report('waiting-for-new-prospects')
            # Spread companies within each batch; URL deduplication remains global.
            chosen=[];companies=set()
            for p in remaining:
                if p['company'].casefold() in companies:continue
                companies.add(p['company'].casefold());chosen.append(p)
                if len(chosen)>=min(BATCH_SIZE,DAILY_LIMIT-today):break
            text=message(chosen,', '.join(sorted({p['_sourceDate'] for p in chosen})))
            if dry_run:return report('ready',nextBatchCount=len(chosen))
            identifier=uuid.uuid4().hex
            # Reserve before sending. A timeout or crash must never resend these contacts.
            with db:
                db.execute('INSERT INTO batches VALUES(?,?,?,?,?,?,?)',(identifier,day,now.isoformat(),'sending',len(chosen),text,None))
                for p in chosen:db.execute('INSERT INTO contacts VALUES(?,?,?)',(p['profileUrl'],identifier,json.dumps(p,ensure_ascii=False)))
            try:receipt=sender(target,text)
            except Exception:
                with db:db.execute("UPDATE batches SET status='uncertain' WHERE id=?",(identifier,))
                atomic(settings_file,{**settings,'enabled':False})
                return report('uncertain-delivery-needs-review',enabled=False)
            with db:db.execute("UPDATE batches SET status='delivered',message_id=? WHERE id=?",(str(receipt),identifier))
            return report('delivered',sentCount=len(chosen),telegramMessageId=str(receipt),todayReserved=today+len(chosen),remainingContacts=len(remaining)-len(chosen),eligibleAfter=(now+datetime.timedelta(seconds=INTERVAL_SECONDS)).isoformat())
        finally:db.close()

def main():
    os.umask(0o077);parser=argparse.ArgumentParser();parser.add_argument('--dry-run',action='store_true');args=parser.parse_args()
    print(json.dumps(run(Path('/var/lib/bm-prospect-batches'),Path('/var/lib/bm-linkedin/state/prospecting/latest.json'),Path('/home/hermes/bm-agents/livrables/prospects-us-manual/auto-delivery-settings.json'),Path('/home/hermes/bm-agents/livrables/prospects-us-manual/auto-delivery-status.json'),Path('/var/lib/bm-linkedin/state/prospecting/manual-batches/first-five-20261113.json'),dry_run=args.dry_run),ensure_ascii=False))

if __name__=='__main__':main()
