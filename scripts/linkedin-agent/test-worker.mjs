// Explicit integration check against loopback only. No request can reach LinkedIn or the live studio.
import {createServer} from 'node:http';
import {mkdtemp,writeFile,readFile,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {repoRoot} from '../linkedin-agent.mjs';
import {holdAutomation,holdFile} from './safety.mjs';
import {captionFingerprint,browserIdentity} from './browser.mjs';
const execute=promisify(execFile),local=await mkdtemp(path.join(repoRoot,'.local','worker-contract-test-'));
const token=randomBytes(32).toString('base64url'),calls=[],accounts=['organization','person'];let publicationStatus='published',browserJobs=false;
const browserPost={title:'Test isolé',caption:'Aucun contenu envoyé à LinkedIn : serveur de test local.',template:'editorial',theme:'dark',slides:[]};
const server=createServer(async(req,res)=>{
 let raw='';for await(const chunk of req)raw+=chunk;
 assert.equal(req.headers.authorization,'Bearer '+token);const payload=JSON.parse(raw);calls.push({route:req.url,payload});
 res.setHeader('Content-Type','application/json');
 if(req.url.endsWith('/claim')){const accountId=accounts.shift();res.end(JSON.stringify({job:accountId?{id:'contract-test-job-'+accountId+(browserJobs?'-browser':''),accountId,kind:'publish',leaseToken:'contract-test-lease-'+accountId,payload:browserJobs?{provider:'hermes-browser',format:'text',post:browserPost,fingerprint:captionFingerprint(browserPost),target:{accountId,profileUrl:browserIdentity.profileUrl,targetKey:'organization:106357560',organizationId:'106357560',adminUrl:browserIdentity.organization.adminUrl}}:{format:'text',post:browserPost}}:null}));}
 else if(req.url.endsWith('/browser-result'))res.end(JSON.stringify({status:payload.status,message:payload.message}));
 else if(req.url.endsWith('/publish'))res.end(JSON.stringify({status:publicationStatus,urn:'local-test-only',message:'Réponse simulée dans le test isolé.'}));
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
 // An empty queue must NEVER contact the authenticated browser, even when it is down.
 let cdpCalls=0;const cdp=createServer((_req,res)=>{cdpCalls++;res.writeHead(503);res.end('test-only CDP unavailable');});
 await new Promise(resolve=>cdp.listen(0,'127.0.0.1',resolve));
 try{
  const browserEnv={...env,STUDIO_LINKEDIN_PROVIDER:'hermes-browser',STUDIO_LINKEDIN_BROWSER_URL:`http://127.0.0.1:${cdp.address().port}`};
  const result=await execute(process.execPath,['scripts/linkedin-agent.mjs','run','--max-jobs','1'],{cwd:repoRoot,env:browserEnv,windowsHide:true});
  assert.match(result.stdout,/complete/);assert.equal(cdpCalls,0);assert.equal(calls.filter(x=>x.route.endsWith('/browser-connect')).length,0);
  await holdAutomation(local,'Avertissement LinkedIn : vérification humaine requise.');
  const before=calls.filter(x=>x.route.endsWith('/claim')).length;
  const held=await execute(process.execPath,['scripts/linkedin-agent.mjs','run'],{cwd:repoRoot,env:{...browserEnv,STUDIO_CODEX_BINARY:path.join(local,'must-not-run.exe')},windowsHide:true});
  assert.match(held.stdout,/automation-held/);assert.equal(cdpCalls,0);assert.equal(calls.filter(x=>x.route.endsWith('/claim')).length,before);
  assert.equal(calls.filter(x=>x.route.endsWith('/heartbeat')).at(-1).payload.status,'error');
  await unlink(holdFile(local));
 for(const status of ['blocked','uncertain']){
  publicationStatus=status;accounts.push('organization','person');
  const count=calls.filter(x=>x.route.endsWith('/publish')).length;
  const result=await execute(process.execPath,['scripts/linkedin-agent.mjs','run','--max-jobs','4'],{cwd:repoRoot,env,windowsHide:true}).then(()=>{throw Error('An unconfirmed publication must fail the worker');},error=>error);
  assert.equal(result.code,1);assert.match(result.stdout,/publication-unconfirmed/);
  assert.equal(calls.filter(x=>x.route.endsWith('/heartbeat')).at(-1).payload.status,'error');
  assert.equal(calls.filter(x=>x.route.endsWith('/publish')).length,count+1,'Stop after the first failed publication');
  accounts.length=0;
 }
  browserJobs=true;accounts.push('organization');
  const failed=await execute(process.execPath,['scripts/linkedin-agent.mjs','run','--max-jobs','1'],{cwd:repoRoot,env:browserEnv,windowsHide:true}).then(()=>{throw Error('An actual browser job must fail when CDP is down');},error=>error);
  assert.equal(failed.code,1);assert.match(failed.stdout,/publication-unconfirmed/);assert.ok(cdpCalls>0);
  const visits=cdpCalls,claims=calls.filter(x=>x.route.endsWith('/claim')).length;
  const blockedRetry=await execute(process.execPath,['scripts/linkedin-agent.mjs','run'],{cwd:repoRoot,env:browserEnv,windowsHide:true});
  assert.match(blockedRetry.stdout,/automation-held/);assert.equal(cdpCalls,visits);assert.equal(calls.filter(x=>x.route.endsWith('/claim')).length,claims);
  await execute(process.execPath,['scripts/linkedin-agent.mjs','connect-browser'],{cwd:repoRoot,env:browserEnv,windowsHide:true}).then(()=>{throw Error('Held browser connection must not be checked again');},error=>assert.equal(error.code,1));assert.equal(cdpCalls,visits);
 }finally{await new Promise(resolve=>cdp.close(resolve));}
 console.log(JSON.stringify({pairingImport:true,privateCredentialFile:true,subscriptionAuth:true,accounts:['organization','person'],publishRequestsToLoopback:2,secretNotLogged:true,noLinkedInCalls:true}));
}finally{
 await Promise.allSettled([unlink(pairFile),unlink(path.join(local,'connection.json'))]);
 await new Promise(resolve=>server.close(resolve));
}
