// Explicit integration check against loopback only. No request can reach LinkedIn or the live studio.
import {createServer} from 'node:http';
import {mkdtemp,writeFile,readFile,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {repoRoot} from '../linkedin-agent.mjs';
const execute=promisify(execFile),local=await mkdtemp(path.join(repoRoot,'.local','worker-contract-test-'));
const token=randomBytes(32).toString('base64url'),calls=[],accounts=['organization','person'];
const server=createServer(async(req,res)=>{
 let raw='';for await(const chunk of req)raw+=chunk;
 assert.equal(req.headers.authorization,'Bearer '+token);const payload=JSON.parse(raw);calls.push({route:req.url,payload});
 res.setHeader('Content-Type','application/json');
 if(req.url.endsWith('/claim')){const accountId=accounts.shift();res.end(JSON.stringify({job:accountId?{id:'contract-test-job-'+accountId,accountId,kind:'publish',leaseToken:'contract-test-lease-'+accountId,payload:{format:'text',post:{caption:'Aucun contenu envoyé à LinkedIn : serveur de test local.'}}}:null}));}
 else if(req.url.endsWith('/publish'))res.end(JSON.stringify({status:'published',urn:'local-test-only',message:'Réponse simulée dans le test isolé.'}));
 else res.end(JSON.stringify({ok:true}));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const studioUrl=`http://127.0.0.1:${server.address().port}`,pairFile=path.join(local,'pair.json');
await writeFile(pairFile,JSON.stringify({studioUrl,workerId:'contract-test-worker',token}),{mode:0o600});
const env={...process.env,STUDIO_AGENT_LOCAL_DIR:local};
try{
 const paired=await execute(process.execPath,['scripts/linkedin-agent.mjs','pair','--file',pairFile],{cwd:repoRoot,env,windowsHide:true});assert.ok(!paired.stdout.includes(token));
 const stored=JSON.parse(await readFile(path.join(local,'connection.json'),'utf8'));assert.equal(stored.token,token);
 const run=await execute(process.execPath,['scripts/linkedin-agent.mjs','run','--max-jobs','4'],{cwd:repoRoot,env,windowsHide:true});assert.ok(!run.stdout.includes(token));
 const publications=calls.filter(x=>x.route.endsWith('/publish'));
 assert.equal(publications.length,2);assert.deepEqual(publications.map(x=>x.payload.accountId),['organization','person']);
 for(const {payload}of publications){assert.equal(payload.jobId,'contract-test-job-'+payload.accountId);assert.equal(payload.leaseToken,'contract-test-lease-'+payload.accountId);}
 assert.equal(calls.filter(x=>x.route.endsWith('/complete')).length,0);
 assert.ok(calls.some(x=>x.route.endsWith('/heartbeat')&&x.payload.subscriptionAuth===true));
 // A browser outage must remain a business AND system failure after an empty claim.
 const cdp=createServer((_req,res)=>{res.writeHead(503);res.end('test-only CDP unavailable');});
 await new Promise(resolve=>cdp.listen(0,'127.0.0.1',resolve));
 try{
  const result=await execute(process.execPath,['scripts/linkedin-agent.mjs','run','--max-jobs','1'],{cwd:repoRoot,env:{...env,STUDIO_LINKEDIN_PROVIDER:'hermes-browser',STUDIO_LINKEDIN_BROWSER_URL:`http://127.0.0.1:${cdp.address().port}`},windowsHide:true}).then(()=>{throw Error('A browser outage must fail the worker');},error=>error);
  assert.equal(result.code,1);assert.match(result.stdout,/browser-unavailable/);
  const lastHeartbeat=calls.filter(x=>x.route.endsWith('/heartbeat')).at(-1).payload;
  assert.equal(lastHeartbeat.status,'error');assert.match(lastHeartbeat.message,/503|CDP|connect/i);assert.equal(calls.filter(x=>x.route.endsWith('/publish')).length,2);
 }finally{await new Promise(resolve=>cdp.close(resolve));}
 console.log(JSON.stringify({pairingImport:true,privateCredentialFile:true,subscriptionAuth:true,accounts:['organization','person'],publishRequestsToLoopback:2,secretNotLogged:true,noLinkedInCalls:true}));
}finally{
 await Promise.allSettled([unlink(pairFile),unlink(path.join(local,'connection.json'))]);
 await new Promise(resolve=>server.close(resolve));
}
