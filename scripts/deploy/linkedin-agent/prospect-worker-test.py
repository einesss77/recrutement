import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('prospect_worker',Path(__file__).with_name('prospect-worker.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def person(slug='alice',name='Alice Example',location='Austin, Texas, United States'):
 return dict(name=name,company='Example Tech',role='Founder IT staffing',location=location,segment='it-services-founder',profileUrl='https://www.linkedin.com/in/'+slug+'/',sourceUrl='https://www.linkedin.com/in/'+slug+'/',roleEvidence='Founder IT staffing',usEvidence=location,commercialAngle='Hypothèse de coopération IT',uncertainties='Budget, effectif, besoins et ouverture Europe non confirmés')
class Tests(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.db=m.database(self.root)
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def test_seed_and_dedup(self):
  p=person();u=m.profile_url(p['profileUrl']);self.db.execute('INSERT INTO prospects VALUES(?,?,?,?)',(u,m.norm(p['name'])+'|'+m.norm(p['company']),'seed',json.dumps(p)));self.db.commit()
  got,rej=m.qualify([p,person('alice-other')],self.db,50);self.assertEqual(got,[]);self.assertEqual(len(rej),2)
 def test_strict_us_and_sources(self):
  bad=person('eu',location='Paris, France');fake=person('bad');fake['profileUrl']='https://linkedin.com.evil.test/in/fake/'
  got,rej=m.qualify([bad,fake,person()],self.db,50);self.assertEqual(len(got),1);self.assertEqual(len(rej),2);self.assertEqual(got[0]['outreachStatus'],'Not contacted')
 def test_within_batch_normalization_and_cap(self):
  got,_=m.qualify([person(),person('ALICE?tracking=1'),person('bob','Bob Example')],self.db,1);self.assertEqual(len(got),1)
 def test_reject_non_research_tools(self):
  for kind in ['command_execution','file_change','mcp_tool_call','collab_tool_call']:
   with self.assertRaises(RuntimeError):m.allowed_event({'type':'item.completed','item':{'type':kind}})
  self.assertEqual(m.allowed_event({'type':'item.completed','item':{'type':'web_search'}}),1)
 def test_paused_never_researches(self):
  m.atomic(self.root/'schedule.json',{'enabled':False,'time':'07:00','dailyTarget':50});self.assertEqual(m.run(self.root,True)['status'],'paused')
 def test_daily_cap_prevents_extra_manual_run(self):
  m.atomic(self.root/'schedule.json',{'enabled':True,'time':'07:00','dailyTarget':1});p=person();day=m.datetime.datetime.now(m.PARIS).date().isoformat()
  self.db.execute('INSERT INTO prospects VALUES(?,?,?,?)',(m.profile_url(p['profileUrl']),'alice|example',day,json.dumps(p)));self.db.commit()
  self.assertEqual(m.run(self.root,True)['status'],'daily-target-already-met')
if __name__=='__main__':unittest.main()
