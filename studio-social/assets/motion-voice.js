import {esc} from './templates.js';

export function mountVoicePanel({modal,config,customizer,stop,status}){
 const panel=document.createElement('details');panel.className='motion-voice-panel';
 panel.innerHTML=`<summary>Voix naturelles</summary><p>Écrivez votre narration, choisissez une voix et écoutez le résultat avant de l’utiliser.</p><label for="motion-voice-provider">Service vocal</label><select id="motion-voice-provider"><option value="edge">Voix naturelles · Edge TTS</option><option value="voicestudio">VoiceStudio</option><option value="elevenlabs">ElevenLabs</option></select><p id="motion-voice-provider-note" class="muted" role="status"></p><label for="motion-voice-id">Voix</label><select id="motion-voice-id" disabled><option>Ouvrez ce panneau pour charger les voix</option></select><label for="motion-voice-text">Texte de la narration</label><textarea id="motion-voice-text" maxlength="800" rows="5"></textarea><button type="button" id="motion-voice-copy">Reprendre les textes de la vidéo</button><label for="motion-voice-speed">Débit</label><select id="motion-voice-speed"><option value="0.8">Posé · 0,8×</option><option value="0.9">Calme · 0,9×</option><option value="1" selected>Naturel · 1×</option><option value="1.1">Dynamique · 1,1×</option><option value="1.2">Rapide · 1,2×</option></select><p class="muted">Visez 25 à 35 mots pour cette vidéo de 15 secondes. La génération démarre uniquement avec le bouton ci-dessous.</p><button type="button" class="primary" id="motion-voice-generate" disabled>Générer la voix</button><p id="motion-voice-status" role="status" aria-live="polite"></p><audio id="motion-voice-listen" controls hidden preload="metadata" aria-label="Écouter la narration générée"></audio><div class="actions"><button type="button" id="motion-voice-use" hidden>Utiliser dans la vidéo</button><a id="motion-voice-download" hidden>Télécharger la narration</a><button type="button" id="motion-voice-remove" hidden>Retirer la narration</button></div>`;
 modal.querySelector('#motion-script-note').after(panel);
 const $=s=>panel.querySelector(s),provider=$('#motion-voice-provider'),voice=$('#motion-voice-id'),text=$('#motion-voice-text'),speed=$('#motion-voice-speed'),generate=$('#motion-voice-generate'),note=$('#motion-voice-provider-note'),message=$('#motion-voice-status'),listen=$('#motion-voice-listen'),use=$('#motion-voice-use'),download=$('#motion-voice-download'),remove=$('#motion-voice-remove');
 let loaded=false,closed=false,busy=false,controller,sequence=0,blob,url,duration=0,selectedProvider=null,autoScript=true;
 const values=()=>({provider:provider.value,voice:voice.value,text:text.value,speed:Number(speed.value)});
 const save=()=>customizer.setVoiceDraft(values());
 const script=()=>config.style==='mockups'?Object.values(config.mockups.text).filter(Boolean).join('. '):config.style==='kinetic'?'Vos infos sont partout. Votre temps est précieux. Posez votre question. Retrouvez les sources. L’intelligence artificielle prépare, vous décidez.':[config.title,config.question,config.answer,config.source].filter(Boolean).join('. ');
 const saved=customizer.voiceDraft();autoScript=!saved?.text;if(saved){provider.value=saved.provider||'edge';text.value=saved.text||'';speed.value=String(saved.speed||1);}
 if(!text.value)text.value=script().slice(0,800);
 remove.hidden=!customizer.hasNarration();
 async function catalog(){
  const request=++sequence;generate.disabled=true;voice.disabled=true;note.textContent='Chargement des voix…';
  try{
   const response=await fetch('/api/studio-voice?provider='+encodeURIComponent(provider.value)),data=await response.json();
   if(!response.ok)throw Error(data.error||'Catalogue indisponible.');if(closed||request!==sequence)return;
   selectedProvider=data.providers.find(p=>p.id===provider.value);note.textContent=selectedProvider?.note||'';
   voice.innerHTML=data.voices.length?data.voices.map(v=>`<option value="${esc(v.id)}">${esc(v.name)}</option>`).join(''):'<option value="">Aucune voix disponible</option>';
   if(saved?.provider===provider.value&&data.voices.some(v=>v.id===saved.voice))voice.value=saved.voice;
   voice.disabled=!data.voices.length;generate.disabled=!selectedProvider?.available||!data.voices.length;loaded=true;
  }catch(error){if(!closed&&request===sequence){note.textContent=error.message;loaded=false;}}
 }
 panel.addEventListener('toggle',()=>{if(panel.open&&!loaded&&!busy)catalog();});
 provider.onchange=()=>{loaded=false;save();catalog();};voice.onchange=save;speed.onchange=save;text.oninput=()=>{autoScript=false;save();if(blob)message.textContent='Texte modifié : générez une nouvelle voix pour lire cette version.';};
 $('#motion-voice-copy').onclick=()=>{text.value=script().slice(0,800);text.oninput();};
 function release(){listen.pause();listen.removeAttribute('src');if(url)URL.revokeObjectURL(url);url=null;blob=null;}
 async function apply(){stop();listen.pause();await customizer.applyNarration(blob);remove.hidden=false;message.textContent=`Narration de ${duration.toFixed(1)} s incluse dans la vidéo.`;status.textContent='Narration prête. Lancez la lecture ou exportez la vidéo.';}
 use.onclick=()=>apply().catch(error=>message.textContent=error.message);
 remove.onclick=async()=>{stop();listen.pause();await customizer.applyNarration(null);remove.hidden=true;message.textContent='Narration retirée de la vidéo.';};
 generate.onclick=async()=>{
  if(busy)return;const input=values();if(!input.text.trim()){message.textContent='Écrivez un texte à lire.';text.focus();return;}
  busy=true;controller=new AbortController();const controls=[...panel.querySelectorAll('button,input,textarea,select'),...modal.querySelectorAll('#motion-export,#motion-play,#motion-style')],states=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);use.hidden=true;download.hidden=true;message.textContent='Génération de la voix…';save();
  try{
   const response=await fetch('/api/studio-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
   if(!response.ok){const error=await response.json();throw Error(error.error||'Génération impossible.');}
   const next=await response.blob();if(closed)return;
   const AudioAPI=globalThis.AudioContext||globalThis.webkitAudioContext,context=new AudioAPI();
   try{const decoded=await context.decodeAudioData(await next.arrayBuffer());duration=decoded.duration;}finally{await context.close();}
   if(closed)return;release();blob=next;url=URL.createObjectURL(blob);listen.src=url;listen.hidden=false;download.href=url;download.download='bm-narration.'+(next.type.includes('wav')?'wav':'mp3');download.hidden=false;
   if(duration>15){message.textContent=`La narration dure ${duration.toFixed(1)} s pour une vidéo de 15 s. Raccourcissez le texte ou accélérez le débit, puis régénérez. Vous pouvez écouter et télécharger cet audio complet.`;}
   else{use.hidden=false;await apply();}
  }catch(error){if(!closed&&error.name!=='AbortError')message.textContent=error.message;}
  finally{busy=false;if(!closed)controls.forEach((c,i)=>c.disabled=states[i]);}
 };
 return {stop(){listen.pause();},sync(){if(autoScript)text.value=script().slice(0,800);remove.hidden=!customizer.hasNarration();},close(){closed=true;++sequence;controller?.abort();release();}};
}
