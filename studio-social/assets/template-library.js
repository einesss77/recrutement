import {artwork, templates, esc} from './templates.js';

export const templateNotes = {
 editorial: ['Prendre position', 'Une idée forte, un titre court et une explication qui va droit au but.'],
 steps: ['Expliquer une méthode', 'Déroulez votre démarche en plusieurs pages, de la question à la décision.'],
 squad: ['Présenter les consultants', 'Rendez visibles les expertises et la façon dont votre équipe intervient.'],
 checklist: ['Donner un repère utile', 'Trois ou quatre points à garder sous la main avant de passer à l’action.'],
 case: ['Montrer un cas concret', 'Un contexte, une réponse, un apprentissage. Les exemples restent identifiés.'],
 focus: ['Faire découvrir une expertise', 'Un sujet technique présenté avec un schéma simple et un bénéfice précis.'],
 chatbot: ['Illustrer une conversation', 'Une question, une réponse et sa source, dans une interface de démonstration.'],
 document: ['Expliquer un usage documentaire', 'Du document à l’information utile, avec un contrôle humain explicite.'],
 automation: ['Visualiser un processus', 'Trois étapes reliées pour comprendre ce qui est automatisé et ce qui est validé.'],
 advisor: ['Mettre en scène un assistant', 'Un personnage illustré accompagne une conversation de démonstration.'],
 cat: ['Explorer un ton plus léger', 'Une variante illustrée, à réserver aux contenus qui s’y prêtent.']
};

export function templateSeed(state, key) {
 const packs = [...(state.availablePacks || [])].sort((a,b)=>Number(b.id.startsWith('signature'))-Number(a.id.startsWith('signature')));
 const original = packs.flatMap(p=>p.posts).find(p=>p.template===key) || state.posts.find(p=>p.template===key);
 return original ? structuredClone(original) : {title:templates[key],category:'Conseil',template:key,theme:'dark',status:'draft',date:'',image:'',caption:'',slides:[{label:'LE REGARD B&M',title:'Une idée claire. Un pas concret.',body:'Présentez le contexte et le choix qui fait avancer votre projet.',points:[]}]};
}

export function templateGallery(state) {
 return `<div class="format-note"><span>01 / Choisir un modèle</span><span>02 / Adapter les textes</span><span>03 / Exporter</span></div><div class="grid template-grid">${Object.entries(templates).map(([key,title],i)=>{
  const [use,desc]=templateNotes[key];
  return `<article class="post-card template-card"><button class="thumb" data-template="${key}" aria-label="Utiliser le modèle ${esc(title)}"><div class="scaled">${artwork(templateSeed(state,key))}</div></button><div class="card-meta"><span>MODÈLE ${String(i+1).padStart(2,'0')}</span><span>Carré / Portrait</span></div><h2 class="card-title">${esc(title)}</h2><p class="template-description">${desc}</p><button class="template-use" data-template="${key}">${use}<span aria-hidden="true">↗</span></button></article>`;
 }).join('')}</div>`;
}

export function brandStrip(){
 return `<section class="brand-strip" aria-label="Collection signature B&M"><div><span class="overline">LA SIGNATURE DU SITE, DANS VOS POSTS</span><h2>Une marque.<br>Plusieurs prises de parole.</h2><p>Du conseil au produit : une collection à personnaliser, des compositions qui se répondent.</p><button data-view="templates">Explorer les modèles <span aria-hidden="true">↗</span></button></div><div class="brand-sheets" aria-hidden="true"><div class="brand-sheet sheet-dark"><b>B&M<span>.</span></b><i></i><strong>Le bon renfort.<br>Au bon endroit.</strong><small>CONSULTANTS / EXPERTISES</small></div><div class="brand-sheet sheet-light"><b>B&M<span>.</span></b><strong>De l’idée<br>à l’usage.</strong><i></i><small>PRODUIT / MÉTHODE</small></div><div class="brand-sheet sheet-blue"><span>01 — 02 — 03</span><strong>Clarifier.<br>Construire.<br>Avancer.</strong><small>LA MÉTHODE B&M</small></div></div></section>`;
}

export function brandGuide(){
 const colors=[['Encre','#080a0b'],['Bleu nuit','#090e18'],['Cobalt','#345bff'],['Citron','#d6ff46'],['Papier','#f4f6f8']];
 return `<section class="brand-guide panel"><div class="overline">CHARTE VISUELLE / B&M</div><h2>La même signature, partout.</h2><div class="brand-swatches">${colors.map(([name,hex])=>`<div><i style="background:${hex}"></i><b>${name}</b><code>${hex}</code></div>`).join('')}</div><div class="type-sample"><strong>Une idée claire.</strong><span>Bricolage Grotesque · Titres</span><p>Des mots simples. Une composition précise. De l’espace pour respirer.</p><span>Manrope · Texte courant</span></div><div class="brand-rules"><p><b>Une idée par page.</b> Visez 3 à 8 mots pour le titre. Placez les détails dans la légende ou la page suivante.</p><p><b>Le citron souligne.</b> Les fonds alternent bleu nuit, cobalt et papier. Les accents restent ponctuels.</p><p><b>Un système visuel.</b> Lignes fines, schémas et interfaces. Pas d’emoji ni d’effets décoratifs envahissants.</p><p><b>Deux formats.</b> Carré 1080 × 1080 et portrait 1080 × 1350. PNG pour une page, PDF pour un carrousel.</p></div></section>`;
}

export function motionGallery(){
 return `<div class="motion-collection">${[
  ['mockups','Démo produit','Un parcours entre application web et mobile.','mockups-demo'],
  ['kinetic','Message animé','Une séquence typographique, rythmée et lisible.','kinetic-demo'],
  ['character','Assistant illustré','Une conversation mise en scène avec un personnage.','video-demo']
 ].map(([key,title,desc,file])=>`<article class="motion-card"><div class="motion-poster" data-style="${key}"><span>B&M<i>.</i></span><div>${key==='mockups'?'<div class="mini-screen"><i></i><i></i><i></i></div>':key==='kinetic'?'<strong>Vos idées.<br>En mouvement.</strong>':'<div class="mini-conversation"><i>Une question.</i><i>Une réponse utile.</i></div>'}</div><small>15 S / FORMAT VERTICAL</small></div><h2>${title}</h2><p>${desc}</p><button class="primary" data-motion="${key}">Personnaliser <span aria-hidden="true">↗</span></button><a href="/studio-social/${file}.mp4" download="bm-${file}.mp4">Télécharger la démo MP4</a></article>`).join('')}</div>`;
}
