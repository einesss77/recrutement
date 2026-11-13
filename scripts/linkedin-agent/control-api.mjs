import http from 'node:http';
import {mkdir,readFile,writeFile,appendFile,unlink,chmod,rename} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import * as agent from '../../lib/linkedinAgent.ts';
import {createControl,ControlError} from './control.mjs';
import {renderPost} from './render.mjs';
const socket='/run/bm-linkedin-control/control.sock',state='/var/lib/bm-linkedin/state',shared='/var/lib/bm-linkedin-control';
const optionalJson=async(file,fallback)=>{try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return fallback;throw error;}};
const saveJson=async(file,data)=>{const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(data,null,2),{mode:0o600});await rename(temp,file);};
async function researchStatus(){
 const config=await optionalJson(state+'/prospecting/schedule.json',null),status=await optionalJson(state+'/prospecting/research-status.json',null);
 let timerActive=false;try{timerActive=(await promisify(execFile)('/usr/bin/systemctl',['is-active','bm-linkedin-prospects.timer'],{timeout:3000})).stdout.trim()==='active';}catch{}
 return{schedule:config,status,timerActive,dailySchedulerActive:timerActive&&config?.enabled===true,automaticInvitationsEnabled:false};
}
const dispatch=createControl(agent,{
 prospects:async()=>({brief:JSON.parse(await readFile(state+'/prospecting/brief.json','utf8')),receipt:JSON.parse(await readFile(state+'/prospecting/receipt.json','utf8')),research:await researchStatus(),list:await optionalJson(state+'/prospecting/latest.json',JSON.parse(await readFile(state+'/prospecting/premiere-passe-50-profils.json','utf8')))}),
 research:async(action)=>{
  if(action==='prospecting-status')return researchStatus();
  const file=state+'/prospecting/schedule.json',config=await optionalJson(file,null);if(!config)throw new ControlError('La routine de recherche n’est pas installée.',503);
  if(action==='prospecting-pause'||action==='prospecting-resume'){config.enabled=action==='prospecting-resume';await saveJson(file,config);}
  if(action==='prospecting-run'){
   if(!config.enabled)throw new ControlError('La recherche est en pause. Demander une reprise explicite avant de lancer une recherche.');
   await saveJson(state+'/prospecting/request.json',{id:randomUUID(),at:new Date().toISOString()});
   return{queued:true,message:'Recherche demandée au prochain passage (cinq minutes maximum). Le quota quotidien et les doublons restent contrôlés.'};
  }
  return researchStatus();
 },
 preview:async(item,accountId)=>{const media=await renderPost(item.post,'png',{repoRoot:'/opt/bm-linkedin/current',workingRoot:state+'/control-preview/'+randomUUID()});if(media.mime!=='image/png')throw new ControlError('Aperçu PNG indisponible.',503);await mkdir(shared+'/previews',{recursive:true,mode:0o750});const file=shared+'/previews/'+randomUUID()+'.png';await writeFile(file,Buffer.from(media.base64,'base64'),{mode:0o640});return{accountId,itemId:item.id,file,mime:'image/png',caption:item.post.caption};}
});
const server=http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  if(req.method!=='POST'||req.url!=='/control')return reply(404,{error:'Not found'});
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>250000)return reply(413,{error:'Requête trop volumineuse.'});}
  let input;try{input=JSON.parse(raw);}catch{throw new ControlError('JSON invalide.');}
  const requestId=randomUUID(),mutating=!['status','queue','post','prospects','preview','prospecting-status'].includes(input?.action);
  if(mutating)await appendFile(shared+'/audit.jsonl',JSON.stringify({at:new Date().toISOString(),requestId,phase:'requested',source:'telegram-hermes',input})+'\n',{mode:0o640});
  const result=await dispatch(input);
  if(mutating)await appendFile(shared+'/audit.jsonl',JSON.stringify({at:new Date().toISOString(),requestId,phase:'completed',accountId:input.accountId,action:input.action,result})+'\n',{mode:0o640});
  reply(200,{ok:true,requestId,checkedAt:new Date().toISOString(),result});
 }catch(error){if(!(error instanceof agent.AgentError)&&!(error instanceof ControlError))console.error('Control failure:',String(error.message).replace(/Bearer\s+\S+/gi,'Bearer [redacted]').slice(0,800));reply(error instanceof agent.AgentError?error.status:error instanceof ControlError?error.status:503,{ok:false,error:error instanceof agent.AgentError||error instanceof ControlError?error.message:'Contrôle indisponible. Consulter bm-linkedin-control.service.'});}
});
server.requestTimeout=90000;
await unlink(socket).catch(error=>{if(error.code!=='ENOENT')throw error;});
server.listen(socket,()=>{chmod(socket,0o660).catch(()=>{server.close();process.exitCode=1;});});
