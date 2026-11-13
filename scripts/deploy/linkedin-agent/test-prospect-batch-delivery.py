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
    def test_sender_requires_exact_recipient_and_real_receipt(self):
        result=subprocess.CompletedProcess([],0,json.dumps({'success':True,'chat_id':'99999','message_id':2}), '')
        with patch.object(delivery.subprocess,'run',return_value=result):
            with self.assertRaises(RuntimeError):delivery.send_telegram('telegram:12345','Test')
        result.stdout=json.dumps({'success':True,'chat_id':12345,'message_id':2})
        with patch.object(delivery.subprocess,'run',return_value=result):self.assertEqual(delivery.send_telegram('telegram:12345','Test'),'2')

if __name__=='__main__':unittest.main()
