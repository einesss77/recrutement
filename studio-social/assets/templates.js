import {character} from './characters.js';

export const templates = {
 editorial:'Le point de vue', steps:'La méthode', squad:'Le collectif',
 checklist:'Le mémo', case:'Le cas concret', focus:'L’expertise',
 chatbot:'Le chatbot', document:'Le document IA', automation:'Le flux automatisé',
 advisor:'Le conseiller illustré', cat:'Le chat assistant'
};
export const templateDetails = {
 editorial:{purpose:'Une idée forte, une prise de position.',format:'Post ou ouverture de carrousel'},
 steps:{purpose:'Expliquer une démarche en étapes.',format:'Carrousel pédagogique'},
 squad:{purpose:'Présenter un consultant, une équipe ou un accompagnement.',format:'Post offre & équipe'},
 checklist:{purpose:'Donner des repères utiles, faciles à garder.',format:'Mémo ou carrousel'},
 case:{purpose:'Présenter un problème, une approche et un livrable vérifiés.',format:'Cas concret ou concept identifié'},
 focus:{purpose:'Mettre une expertise au premier plan.',format:'Post service'},
 chatbot:{purpose:'Montrer une conversation avec un assistant métier.',format:'Démonstration illustrée'},
 document:{purpose:'Visualiser une lecture ou une extraction de document.',format:'Démonstration illustrée'},
 automation:{purpose:'Rendre un processus automatisé compréhensible.',format:'Démonstration en trois étapes'},
 advisor:{purpose:'Donner un visage illustré à un assistant métier.',format:'Démonstration illustrée'},
 cat:{purpose:'Présenter un assistant avec une identité de personnage.',format:'Démonstration illustrée'}
};
export const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconPaths={arrow:'M5 19 19 5M5 5h14v14',check:'m5 12 4 4L19 6',spark:'M12 3v18M3 12h18M6 6l12 12M18 6 6 18',document:'M7 3h7l4 4v14H7zM14 3v5h4M10 12h5M10 16h5',input:'M5 4v7h14M14 6l5 5-5 5M5 16v4h14'};
const icon=name=>`<svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name]||iconPaths.arrow}"/></svg>`;
const aiIcon=icon('spark');
const imageMarkup=post=>`<img class="post-image" src="${esc(post.image)}" alt="Visuel de la publication">`;

function frame(post,s,index,body,extra=''){
 const size=String(s.title||'').length+String(s.body||'').length+(s.points||[]).join('').length;
 const density=size>580?'art-dense':size>360?'art-compact':'';
 return `<article class="art brand-art ${esc(post.template)} ${post.theme==='light'?'light':'dark'} ${density} ${extra}"><div class="art-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div><header><b>B&M<span class="brand-period">.</span><span>Digital<br>Consulting</span></b><span>${esc(post.category)}</span></header><div class="art-body"><div class="eyebrow"><i></i>${esc(s.label||'LE REGARD B&M')}</div><h1>${esc(s.title)}</h1>${s.body?`<p>${esc(s.body)}</p>`:''}${body}</div><footer><span>Conseil. Produit. Ingénierie.</span><span class="art-pagination"><i></i>${String(index+1).padStart(2,'0')} <small>/ ${String(post.slides.length).padStart(2,'0')}</small></span></footer></article>`;
}

function circuitScene(kind){
 if(kind==='squad')return `<div class="brand-scene squad-scene" aria-hidden="true"><div class="network-node"><span>01</span><b>Votre équipe</b></div><div class="network-bridge"><i></i><i></i></div><div class="network-core">B&M<span>Le bon renfort.</span></div><div class="network-bridge"><i></i><i></i></div><div class="network-node"><span>02</span><b>Votre projet</b></div></div>`;
 if(kind==='case')return `<div class="brand-scene case-scene" aria-hidden="true"><div class="case-window"><div class="case-window-top"><span></span><span></span><span></span><i>DU BESOIN AU PRODUIT</i></div><div class="case-window-content"><div class="case-menu"><i></i><i></i><i></i></div><div class="case-workspace"><div class="case-stat"><i></i><i></i><i></i></div><div class="case-chart">${[28,42,34,56,48,70,82,96].map(h=>`<i style="height:${h}%"></i>`).join('')}</div></div></div></div><div class="case-caption"><span>COMPRENDRE</span><span>CONSTRUIRE</span><span>FAIRE ÉVOLUER</span>${icon('arrow')}</div></div>`;
 if(kind==='focus')return `<div class="brand-scene focus-scene" aria-hidden="true"><div class="focus-orbit"><i></i><i></i><i></i><b>${icon('spark')}</b></div><div class="scene-annotation"><span>UNE EXPERTISE.</span><strong>Un impact concret.</strong><i></i></div></div>`;
 return `<div class="brand-scene signal-scene" aria-hidden="true"><div class="signal-label"><span>LE REGARD B&M</span><b>De l’idée<br>à l’action.</b></div><svg viewBox="0 0 580 180" fill="none"><path d="M0 138h132q34 0 55-32l38-58q20-30 55-30h300M0 157h158q34 0 55-32l38-58q20-30 55-30h274M0 176h184q34 0 55-32l38-58q20-30 55-30h248" stroke="currentColor" opacity=".22"/><path d="M0 119h106q34 0 55-32l38-58q20-30 55-30h326" stroke="currentColor"/><circle cx="310" cy="18" r="7" fill="currentColor"/><circle cx="400" cy="56" r="3" fill="currentColor" opacity=".5"/></svg></div>`;
}

export function artwork(post,index=0){
 const s=post.slides[index]||post.slides[0]||{title:'Votre prochaine idée.',body:'',points:[]};
 if(['advisor','cat'].includes(post.template))return personifiedArtwork(post,s,index);
 if(['chatbot','document','automation'].includes(post.template))return practicalArtwork(post,s,index);
 const list=(s.points||[]).map((p,i)=>`<li><span>${post.template==='checklist'?icon('check'):String(i+1).padStart(2,'0')}</span><div>${esc(p)}</div></li>`).join('');
 const visual=post.image?imageMarkup(post):circuitScene(post.template);
 return frame(post,s,index,`${list?`<ul>${list}</ul>`:''}${visual}`,list?'has-points':'no-points');
}

function personifiedArtwork(post,s,index){
 const p=s.points||[],cat=post.template==='cat';
 return frame(post,s,index,`<div class="character-stage"><div class="character-portrait">${post.image?`<img class="custom-character" src="${esc(post.image)}" alt="Personnage de la publication">`:character(cat?'cat':'advisor')}<div class="character-tag"><i></i>${cat?'Votre chat assistant':'Votre assistant métier'}</div></div><div class="character-dialog"><div class="mini-user"><span>VOUS</span>${esc(p[0]||'On commence par quoi ?')}</div><div class="character-answer"><div class="character-answer-label">${cat?'LE CHAT VOUS RÉPOND':'ON REGARDE ÇA ENSEMBLE'}</div><div>${esc(p[1]||'Dites-moi ce que vous cherchez. Je vous aide à retrouver les informations utiles.')}</div><div class="character-source">${icon('document')}${esc(p[2]||'Scénario illustratif')}</div></div></div></div><div class="demo-note">PERSONNAGE ILLUSTRÉ · SCÉNARIO DE DÉMONSTRATION</div>`,`personified ${cat?'cat-post':'advisor-post'}`);
}

function practicalArtwork(post,s,index){
 const points=s.points||[];
 const demo=post.template==='chatbot'?`<div class="demo-window"><div class="window-bar"><span class="assistant-avatar">${aiIcon}</span><div><strong>Assistant métier</strong><small>Vos documents comme point de départ</small></div><span class="demo-pill">DÉMO</span></div><div class="conversation"><div class="bubble user-bubble">${esc(points[0]||'Comment pouvez-vous m’aider ?')}</div><div class="assistant-line"><span class="assistant-avatar">${aiIcon}</span><div class="bubble answer-bubble">${esc(points[1]||'Je recherche dans les sources autorisées pour vous proposer une réponse.')}<div class="source-chip">${icon('document')}${esc(points[2]||'Source à vérifier')}</div></div></div></div><div class="fake-input">Posez une question à vos documents<span>${icon('arrow')}</span></div></div>`:post.template==='document'?`<div class="document-scene"><div class="paper"><div class="paper-label">DOCUMENT D’EXEMPLE</div><div class="paper-title">${esc(points[0]||'Document reçu')}</div><div class="paper-rule"></div><div class="paper-rule short"></div><div class="paper-highlight">Informations à retrouver</div><div class="paper-rule"></div><div class="paper-rule short"></div><div class="paper-seal">PDF</div></div><div class="extract-panel"><div class="extract-head">${aiIcon} Extraction proposée</div><div class="extracted-value">${esc(points[1]||'Les informations utiles sont identifiées.')}</div><div class="extract-status"><span>${icon('check')}</span>${esc(points[2]||'À vérifier avant validation')}</div></div></div>`:`<div class="flow-demo">${[0,1,2].map(i=>`<div class="flow-step"><span class="flow-icon">${icon(['input','spark','check'][i])}</span><div><small>${['01 · LE DÉCLENCHEUR','02 · LE TRAITEMENT','03 · LA VALIDATION'][i]}</small><strong>${esc(points[i]||['Une demande arrive','Les informations sont préparées','Vous gardez la décision'][i])}</strong></div>${i<2?'<span class="flow-connector" aria-hidden="true"></span>':''}</div>`).join('')}</div>`;
 return frame(post,s,index,`${post.image?imageMarkup(post):demo}<div class="demo-note">SCÉNARIO ILLUSTRATIF · INTERFACE DE DÉMONSTRATION</div>`,'practical');
}
