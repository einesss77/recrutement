import copy,datetime,importlib.util,json,sqlite3,subprocess,tempfile,unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('notifications',Path(__file__).with_name('linkedin-notifications.py'))
n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
NOW=datetime.datetime(2026,11,17,18,30,tzinfo=datetime.timezone.utc)

def post(account='person',status='published',number='123456789',**extra):
    return {'id':account+'-'+number,'day':'2026-11-17','status':status,'publishAt':(NOW-datetime.timedelta(minutes=1)).isoformat(),'publishedAt':NOW.isoformat(),'title':'Des consultants IT pour votre équipe','linkedinUrl':'https://www.linkedin.com/feed/update/urn%3Ali%3Aactivity%3A'+number+'/','linkedinUrn':'urn:li:activity:'+number,**extra}

class NotificationsTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'private';self.shared=Path(self.temp.name)/'shared';self.root.mkdir()
        (self.root/'config.json').write_text(json.dumps({'target':'telegram:12345','activatedAt':NOW.isoformat(),'missedSlotGraceMinutes':35}))
        self.doc={'accounts':{a:{'enabled':True,'queue':[],'jobs':[]} for a in n.NAMES},'worker':{'status':'online','lastSeenAt':NOW.isoformat(),'message':''}}
        self.health={'timerActive':True,'serviceFailed':False,'hold':None};self.sent=[]
    def sender(self,target,body):self.assertEqual(target,'telegram:12345');self.sent.append(body);return str(len(self.sent))
    def run_at(self,now=NOW,**kw):
        return n.run(root=self.root,shared=self.shared,reader=lambda:copy.deepcopy(self.doc),health_reader=lambda:copy.deepcopy(self.health),sender=self.sender,now=now,**kw)
    def test_activation_includes_real_latest_links_once_without_backlog(self):
        self.doc['accounts']['person']['queue']=[post()];self.doc['accounts']['organization']['queue']=[post('organization',number='222222222')]
        r=self.run_at(activate=True);self.assertEqual(len(r['sent']),1);self.assertIn('Notifications LinkedIn activées',self.sent[0]);self.assertIn('123456789/',self.sent[0]);self.assertIn('222222222/',self.sent[0])
        self.run_at(activate=True);self.run_at();self.assertEqual(len(self.sent),1)
    def test_both_accounts_notify_only_confirmed_posts_and_never_repeat(self):
        self.run_at()
        for a,i in [('person','111111111'),('organization','222222222')]:self.doc['accounts'][a]['queue'].append(post(a,number=i))
        r=self.run_at();self.assertEqual(len(r['sent']),2);self.assertIn('Inès Favre',self.sent[0]);self.assertIn('B&M Digital Consulting',self.sent[1]);self.assertTrue(all('https://www.linkedin.com/feed/update/urn:li:activity:' in m for m in self.sent))
        self.doc['worker']['lastSeenAt']=(NOW+datetime.timedelta(minutes=30)).isoformat();self.run_at(NOW+datetime.timedelta(minutes=30));self.assertEqual(len(self.sent),2)
    def test_late_reconciliation_is_announced_without_changing_publication_day(self):
        self.doc['accounts']['person']['queue']=[post(status='uncertain',day='2026-11-16')];self.run_at()
        q=self.doc['accounts']['person']['queue'][0];q['status']='published';q['publishedAt']='2026-11-16T09:00:00Z';q['confirmedAt']=NOW.isoformat()
        self.run_at();self.assertEqual(len(self.sent),1);self.assertIn('16/11 à 10:00',self.sent[0])
    def test_one_global_alert_until_recovery_then_new_incident_can_alert(self):
        self.run_at();self.health['hold']={'reason':'LinkedIn demande une connexion.','at':NOW.isoformat()}
        self.run_at();self.doc['worker']['lastSeenAt']=(NOW+datetime.timedelta(minutes=30)).isoformat();self.run_at(NOW+datetime.timedelta(minutes=30));self.assertEqual(len(self.sent),1);self.assertIn('Inès Favre, B&M Digital Consulting',self.sent[0])
        self.health['hold']=None;self.run_at();self.health['hold']={'reason':'LinkedIn demande une connexion.'};self.run_at();self.assertEqual(len(self.sent),2)
    def test_global_failure_covers_specific_post_and_does_not_repeat_after_recovery(self):
        self.run_at();self.doc['accounts']['person']['queue']=[post(status='uncertain',error='Résultat inconnu',publishJobId='job-1')];self.health['hold']={'reason':'Résultat inconnu'}
        self.run_at();self.assertEqual(len(self.sent),1);self.health['hold']=None;self.run_at();self.assertEqual(len(self.sent),1)
    def test_timer_stopped_and_worker_failure_do_not_spam_during_one_outage(self):
        self.run_at();self.health['timerActive']=False;self.run_at();self.health['serviceFailed']=True;self.doc['worker']['status']='error';self.doc['worker']['message']='Connexion indisponible';self.run_at();self.assertEqual(len(self.sent),1)
    def test_crashed_service_does_not_present_its_last_progress_message_as_the_cause(self):
        self.run_at();self.health['serviceFailed']=True;self.doc['worker'].update(status='busy',message='Préparation de la publication.')
        self.run_at();self.assertEqual(len(self.sent),1);self.assertIn('arrêté en erreur',self.sent[0]);self.assertNotIn('Préparation de la publication.',self.sent[0])
    def test_temporary_healthy_heartbeat_during_a_run_does_not_reset_an_incident(self):
        self.run_at();self.health['hold']={'reason':'Connexion'};self.run_at()
        self.health.update(hold=None,serviceRunning=True);self.doc['worker']['status']='busy';self.run_at()
        self.health['hold']={'reason':'Connexion'};self.run_at();self.assertEqual(len(self.sent),1)
    def test_interrupted_delivery_is_visible_and_is_not_retried(self):
        self.run_at();q=post();self.doc['accounts']['person']['queue']=[q];event=n.publication_event('person',q)
        db=n.database(self.root)
        try:n.reserve(db,**event,now=NOW-datetime.timedelta(minutes=6))
        finally:db.close()
        result=self.run_at();self.assertFalse(result['deliveryHealthy']);self.assertEqual(result['totals']['uncertain-delivery'],1);self.assertEqual(self.sent,[])
    def test_missed_slot_and_expired_inflight_lease_alert_without_retrying_posts(self):
        self.run_at();q=post(status='scheduled',publishAt=(NOW-datetime.timedelta(minutes=34)).isoformat());self.doc['accounts']['person']['queue']=[q];self.run_at();self.assertEqual(self.sent,[])
        self.run_at(NOW+datetime.timedelta(minutes=2));self.run_at(NOW+datetime.timedelta(minutes=3));self.assertEqual(len(self.sent),1)
        self.doc['accounts']['organization']['queue']=[post('organization',status='publishing',publishJobId='stuck')];self.doc['accounts']['organization']['jobs']=[{'id':'stuck','leaseExpiresAt':(NOW-datetime.timedelta(seconds=1)).isoformat()}]
        self.run_at();self.assertEqual(len(self.sent),2);self.assertIn('délai de l’envoi',self.sent[1]);self.assertEqual(q['status'],'scheduled')
    def test_paused_accounts_and_old_uncertain_posts_are_silent(self):
        for a in self.doc['accounts'].values():a['enabled']=False;a['queue']=[post(status='uncertain',error='Ancien')]
        self.health['timerActive']=False;self.run_at();self.assertEqual(self.sent,[])
        for a in self.doc['accounts'].values():a['enabled']=True;a['queue'][0]['day']='2026-11-14'
        self.health['timerActive']=True;self.run_at();self.assertEqual(self.sent,[])
    def test_ambiguous_telegram_delivery_never_retries_but_other_posts_continue(self):
        self.run_at();self.doc['accounts']['person']['queue']=[post()];calls=[]
        def failed(*args):calls.append(args);raise TimeoutError()
        r=n.run(self.root,self.shared,reader=lambda:self.doc,health_reader=lambda:self.health,sender=failed,now=NOW);self.assertEqual(len(r['uncertain']),1)
        self.run_at();self.assertEqual(len(calls),1);self.assertEqual(self.sent,[])
        self.doc['accounts']['organization']['queue']=[post('organization',number='222222222')];self.run_at();self.assertEqual(len(self.sent),1)
    def test_concurrent_cycle_cannot_resend_an_event_reserved_before_network(self):
        self.run_at();self.doc['accounts']['person']['queue']=[post()]
        def nested(target,body):
            r=self.run_at();self.assertEqual(r['sent'],[]);return self.sender(target,body)
        n.run(self.root,self.shared,reader=lambda:self.doc,health_reader=lambda:self.health,sender=nested,now=NOW);self.assertEqual(len(self.sent),1)
    def test_storage_failure_is_visible_once_instead_of_reporting_default_success(self):
        self.run_at()
        def broken():raise OSError('private internal detail')
        for _ in range(2):r=n.run(self.root,self.shared,reader=broken,health_reader=lambda:self.health,sender=self.sender,now=NOW)
        self.assertFalse(r['sourceAvailable']);self.assertEqual(len(self.sent),1);self.assertNotIn('private internal detail',self.sent[0]);self.assertIn('Impossible de lire',self.sent[0])
    def test_readonly_projection_excludes_credentials_and_full_captions(self):
        dbfile=Path(self.temp.name)/'agent.sqlite3';raw=copy.deepcopy(self.doc)
        for a in raw['accounts'].values():a.update(config={'enabled':True},secrets={'token':'VERY_PRIVATE_VALUE'});a['queue']=[{**post(),'post':{'title':'Titre','caption':'FULL_PRIVATE_CAPTION'}}]
        with closing(sqlite3.connect(dbfile)) as db:
            db.execute('CREATE TABLE document(id INTEGER PRIMARY KEY,body TEXT)');db.execute('INSERT INTO document VALUES(1,?)',(json.dumps(raw),));db.commit()
        safe=json.dumps(n.snapshot(dbfile));self.assertNotIn('VERY_PRIVATE_VALUE',safe);self.assertNotIn('FULL_PRIVATE_CAPTION',safe);self.assertIn('Titre',safe)
    def test_foreign_link_is_not_a_publication_confirmation(self):
        self.run_at();self.doc['accounts']['person']['queue']=[post(linkedinUrl='https://evil.example/feed/update/urn:li:activity:123456789/')]
        r=self.run_at();self.assertEqual(r['sent'][0]['kind'],'blocked');self.assertNotIn('Publication LinkedIn confirmée',self.sent[0])
    def test_stale_heartbeat_and_secret_redaction(self):
        self.doc['worker']['lastSeenAt']=(NOW-datetime.timedelta(minutes=80)).isoformat();self.run_at();self.assertEqual(len(self.sent),1);self.assertIn('75 minutes',self.sent[0])
        self.assertNotIn('SUPER_PRIVATE',n.compact('Erreur Bearer SUPER_PRIVATE token=SUPER_PRIVATE'))
    def test_sender_checks_private_recipient_and_transport_receipt(self):
        result=subprocess.CompletedProcess([],0,json.dumps({'success':True,'chat_id':99999,'message_id':2}),'')
        with patch.object(n.subprocess,'run',return_value=result):
            with self.assertRaises(RuntimeError):n.send_telegram('telegram:12345','test')
        with self.assertRaises(ValueError):n.send_telegram('telegram:-12345','test')
        result.stdout=json.dumps({'success':True,'chat_id':12345,'message_id':2})
        with patch.object(n.subprocess,'run',return_value=result):self.assertEqual(n.send_telegram('telegram:12345','test'),'2')

if __name__=='__main__':unittest.main()
