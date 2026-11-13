import datetime,importlib.util,json,sqlite3,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('delivery',Path(__file__).with_name('prospect-batch-delivery.py'));delivery=importlib.util.module_from_spec(spec);spec.loader.exec_module(delivery)
NOW=datetime.datetime(2026,11,13,15,0,tzinfo=datetime.timezone.utc)

class Tests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.state=self.root/'state';self.state.mkdir()
        self.source=self.root/'source.json';self.settings=self.root/'settings.json';self.status=self.root/'status.json';self.seed=self.root/'seed.json';self.sent=[]
        (self.state/'config.json').write_text(json.dumps({'target':'telegram:12345'}));self.settings.write_text(json.dumps({'enabled':True}))
        self.people=[{'name':'Person '+str(i),'company':'Company '+str(i),'role':'Technical recruiter','location':'Austin, Texas, United States','profileUrl':'https://www.linkedin.com/in/person-'+str(i)+'/','commercialAngle':'Hypothèse : une complémentarité à qualifier.'} for i in range(65)]
        self.write_source()
    def tearDown(self):self.temp.cleanup()
    def write_source(self,date='2026-11-13'):self.source.write_text(json.dumps({'date':date,'prospects':self.people}))
    def test_calendar_keeps_initial_half_hour_phase_across_reloads(self):
        anchor=datetime.datetime.fromisoformat('2026-11-13T14:39:34+00:00')
        self.assertEqual(delivery.cadence_calendar(anchor),'*-*-* *:09,39:34 UTC')
        self.assertEqual(delivery.cadence_calendar(anchor.astimezone(delivery.PARIS)),delivery.cadence_calendar(anchor))
        with self.assertRaises(ValueError):delivery.cadence_calendar(anchor.replace(tzinfo=None))
    def test_scheduler_jitter_does_not_skip_every_other_batch_or_allow_duplicates(self):
        (self.state/'config.json').write_text(json.dumps({'target':'telegram:12345','scheduleAnchorAt':'2026-11-13T14:39:34.999+00:00'}))
        self.assertEqual(self.run_at(datetime.datetime.fromisoformat('2026-11-13T15:00:00+00:00'))['status'],'not-due')
        self.assertEqual(self.run_at(datetime.datetime.fromisoformat('2026-11-13T15:09:38+00:00'))['sentCount'],5)
        self.assertEqual(self.run_at(datetime.datetime.fromisoformat('2026-11-13T15:39:33+00:00'))['status'],'not-due')
        self.assertEqual(self.run_at(datetime.datetime.fromisoformat('2026-11-13T15:39:34.100+00:00'))['sentCount'],5)
        self.assertEqual(self.run_at(datetime.datetime.fromisoformat('2026-11-13T15:40:00+00:00'))['status'],'not-due')
        self.assertEqual(len(self.sent),2)
    def sender(self,target,text):self.assertEqual(target,'telegram:12345');self.sent.append(text);return str(len(self.sent))
    def run_at(self,now=NOW,**kwargs):return delivery.run(self.state,self.source,self.settings,self.status,self.seed,self.sender,now,**kwargs)
    def test_seed_dedup_and_half_hour_gap(self):
        self.seed.write_text(json.dumps({'id':'first','deliveryStatus':'delivered','telegramReceipt':{'success':True,'message_id':484},'deliveredAt':(NOW-datetime.timedelta(minutes=31)).isoformat(),'text':'Previously delivered','prospects':self.people[:5]}))
        result=self.run_at();self.assertEqual(result['sentCount'],5);self.assertEqual(result['todayReserved'],10)
        self.assertNotIn(self.people[0]['profileUrl'],self.sent[0]);self.assertIn(self.people[5]['profileUrl'],self.sent[0])
        self.assertEqual(self.run_at(NOW+datetime.timedelta(minutes=29))['status'],'not-due');self.assertEqual(len(self.sent),1)
        self.assertEqual(self.run_at(NOW+datetime.timedelta(minutes=30))['sentCount'],5)
    def test_daily_limit_and_global_dedup_across_days(self):
        for i in range(12):result=self.run_at(NOW+datetime.timedelta(minutes=30*i))
        self.assertEqual(len(self.sent),10);self.assertEqual(result['status'],'daily-limit-reached')
        tomorrow=NOW+datetime.timedelta(days=1);self.assertEqual(self.run_at(tomorrow)['sentCount'],5)
        db=sqlite3.connect(self.state/'delivery.sqlite3');self.assertEqual(db.execute('SELECT COUNT(*) FROM contacts').fetchone()[0],55);db.close()
    def test_delivery_uncertainty_pauses_and_never_retries(self):
        def failed(*_):raise subprocess.TimeoutExpired('sender',45)
        self.sender=failed;result=self.run_at();self.assertEqual(result['status'],'uncertain-delivery-needs-review');self.assertFalse(json.loads(self.settings.read_text())['enabled'])
        self.sender=lambda *_:self.fail('Uncertain delivery must not be retried');self.assertEqual(self.run_at(NOW+datetime.timedelta(hours=1))['status'],'uncertain-delivery-needs-review')
    def test_pause_dry_run_exhaustion_and_source_age(self):
        self.assertEqual(self.run_at(dry_run=True)['status'],'ready');self.assertEqual(self.sent,[])
        self.settings.write_text(json.dumps({'enabled':False}));self.assertEqual(self.run_at()['status'],'paused')
        self.settings.write_text(json.dumps({'enabled':True}));self.write_source('2026-11-01');self.assertEqual(self.run_at()['status'],'waiting-for-current-source')
        self.people=[];self.write_source();self.assertEqual(self.run_at()['status'],'waiting-for-new-prospects');self.assertEqual(self.sent,[])
    def test_source_duplicates_and_small_final_batch(self):
        self.people=self.people[:3]+self.people[:3];self.write_source();self.assertEqual(self.run_at()['sentCount'],3)
        self.assertEqual(self.run_at(NOW+datetime.timedelta(minutes=30))['status'],'waiting-for-new-prospects');self.assertEqual(len(self.sent),1)
    def test_bad_recipient_is_rejected_before_sending(self):
        (self.state/'config.json').write_text(json.dumps({'target':'telegram:-999'}))
        with self.assertRaises(ValueError):self.run_at()
        self.assertEqual(self.sent,[])
    def test_a_concurrent_run_cannot_reserve_another_batch(self):
        def nested(target,text):
            self.assertEqual(self.run_at()['status'],'already-running')
            return '100'
        self.sender=nested;self.assertEqual(self.run_at()['sentCount'],5)
        db=sqlite3.connect(self.state/'delivery.sqlite3');self.assertEqual(db.execute('SELECT COUNT(*) FROM contacts').fetchone()[0],5);db.close()
    def test_crash_after_reservation_never_replays_the_batch(self):
        def interrupted(*_):raise KeyboardInterrupt()
        self.sender=interrupted
        with self.assertRaises(KeyboardInterrupt):self.run_at()
        self.sender=lambda *_:self.fail('A crashed send must not be replayed')
        self.assertEqual(self.run_at(NOW+datetime.timedelta(hours=1))['status'],'uncertain-delivery-needs-review')
    def test_new_daily_export_preserves_unsent_previous_contacts(self):
        archive=self.root/'batches';archive.mkdir()
        (archive/'2026-11-13.json').write_text(json.dumps({'date':'2026-11-13','prospects':self.people[:10]}))
        self.people=self.people[10:20];self.write_source('2026-11-14')
        result=self.run_at(NOW+datetime.timedelta(days=1));self.assertEqual(result['remainingContacts'],15)
        self.assertIn('person-0/',self.sent[0]);self.assertNotIn('person-10/',self.sent[0]);self.assertIn('2026-11-13',self.sent[0])
        self.assertEqual(result['sourceDates'],['2026-11-13','2026-11-14'])
    def test_latest_and_daily_archive_are_merged_without_repeating_urls(self):
        archive=self.root/'batches';archive.mkdir()
        (archive/'2026-11-13.json').write_text(json.dumps({'date':'2026-11-13','prospects':self.people[:15]}))
        self.people=self.people[:10];self.write_source()
        self.assertEqual(self.run_at(dry_run=True)['remainingContacts'],15)
    def test_future_exports_cannot_hide_the_current_queue(self):
        archive=self.root/'batches';archive.mkdir()
        (archive/'2026-11-13.json').write_text(json.dumps({'date':'2026-11-13','prospects':self.people[:5]}))
        self.write_source('2026-11-14')
        self.assertEqual(self.run_at()['sentCount'],5);self.assertIn('2026-11-13',self.sent[0])
    def test_old_archive_is_not_reopened_or_reparsed_each_tick(self):
        archive=self.root/'batches';archive.mkdir();(archive/'2025-01-01.json').write_text('old invalid file should not be read')
        self.assertEqual(self.run_at(dry_run=True)['status'],'ready')
    def test_daily_research_feeds_delivery_and_excludes_people_from_previous_days(self):
        spec=importlib.util.spec_from_file_location('research',Path(__file__).with_name('prospect-worker.py'));research=importlib.util.module_from_spec(spec);spec.loader.exec_module(research)
        source_root=self.root/'research';source_root.mkdir();self.source=source_root/'latest.json';db=research.database(source_root)
        def collect(day,people):
            records=[{**p,'segment':'it-recruiter','sourceUrl':'https://example.com/team/','roleEvidence':'Technical recruiter','usEvidence':p['location'],'uncertainties':'Budget et besoin inconnus.'} for p in people]
            accepted,rejected=research.qualify(records,db,50)
            for p in accepted:db.execute('INSERT INTO prospects VALUES(?,?,?,?)',(p['profileUrl'],research.norm(p['name'])+'|'+research.norm(p['company']),day,json.dumps(p)))
            db.commit();research.materialize(source_root,db,day,50,'Fixture; no web request')
            return accepted,rejected
        try:
            collect('2026-11-13',self.people[:5]);self.assertEqual(self.run_at()['sentCount'],5)
            accepted,rejected=collect('2026-11-14',self.people[:10]);self.assertEqual(len(accepted),5);self.assertEqual(len(rejected),5)
            result=self.run_at(NOW+datetime.timedelta(days=1));self.assertEqual(result['sentCount'],5);self.assertEqual(result['todayReserved'],5)
            self.assertIn('person-5/',self.sent[1]);self.assertNotIn('person-0/',self.sent[1])
        finally:db.close()
    def test_sender_requires_exact_recipient_and_real_receipt(self):
        result=subprocess.CompletedProcess([],0,json.dumps({'success':True,'chat_id':'99999','message_id':2}), '')
        with patch.object(delivery.subprocess,'run',return_value=result):
            with self.assertRaises(RuntimeError):delivery.send_telegram('telegram:12345','Test')
        result.stdout=json.dumps({'success':True,'chat_id':12345,'message_id':2})
        with patch.object(delivery.subprocess,'run',return_value=result):self.assertEqual(delivery.send_telegram('telegram:12345','Test'),'2')

if __name__=='__main__':unittest.main()
