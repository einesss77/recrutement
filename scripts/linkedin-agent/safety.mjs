import {readFile,writeFile,mkdir,open,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

export const browserStateRoot=()=>process.env.STUDIO_AGENT_LOCAL_DIR||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../.local/linkedin-agent');
export const holdFile=root=>path.join(root,'linkedin-automation-hold.json');
export async function automationHold(root=browserStateRoot()){
 try{const value=JSON.parse(await readFile(holdFile(root),'utf8'));return{reason:typeof value.reason==='string'?value.reason:'Arrêt de sécurité LinkedIn : vérification humaine requise.'};}
 catch(error){if(error.code==='ENOENT')return null;return{reason:'Arrêt de sécurité LinkedIn illisible : aucune opération autorisée.'};}
}
export async function holdAutomation(root,reason){
 await mkdir(root,{recursive:true,mode:0o700});
 try{await writeFile(holdFile(root),JSON.stringify({version:1,reason:String(reason).slice(0,600),at:new Date().toISOString(),requiresHumanReview:true}),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
}
export async function assertAutomationAllowed(root=browserStateRoot()){
 const hold=await automationHold(root);if(hold)throw Error(hold.reason);
}
// Count attempts, including failed CDP connections. Never auto-retry a failed visit.
export async function reserveBrowserVisit(root=browserStateRoot(),now=new Date()){
 await assertAutomationAllowed(root);await mkdir(root,{recursive:true,mode:0o700});
 const file=path.join(root,'browser-visit-budget.json'),lockFile=file+'.lock';let lock,temp;
 try{
  try{lock=await open(lockFile,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw Error('Budget LinkedIn verrouillé : aucune nouvelle opération.');throw error;}
  await assertAutomationAllowed(root);
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  let ledger;try{ledger=JSON.parse(await readFile(file,'utf8'));if(!/^\d{4}-\d{2}-\d{2}$/.test(ledger.day)||!Number.isInteger(ledger.attempts)||ledger.attempts<0)throw Error('Budget LinkedIn invalide.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const attempts=ledger?.day===day?ledger.attempts:0;
  if(attempts>=2)throw Error('Limite atteinte : deux sessions LinkedIn par jour au maximum. Aucune nouvelle opération.');
  temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify({day,attempts:attempts+1,lastAttemptAt:now.toISOString()}),{mode:0o600,flag:'wx'});await rename(temp,file);
 }finally{if(temp)await unlink(temp).catch(()=>{});if(lock){await lock.close();await unlink(lockFile);}}
}
