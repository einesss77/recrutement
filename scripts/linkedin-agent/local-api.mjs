import http from 'node:http';
import * as agent from '../../lib/linkedinAgent.ts';
const server=http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  if(req.method!=='POST'||!req.url.startsWith('/api/studio-agent/worker/'))return reply(404,{error:'Not found'});
  const token=/^Bearer ([A-Za-z0-9_-]+)$/.exec(req.headers.authorization||'')?.[1]||'';
  const worker=await agent.authenticateWorker(token);
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4000000)return reply(413,{error:'Payload too large'});}
  const input=JSON.parse(raw||'{}'),route=req.url.split('/').at(-1);
  const scoped=fn=>agent.withAgentAccount(agent.accountId(input.accountId),fn);
  let result;
  if(route==='heartbeat')result=await agent.workerHeartbeat(worker,input);
  else if(route==='state')result=await scoped(()=>agent.agentState());
  else if(route==='browser-connect')result=await agent.connectBrowser(worker,input);
  else if(route==='browser-begin')result=await scoped(()=>agent.beginBrowserPublication(worker,input));
  else if(route==='browser-result')result=await scoped(()=>agent.finishBrowserPublication(worker,input));
  else if(route==='claim')result=await agent.claimJob(worker);
  else if(route==='complete')result=await scoped(()=>agent.completeJob(worker,input));
  else return reply(404,{error:'Not found'});
  reply(200,result);
 }catch(error){reply(error instanceof agent.AgentError?error.status:503,{error:error instanceof agent.AgentError?error.message:'Le service local de l’agent est indisponible.'});}
});
server.requestTimeout=70000;
server.listen(8788,'127.0.0.1');
