import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
process.loadEnvFile('.env');
const base=process.env.SOCIAL_TEST_URL||'http://localhost:3012';
const cookie='bm_admin_session='+createHmac('sha256',process.env.ADMIN_PASSWORD).update('bm-digital-consulting-admin').digest('hex');
const send=(data,origin=base)=>fetch(base+'/api/studio-voice',{method:'POST',headers:{cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
assert.equal((await fetch(base+'/api/studio-voice')).status,401);
assert.equal((await send({},'https://example.org')).status,403);
const data={provider:'edge',voice:'fr-FR-DeniseNeural',text:'Bonjour, bienvenue chez B et M.',speed:1};
for(const invalid of [{...data,text:''},{...data,text:'a'.repeat(801)},{...data,speed:3},{...data,voice:'inconnue'}])assert.equal((await send(invalid)).status,400);
assert.equal((await send({...data,text:'a'.repeat(7000)})).status,413);
const catalog=await(await fetch(base+'/api/studio-voice?provider=edge',{headers:{cookie}})).json();
assert(catalog.providers.some(p=>p.id==='edge'&&p.available));assert(catalog.voices.some(v=>v.id===data.voice));
assert(!JSON.stringify(catalog).includes('API_KEY='));
if(process.env.VOICE_TEST_LIVE==='1'){
 const response=await send(data);assert.equal(response.status,200,await response.clone().text());assert.equal(response.headers.get('content-type'),'audio/mpeg');assert((await response.arrayBuffer()).byteLength>1000);
}
console.log(JSON.stringify({authentication:true,origin:true,validation:true,catalog:catalog.voices.length,realSynthesis:process.env.VOICE_TEST_LIVE==='1'}));
