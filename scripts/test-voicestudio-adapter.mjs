import assert from 'node:assert/strict';
import {transform} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Fixture follows VoiceStudio 0.5.8's live /v1/audio/voices response.
await mkdir('.local/voice-tests',{recursive:true});
const file='.local/voice-tests/studioVoice.mjs';
await writeFile(file,(await transform(await readFile('lib/studioVoice.ts','utf8'),{loader:'ts',format:'esm'})).code);
const {voiceCatalog,generateVoice}=await import(pathToFileURL(process.cwd()+'/'+file));
process.env.VOICESTUDIO_BASE_URL='https://voice.example/v1';
process.env.VOICESTUDIO_MODEL='supertonic3';
process.env.VOICESTUDIO_API_KEY='test-private-key';
let available=false,speech;
globalThis.fetch=async(url,init)=>{
 assert.equal(init.headers.Authorization,'Bearer test-private-key');
 if(url.endsWith('/voices'))return Response.json({
  voices:[{id:'alloy',voice_id:'alloy',type:'openai_alias',name:'Alloy'}],
  engines:[{id:'supertonic3',available,preset_voices:['M1','M3','M4','M5','F3','F4','F5']}],
 });
 assert.equal(url,'https://voice.example/v1/audio/speech');
 speech=JSON.parse(init.body);
 return new Response(new Uint8Array(2048),{headers:{'Content-Type':'audio/mpeg'}});
};
const inactive=await voiceCatalog();
assert.equal(inactive.providers.find(p=>p.id==='voicestudio').available,false);
assert.deepEqual(inactive.voices,[]);
available=true;
const active=await voiceCatalog();
assert.equal(active.provider,'voicestudio');assert.equal(active.voices.length,7);
assert(!active.voices.some(v=>v.id==='alloy'));
assert(!JSON.stringify(active).includes('test-private-key'));
await assert.rejects(generateVoice({provider:'voicestudio',voice:'alloy',text:'Bonjour',speed:1}),/indisponible/);
const result=await generateVoice({provider:'voicestudio',voice:'F3',text:'Bienvenue chez B et M.',speed:1.1});
assert.equal(result.bytes.length,2048);
assert.deepEqual(speech,{model:'supertonic3',voice:'F3',input:'Bienvenue chez B et M.',response_format:'mp3',speed:1.1,language:'fr'});
console.log('VoiceStudio: activation, sept voix distinctes, français, authentification et synthèse vérifiés avec fixture API.');
