// Owner control for the existing Telegram bot, exposed only through a Unix socket.
const accounts=new Set(['person','organization']);
const commands=new Set(['plan','run','pause','approve','reject','profile','update','enqueue','feedback']);
const configKeys=new Set(['time','timezone','mode','enabled','publishWindowMinutes','objective','voice','facts','pillars','excludedTopics','commercialFocus','targetAudience','campaignStart']);
export class ControlError extends Error {constructor(message,status=400){super(message);this.status=status;}}
function checkFields(input,allowed){for(const key of Object.keys(input))if(!allowed.has(key))throw new ControlError('Champ non autorisé : '+key);}
export function createControl(agent,{prospects,preview}={}){
 return async input=>{
  if(!input||Array.isArray(input)||typeof input!=='object')throw new ControlError('Objet JSON requis.');
  checkFields(input,new Set(['action','accountId','itemId','payload']));
  const {action,accountId,itemId,payload}=input;
  if(!accounts.has(accountId))throw new ControlError('Choisir explicitement person (Ines) ou organization (B&M).');
  return agent.withAgentAccount(accountId,async()=>{
   if(action==='prospects')return prospects();
   if(['status','queue','post','preview'].includes(action)){
    const s=await agent.agentState();
    if(!s.storageReady)throw new ControlError('Stockage métier indisponible; aucun état par défaut ne doit être présenté comme vérifié.',503);
    if(action==='status')return{accountId,config:s.config,connection:{connected:s.connection.connected,targetConfirmed:s.connection.targetConfirmed,targetName:s.connection.targetName,provider:s.connection.provider},worker:s.worker,capabilities:s.capabilities,blockers:s.blockers,counts:Object.fromEntries([...new Set(s.queue.map(q=>q.status))].map(status=>[status,s.queue.filter(q=>q.status===status).length])),nextPosts:s.queue.filter(q=>q.status==='scheduled').sort((a,b)=>a.publishAt.localeCompare(b.publishAt)).slice(0,7).map(q=>({id:q.id,title:q.post.title,publishAt:q.publishAt,status:q.status,format:q.format})),jobs:s.jobs.slice(0,8).map(({id,kind,status,message,finishedAt})=>({id,kind,status,message,finishedAt})),journal:s.journal.slice(0,12),analytics:s.analytics};
    if(action==='queue')return{accountId,queue:s.queue};
    const item=s.queue.find(q=>q.id===itemId);if(!item)throw new ControlError('Publication introuvable.',404);
    if(action==='post')return{accountId,item};
    return preview(item,accountId);
   }
   if(action==='resume')return agent.configureAgent({enabled:true});
   if(action==='configure'){
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||!Object.keys(payload).length)throw new ControlError('Paramètres requis.');
    checkFields(payload,configKeys);return agent.configureAgent(payload);
   }
   if(!commands.has(action))throw new ControlError('Action non autorisée.');
   const body={action};if(itemId!==undefined)body.itemId=itemId;
   if(payload!==undefined){if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new ControlError('Payload JSON objet requis.');checkFields(payload,new Set(['caption','post','format','publishAt','feedback']));Object.assign(body,payload);}
   return agent.agentCommand(body);
  });
 };
}
