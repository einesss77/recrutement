import http from 'node:http';
import {mkdir,readFile,writeFile,appendFile,unlink,chmod} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import * as agent from '../../lib/linkedinAgent.ts';
import {createControl,ControlError} from './control.mjs';
import {renderPost} from './render.mjs';
const socket='/run/bm-linkedin-control/control.sock',state='/var/lib/bm-linkedin/state',shared='/var/lib/bm-linkedin-control';
const dispatch=createControl(agent,{
 prospects:async()=>({brief:JSON.parse(await readFile(state+'/prospecting/brief.json','utf8')),receipt:JSON.parse(await readFile(state+'/prospecting/receipt.json','utf8')),list:JSON.parse(await readFile(state+'/prospecting/premiere-passe-50-profils.json','utf8'))}),
 preview:async(item,accountId)=>{const media=await renderPost(item.post,'png',{repoRoot:'/opt/bm-linkedin/current',workingRoot:state+'/control-preview/'+randomUUID()});if(media.mime!=='image/png')throw new ControlError('Aperçu PNG indisponible.',503);await mkdir(shared+'/previews',{recursive:true,mode:0o750});const file=shared+'/previews/'+randomUUID()+'.png';await writeFile(file,Buffer.from(media.base64,'base64'),{mode:0o640});return{accountId,itemId:item.id,file,mime:'image/png',caption:item.post.caption};}
});
const server=http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  if(req.method!=='POST'||req.url!=='/control')return reply(404,{error:'Not found'});
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>250000)return reply(413,{error:'Requête trop volumineuse.'});}
  let input;try{input=JSON.parse(raw);}catch{throw new ControlError('JSON invalide.');}
  const requestId=randomUUID(),mutating=!['status','queue','post','prospects','preview'].includes(input?.action);
  if(mutating)await appendFile(shared+'/audit.jsonl',JSON.stringify({at:new Date().toISOString(),requestId,phase:'requested',source:'telegram-hermes',input})+'\n',{mode:0o640});
  const result=await dispatch(input);
  if(mutating)await appendFile(shared+'/audit.jsonl',JSON.stringify({at:new Date().toISOString(),requestId,phase:'completed',accountId:input.accountId,action:input.action,result})+'\n',{mode:0o640});
  reply(200,{ok:true,requestId,checkedAt:new Date().toISOString(),result});
 }catch(error){if(!(error instanceof agent.AgentError)&&!(error instanceof ControlError))console.error('Control failure:',String(error.message).replace(/Bearer\s+\S+/gi,'Bearer [redacted]').slice(0,800));reply(error instanceof agent.AgentError?error.status:error instanceof ControlError?error.status:503,{ok:false,error:error instanceof agent.AgentError||error instanceof ControlError?error.message:'Contrôle indisponible. Consulter bm-linkedin-control.service.'});}
});
server.requestTimeout=90000;
await unlink(socket).catch(error=>{if(error.code!=='ENOENT')throw error;});
server.listen(socket,()=>{chmod(socket,0o660).catch(()=>{server.close();process.exitCode=1;});});
