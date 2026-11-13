import importlib.util, json, os, tempfile, threading, unittest, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
class StoreTests(unittest.TestCase):
 def test_authentication_and_atomic_compare_and_swap(self):
  with tempfile.TemporaryDirectory() as temp:
   os.environ['STUDIO_AGENT_LOCAL_DIR']=temp
   Path(temp,'connection.json').write_text(json.dumps({'token':'test-token-only'}))
   spec=importlib.util.spec_from_file_location('store',Path(__file__).with_name('store.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
   server=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
   url=f'http://127.0.0.1:{server.server_port}/linkedin-agent-store'
   def call(method='GET',etag=None,body=None,token='test-token-only'):
    headers={'Authorization':'Bearer '+token}
    if etag:headers['If-Match']=etag
    elif method=='PUT':headers['If-None-Match']='*'
    req=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers=headers,method=method)
    try:
     with urllib.request.urlopen(req) as r:return r.status,r.headers.get('ETag'),r.read()
    except urllib.error.HTTPError as e:return e.code,None,b''
   try:
    self.assertEqual(call(token='wrong')[0],401);self.assertEqual(call()[0],404)
    document={'version':2,'accounts':{'person':{},'organization':{}},'revision':1}
    self.assertEqual(call('PUT',body=document)[0],200);status,etag,raw=call();self.assertEqual(json.loads(raw),document)
    self.assertEqual(call('PUT','"stale"',dict(document,revision=2))[0],412)
    with ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda n:call('PUT',etag,dict(document,revision=n))[0],[2,3]))
    self.assertEqual(sorted(results),[200,412]);self.assertIn(json.loads(call()[2])['revision'],[2,3])
   finally:server.shutdown();server.server_close();thread.join()
if __name__=='__main__':unittest.main()
