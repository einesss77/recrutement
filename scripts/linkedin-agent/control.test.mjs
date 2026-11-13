import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createControl} from './control.mjs';
function fixture(){
 const calls=[],state={storageReady:true,config:{enabled:true},connection:{connected:true,targetName:'Ines',secrets:'private'},worker:{status:'online'},queue:[{id:'first',status:'scheduled',publishAt:'2026-11-13T09:00:00Z',post:{title:'Hello',caption:'FR\nTexte\nEN\nText'}}],jobs:[],journal:[],capabilities:{},blockers:[],analytics:{}};
 const agent={withAgentAccount:(id,fn)=>{calls.push(['account',id]);return fn();},agentState:async()=>state,configureAgent:async p=>{calls.push(['configure',p]);return{ok:true};},agentCommand:async p=>{calls.push(['command',p]);return{ok:true};}};
 return{calls,state,control:createControl(agent,{preview:async q=>({id:q.id}),prospects:async()=>({count:50})})};
}
test('account required and internal action/credentials cannot be injected',async()=>{
 const {control}=fixture();
 for(const x of [{action:'pause'},{action:'disconnect',accountId:'person'},{action:'configure',accountId:'person',payload:{linkedinClientSecret:'x'}},{action:'configure',accountId:'person',payload:{targetUrl:'https://other'}},{action:'pause',accountId:'person',token:'secret'},{action:'update',accountId:'person',payload:{action:'disconnect'}}])await assert.rejects(control(x));
});
test('status omits private connection fields and returns calendar',async()=>{const {control}=fixture();const s=await control({action:'status',accountId:'person'});assert.equal(s.connection.secrets,undefined);assert.equal(s.nextPosts[0].id,'first');});
test('unavailable store fails instead of returning synthetic offline state',async()=>{const f=fixture();f.state.storageReady=false;await assert.rejects(f.control({action:'status',accountId:'person'}),/indisponible/);});
test('pause and resume use business controls with correct account',async()=>{const {control,calls}=fixture();await control({action:'pause',accountId:'organization'});await control({action:'resume',accountId:'person'});assert.deepEqual(calls,[['account','organization'],['command',{action:'pause'}],['account','person'],['configure',{enabled:true}]]);});

test('resume records calendar intent and propagates pending delivery without asserting success',async()=>{
 const agent={withAgentAccount:(_id,fn)=>fn(),configureAgent:async(input,options)=>{assert.deepEqual(input,{enabled:true});assert.deepEqual(options,{allowPendingBrowserSchedule:true});return{ok:true,publicationPending:true};}};
 assert.deepEqual(await createControl(agent)({action:'resume',accountId:'person'}),{ok:true,publicationPending:true});
});
test('edits preserve item scope and delegate validation to shared backend',async()=>{const {control,calls}=fixture();await control({action:'update',accountId:'person',itemId:'first',payload:{caption:'Updated'}});assert.deepEqual(calls.at(-1),['command',{action:'update',itemId:'first',caption:'Updated'}]);await assert.rejects(control({action:'post',accountId:'person',itemId:'wrong'}),/introuvable/);});
test('preview and prospect retrieval stay read-only',async()=>{const {control,calls}=fixture();assert.deepEqual(await control({action:'preview',accountId:'person',itemId:'first'}),{id:'first'});assert.deepEqual(await control({action:'prospects',accountId:'person'}),{count:50});assert.ok(calls.every(c=>c[0]==='account'));});
test('research controls are separate from publications and restricted to Ines',async()=>{const calls=[];const agent={withAgentAccount:(_id,fn)=>fn()};const c=createControl(agent,{research:async action=>{calls.push(action);return{enabled:false};}});assert.deepEqual(await c({action:'prospecting-pause',accountId:'person'}),{enabled:false});await assert.rejects(c({action:'prospecting-resume',accountId:'organization'}),/Ines/);assert.deepEqual(calls,['prospecting-pause']);});
