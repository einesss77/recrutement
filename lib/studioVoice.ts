import {z} from 'zod';
import {EdgeTTS} from '@andresaya/edge-tts';

export class VoiceError extends Error {
  constructor(message:string,public status=400){super(message);}
}
export const voiceInput=z.object({
  provider:z.enum(['edge','voicestudio','elevenlabs']),
  voice:z.string().min(1).max(160).regex(/^[a-zA-Z0-9_.-]+$/),
  text:z.string().trim().min(1).max(800),
  speed:z.number().min(0.8).max(1.2).default(1),
});
const edgeVoices=[
  {id:'fr-FR-DeniseNeural',name:'Denise · français · féminine'},
  {id:'fr-FR-HenriNeural',name:'Henri · français · masculine'},
  {id:'fr-FR-EloiseNeural',name:'Éloïse · français · féminine'},
  {id:'en-US-JennyNeural',name:'Jenny · anglais américain · féminine'},
  {id:'en-US-GuyNeural',name:'Guy · anglais américain · masculine'},
  {id:'en-GB-SoniaNeural',name:'Sonia · anglais britannique · féminine'},
  {id:'ar-TN-ReemNeural',name:'Reem · arabe tunisien · féminine'},
  {id:'ar-TN-HediNeural',name:'Hedi · arabe tunisien · masculine'},
];
type Voice={id:string;name:string};
function studioUrl(suffix:string){
  const base=process.env.VOICESTUDIO_BASE_URL;
  if(!base)throw new VoiceError('VoiceStudio attend une instance connectée sur le serveur.',503);
  const url=new URL(base);
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw new VoiceError('VoiceStudio nécessite une adresse HTTPS accessible au serveur.',503);
  return base.replace(/\/$/,'').replace(/\/v1$/,'')+'/v1/audio/'+suffix;
}
async function request(url:string,init:RequestInit={},timeout=20000){
  let response:Response;
  try{response=await fetch(url,{...init,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(timeout)});}
  catch{throw new VoiceError('Le service vocal ne répond pas. Réessayez dans un instant.',503);}
  if(!response.ok)throw new VoiceError(response.status===401||response.status===403?'La connexion au service vocal a été refusée. Vérifiez sa clé côté serveur.':response.status===429?'Le service vocal a atteint sa limite. Réessayez plus tard.':'La génération vocale est indisponible ('+response.status+').',503);
  return response;
}
const studioHeaders=():Record<string,string>=>process.env.VOICESTUDIO_API_KEY?{Authorization:'Bearer '+process.env.VOICESTUDIO_API_KEY}:{};
export async function voiceCatalog(provider=''){
  provider=provider||(process.env.VOICESTUDIO_BASE_URL?'voicestudio':'edge');
  const providers=[
    {id:'edge',name:'Voix naturelles · Edge TTS',available:true,note:'Service vocal Microsoft en ligne. Le texte est transmis uniquement lors de la génération.'},
    {id:'voicestudio',name:'VoiceStudio',available:false,note:process.env.VOICESTUDIO_BASE_URL?'Choisissez VoiceStudio pour vérifier les voix du moteur connecté.':'Une instance VoiceStudio accessible au serveur reste à connecter.'},
    {id:'elevenlabs',name:'ElevenLabs',available:!!process.env.ELEVENLABS_API_KEY,note:process.env.ELEVENLABS_API_KEY?'Chaque génération utilise les crédits du compte ElevenLabs.':'Une clé ElevenLabs reste à renseigner côté serveur.'},
  ];
  let voices:Voice[]=[];
  if(provider==='edge')voices=edgeVoices;
  else if(provider==='voicestudio'&&process.env.VOICESTUDIO_BASE_URL){
    const data=await(await request(studioUrl('voices'),{headers:studioHeaders()},12000)).json();
    const model=process.env.VOICESTUDIO_MODEL||'tts-1';
    const engine=data.engines?.find((e:{id:string})=>e.id===model);
    const entry=providers.find(p=>p.id==='voicestudio')!;
    if(engine){
      entry.available=engine.available===true;
      entry.note=entry.available?'Supertonic 3 · voix françaises générées par IA sur le serveur B&M. La première génération peut prendre quelques instants.':'VoiceStudio est installé ; le moteur vocal attend son activation.';
      if(entry.available)voices=(engine.preset_voices||[]).map((id:string)=>({id,name:id+' · français · '+(id.startsWith('F')?'féminine':'masculine')}));
    }else{
      // OpenAI aliases all resolve to one default voice; they are not distinct presets.
      voices=(data.voices||[]).filter((v:{type?:string})=>v.type!=='openai_alias').map((v:{voice_id?:string;id?:string;name?:string})=>({id:v.voice_id||v.id||'',name:v.name||v.voice_id||v.id||''})).filter((v:Voice)=>v.id);
      entry.available=voices.length>0;
    }
  }else if(provider==='elevenlabs'&&process.env.ELEVENLABS_API_KEY){
    const data=await(await request('https://api.elevenlabs.io/v2/voices?page_size=100',{headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY}})).json();
    voices=(data.voices||[]).map((v:{voice_id:string;name:string})=>({id:v.voice_id,name:v.name}));
  }else if(!providers.some(p=>p.id===provider))throw new VoiceError('Service vocal inconnu.');
  return {provider,providers,voices};
}
export async function generateVoice(input:unknown){
  const parsed=voiceInput.safeParse(input);
  if(!parsed.success)throw new VoiceError('Indiquez un texte de 1 à 800 caractères, une voix et une vitesse de 0,8 à 1,2.');
  const {provider,voice,text,speed}=parsed.data;
  if(provider==='edge'){
    if(!edgeVoices.some(v=>v.id===voice))throw new VoiceError('Choisissez une voix du catalogue.');
    try{
      const result=await new EdgeTTS().generate(text,voice,{rate:Math.round((speed-1)*100),outputFormat:'audio-24khz-96kbitrate-mono-mp3',signal:AbortSignal.timeout(45000),timeout:20000});
      if(result.audio.length<100)throw Error('Empty audio');
      return {bytes:new Uint8Array(result.audio),mime:'audio/mpeg'};
    }catch(error){
      console.error('Studio voice synthesis:',error instanceof Error?error.name:'Error',(error as {code?:string})?.code||'UNKNOWN');
      throw new VoiceError('La voix naturelle est momentanément indisponible. Votre narration précédente est conservée.',503);
    }
  }
  const {voices}=await voiceCatalog(provider);
  if(!voices.some(v=>v.id===voice))throw new VoiceError('Cette voix est indisponible. Rechargez le catalogue.');
  const response=provider==='voicestudio'
    ?await request(studioUrl('speech'),{method:'POST',headers:{...studioHeaders(),'Content-Type':'application/json'},body:JSON.stringify({model:process.env.VOICESTUDIO_MODEL||'tts-1',voice,input:text,response_format:'mp3',speed,language:process.env.VOICESTUDIO_LANGUAGE||'fr'})},45000)
    :await request('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voice)+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.75,speed}})});
  const mime=(response.headers.get('content-type')||'').split(';')[0];
  if(!['audio/mpeg','audio/mp3','audio/wav','audio/x-wav'].includes(mime))throw new VoiceError('Le service vocal a renvoyé un format audio non pris en charge.',502);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<100||bytes.length>15_000_000)throw new VoiceError('Le fichier vocal reçu est vide ou trop volumineux.',502);
  return {bytes,mime};
}
