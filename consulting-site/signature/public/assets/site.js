(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.mobile-nav');
 function closeMenu(returnFocus=false){if(!menu)return;menu.setAttribute('aria-expanded','false');nav.hidden=true;if(returnFocus)menu.focus()}
 menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.hidden=!open});
 nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav&&!nav.hidden)closeMenu(true)});
 document.addEventListener('click',event=>{if(nav&&!nav.hidden&&!event.target.closest('.site-header'))closeMenu()});
 if('IntersectionObserver' in window&&!reduced.matches){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.remove('awaiting');entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}},{threshold:.08});document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('awaiting');observer.observe(el)});}
 document.querySelectorAll('[data-atmosphere]').forEach(section=>{if(reduced.matches)return;const pause=document.createElement('button');pause.className='motion-pause';pause.type='button';pause.textContent='Ⅱ';pause.setAttribute('aria-label','Mettre les animations en pause');pause.setAttribute('aria-pressed','false');pause.addEventListener('click',()=>{const paused=section.classList.toggle('motion-paused');pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Reprendre les animations':'Mettre les animations en pause')});if(section.classList.contains('hero'))section.append(pause);section.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced.matches||section.classList.contains('motion-paused'))return;const rect=section.getBoundingClientRect();section.style.setProperty('--pointer-x',`${((event.clientX-rect.left)/rect.width-.5)*150}px`);section.style.setProperty('--pointer-y',`${((event.clientY-rect.top)/rect.height-.5)*80}px`)});section.addEventListener('pointerleave',()=>{section.style.setProperty('--pointer-x','0px');section.style.setProperty('--pointer-y','0px')})});
 document.querySelectorAll('[data-formats]').forEach(root=>{const tabs=[...root.querySelectorAll('[role=tab]')];function activate(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active})}tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();activate(tabs[next]);tabs[next].focus()}})})});
 document.querySelectorAll('[data-demo]').forEach(root=>{
  let step=0,completed=false,validated=false;
  const tabs=[...root.querySelectorAll('[data-step]')],next=root.querySelector('[data-demo-next]'),complete=root.querySelector('[data-demo-complete]'),warning=root.querySelector('[data-demo-warning]'),success=root.querySelector('[data-demo-success]');
  const states=[['TOUT COMMENCE ICI','Les bonnes pièces,<br>au même endroit.','Le document rejoint un dossier partagé. Les informations utiles sont rassemblées pour préparer le traitement.'],['UN CONTRÔLE VISIBLE','Une information manque.<br>On la voit tout de suite.','La quantité est cohérente. Une référence de dossier reste à compléter avant de poursuivre.'],['LA DÉCISION RESTE HUMAINE','Les informations sont prêtes.<br>À vous de valider.','Le dossier est complet. Un utilisateur vérifie le récapitulatif avant de confirmer la suite du traitement.']];
  function render(){const state=states[step];root.querySelector('[data-demo-label]').textContent=state[0];root.querySelector('[data-demo-title]').innerHTML=state[1];root.querySelector('[data-demo-copy]').textContent=step===1&&completed?'La référence REF-DEMO-42 est renseignée. Les contrôles de cet exemple permettent maintenant de poursuivre.':state[2];tabs.forEach((tab,i)=>{tab.toggleAttribute('aria-current',i===step);if(i===step)tab.setAttribute('aria-current','step');tab.disabled=i===2&&!completed});warning.hidden=step!==1||completed;complete.hidden=step!==1||completed;next.disabled=step===1&&!completed;next.hidden=validated;next.innerHTML=(step===0?'Vérifier les informations':step===1?'Passer à la validation':'Valider la démonstration')+' <svg class="bm-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';success.hidden=!validated;root.querySelector('[data-demo-live]').textContent=validated?'Validation simulée. Décision humaine illustrée.':`Étape ${step+1} sur 3. ${root.querySelector('[data-demo-title]').textContent}`;}
  tabs.forEach((tab,i)=>tab.addEventListener('click',()=>{step=i;render()}));next.addEventListener('click',()=>{if(step===2)validated=true;else if(step===0||completed)step++;render()});complete.addEventListener('click',()=>{completed=true;render();next.focus()});root.querySelector('[data-demo-reset]').addEventListener('click',()=>{step=0;completed=false;validated=false;render()});render();
 });

 document.querySelectorAll('[data-product-playground]').forEach(root=>{
  const scenes={application:['espace-client.app','Une demande suivie.','Du premier clic à la réponse.','Un espace client pour retrouver ses demandes et ses documents.'],portail:['portail-metier.app','Chaque dossier avance.','Les étapes et les rôles sont visibles.','Un portail pour suivre les dossiers et savoir où agir.'],automatisation:['vos-flux.app','L’humain garde la main.','Des informations prêtes à vérifier.','Une extraction qui prépare les informations avant validation humaine.']};
  root.querySelectorAll('[data-product-scene]').forEach(button=>button.addEventListener('click',()=>{
   const name=button.dataset.productScene,scene=scenes[name];root.querySelector('.playground-stage').dataset.scene=name;
   root.querySelectorAll('[data-product-scene]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
   root.querySelectorAll('[data-product-panel]').forEach(panel=>panel.hidden=panel.dataset.productPanel!==name);
   root.querySelector('[data-browser-name]').textContent=scene[0];root.querySelector('[data-result-title]').textContent=scene[1];root.querySelector('[data-result-copy]').textContent=scene[2];root.querySelector('[data-scene-caption]').textContent=scene[3];
  }));
 });
 document.querySelectorAll('[data-talent-studio]').forEach(root=>{
  const tabs=[...root.querySelectorAll('[role=tab]')];
  function activate(tab){const index=tabs.indexOf(tab);root.dataset.active=String(index);tabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!active});root.querySelectorAll('[data-talent-card]').forEach(card=>card.classList.toggle('is-active',Number(card.dataset.talentCard)===index));}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();activate(tabs[next]);tabs[next].focus()}})});
 });
 const form = document.querySelector('[data-contact]');
 if (form) {
  const params = new URLSearchParams(location.search);
  const profiles = JSON.parse(form.dataset.profiles || '{}');
  const services = JSON.parse(form.dataset.services || '{}');
  const requestedProfile = params.get('profil');
  const requestedService = params.get('service');
  const profile = Object.hasOwn(profiles, requestedProfile) ? profiles[requestedProfile] : '';
  const service = Object.hasOwn(services, requestedService) ? services[requestedService] : '';
  const automation = params.get('sujet') === 'automatisation';
  const requestedNeed = params.get('besoin');
  const topic = profile || service || (automation ? 'Automatisation' : '');
  let need = '';
  if (service || automation) need = 'solution';
  if (profile) need = 'profil';
  if (['profil', 'squad', 'solution', 'autre'].includes(requestedNeed)) need = requestedNeed;
  const status = form.querySelector('.form-status');
  const result = form.querySelector('[data-contact-result]');
  const brief = form.querySelector('[data-contact-brief]');
  const topicLine = form.querySelector('[data-contact-topic]');
  const translate = value => window.BMI18N?.t(value) ?? value;

  if (need) form.elements.besoin.value = need;
  if (topic) {
   topicLine.textContent = topic;
   topicLine.hidden = false;
  }
  form.hidden = false;

  form.addEventListener('input', () => {
   result.hidden = true;
   brief.value = '';
   topicLine.hidden = !topic || form.elements.besoin.value !== need;
   status.textContent = '';
  });
  form.addEventListener('submit', event => {
   event.preventDefault();
   const data = new FormData(form);
   const message = String(data.get('message') || '').trim();
   const selected = form.querySelector('input[name="besoin"]:checked');
   const errors = {};
   if (!selected) errors.besoin = 'Choisissez un type d’accompagnement.';
   if (message.length < 20) errors.message = 'Décrivez votre projet en au moins 20 caractères.';

   form.querySelectorAll('[data-error]').forEach(el => {
    el.textContent = translate(errors[el.dataset.error] || '');
   });
   form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
   const invalid = Object.keys(errors);
   if (invalid.length) {
    status.textContent = translate('Quelques informations restent à compléter.');
    invalid.forEach(name => {
     form.querySelectorAll(`[name="${name}"]`).forEach(field => field.setAttribute('aria-invalid', 'true'));
    });
    form.querySelector(`[name="${invalid[0]}"]`).focus();
    return;
   }

   const name = String(data.get('nom') || '').trim();
   const company = String(data.get('entreprise') || '').trim();
   const selectedLabel = selected.nextElementSibling.textContent.trim();
   const selectedTopic = need === data.get('besoin') ? translate(topic) : '';
   const details = [selectedLabel, selectedTopic, [name, company].filter(Boolean).join(' · ')].filter(Boolean);
   brief.value = [translate('Brief projet B&M'), '', ...details, '', message].join('\n');
   result.hidden = false;
   status.textContent = translate('Votre brief est prêt à partager.');
   brief.focus();
  });

  form.querySelector('[data-contact-copy]').addEventListener('click', async () => {
   try {
    await navigator.clipboard.writeText(brief.value);
    status.textContent = translate('Brief copié.');
   } catch {
    brief.focus();
    brief.select();
    status.textContent = translate('Le texte est sélectionné. Vous pouvez le copier.');
   }
  });

  form.querySelector('[data-contact-download]').addEventListener('click', () => {
   const url = URL.createObjectURL(new Blob([brief.value], {type: 'text/plain;charset=utf-8'}));
   const link = document.createElement('a');
   link.href = url;
   link.download = 'brief-bm.txt';
   link.click();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
   status.textContent = translate('Téléchargement du brief lancé.');
  });
 }
})();
