// Campaign 2026: the Studio and the autonomous renderer use these exact layouts.
export const campaignTemplates={launch:'L’offre en images',mission:'La mission en clair',product:'L’application en situation',compare:'Le choix du dispositif',brief:'Le premier échange'};
export const campaignDetails={
 launch:{purpose:'Présenter les consultants IT et les applications B&M en un regard.',format:'Affiche de marque'},
 mission:{purpose:'Montrer le travail à confier à un consultant, sans inventer de CV disponible.',format:'Carte mission illustrée'},
 product:{purpose:'Présenter une application métier dans une interface de démonstration.',format:'Démo produit web et mobile'},
 compare:{purpose:'Rendre deux dispositifs faciles à comprendre et à comparer.',format:'Comparaison visuelle'},
 brief:{purpose:'Donner un point de départ concret à une discussion commerciale.',format:'Brief de projet visuel'}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow=`<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 25 25 7M7 7h18v18" stroke="currentColor" stroke-width="2.4"/></svg>`;
const marks={code:'M8 9 2 16l6 7M24 9l6 7-6 7M19 5l-6 22',layers:'m16 3 14 8-14 8L2 11 16 3ZM3 17l13 8 13-8M3 23l13 8 13-8',flow:'M4 6h9v9H4zM20 18h9v9h-9zM13 10h11v8M8 15v9h12',screen:'M3 5h26v19H3zM10 29h12M16 24v5M3 11h26',check:'m6 16 7 7L27 8',grid:'M3 3h10v10H3zM20 3h10v10H20zM3 20h10v10H3zM20 20h10v10H20z'};
const mark=name=>`<svg viewBox="0 0 34 34" fill="none" aria-hidden="true"><path d="${marks[name]||marks.code}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function pair(value,fallback=''){
 const [title,...detail]=String(value||'').split('|');return{title:title.trim()||fallback,detail:detail.join('|').trim()};
}
function logo(){return `<b class="v2-logo">B&M<span>.</span><small>Digital<br>Consulting</small></b>`;}
function chrome(post,s,index,content){
 return `<article class="art studio-v2 ${post.theme==='light'?'v2-light':'v2-dark'} v2-${esc(post.template)}"><header class="v2-header">${logo()}<span>IT CONSULTING<br>& CUSTOM APPLICATIONS</span></header><div class="v2-body art-body"><div class="v2-heading"><div class="v2-kicker"><i></i>${esc(s.label||'B&M / DIGITAL CONSULTING')}</div><h1>${esc(s.title)}</h1>${s.body?`<p>${esc(s.body)}</p>`:''}</div>${content}</div><footer class="v2-footer"><span>bandmdigitalconsulting.com</span><span>${post.template==='product'?'ILLUSTRATIVE INTERFACE':'LET’S BUILD WHAT’S NEXT'} <i></i> ${String(index+1).padStart(2,'0')} / ${String(post.slides.length).padStart(2,'0')}</span></footer></article>`;
}
function launch(s){
 const p=(s.points||[]).map(x=>pair(x));
 return `<div class="v2-launch-stage"><div class="v2-launch-grid" aria-hidden="true"></div><div class="v2-service v2-service-team"><div class="v2-service-top"><span>01 / PEOPLE</span>${mark('code')}</div><strong>${esc(p[0]?.title||'IT consultants')}</strong><p>${esc(p[0]?.detail||'The expertise your team needs.')}</p><div class="v2-team-graphic" aria-hidden="true"><div><span>DEV</span>${mark('code')}</div><i></i><div class="v2-team-plus">+</div><i></i><div><span>YOUR TEAM</span>${mark('layers')}</div></div><div class="v2-service-foot">ONE SPECIALIST OR A SQUAD ${arrow}</div></div><div class="v2-service v2-service-product"><div class="v2-service-top"><span>02 / PRODUCTS</span>${mark('screen')}</div><strong>${esc(p[1]?.title||'Custom applications')}</strong><p>${esc(p[1]?.detail||'Software built around your business.')}</p><div class="v2-mini-product" aria-hidden="true"><div class="v2-mini-sidebar"><b>a.</b><i></i><i></i><i></i></div><div><span>YOUR WORKSPACE</span><div class="v2-mini-row"><i></i><i></i></div><div class="v2-mini-chart">${[36,57,46,74,62,90].map(h=>`<i style="height:${h}%"></i>`).join('')}</div></div></div><div class="v2-service-foot">WEB / MOBILE / BUSINESS TOOLS ${arrow}</div></div><div class="v2-launch-bottom"><span>${esc(p[2]?.title||'Your project. The right team.')}</span><b>B&M${arrow}</b></div></div>`;
}
function mission(s){
 const p=(s.points||[]).slice(0,3).map(x=>pair(x));
 while(p.length<3)p.push(pair(['Build | Product features','Connect | APIs and systems','Deliver | Tests and handover'][p.length]));
 return `<div class="v2-mission-stage"><div class="v2-mission-map"><div class="v2-map-head"><span>THE ASSIGNMENT</span><b>From the work.<br>To the right expertise.</b></div><div class="v2-map-grid" aria-hidden="true"><div class="v2-map-center">${mark('code')}<b>&lt;build /&gt;</b><span>B&M / IT CONSULTING</span></div><div class="v2-map-port port-a">${mark('screen')}<span>${esc(p[0].title)}</span></div><div class="v2-map-port port-b">${mark('flow')}<span>${esc(p[1].title)}</span></div><div class="v2-map-port port-c">${mark('layers')}<span>${esc(p[2].title)}</span></div><svg class="v2-map-wires" viewBox="0 0 900 330" fill="none"><path d="M90 245v-65q0-20 20-20h340M810 245v-65q0-20-20-20H450M450 245V150" stroke="currentColor" stroke-width="2" stroke-dasharray="5 6"/></svg></div><div class="v2-map-note"><i></i>ASSIGNMENT EXAMPLE / B&M</div></div><div class="v2-mission-cards">${p.map((v,i)=>`<div><span class="v2-tile-icon">${mark(['screen','flow','check'][i])}</span><small>0${i+1}</small><strong>${esc(v.title)}</strong><p>${esc(v.detail)}</p></div>`).join('')}</div></div>`;
}
function product(s){
 const p=(s.points||[]).slice(0,3).map(x=>pair(x));
 const labels=p.map((v,i)=>v.title||['Track cases','Share documents','Approve work'][i]);
 return `<div class="v2-product-stage"><div class="v2-product-grid" aria-hidden="true"></div><span class="v2-product-tag">DESIGNED AROUND YOUR WORKFLOW</span><div class="v2-browser"><div class="v2-browser-bar"><span><i></i><i></i><i></i></span><b>YOUR BUSINESS / WORKSPACE</b><span>${mark('screen')}</span></div><div class="v2-workspace"><aside><b>a<span>.</span></b>${mark('grid')}${mark('layers')}${mark('flow')}<i></i></aside><div class="v2-workspace-main"><div class="v2-workspace-title"><div><small>OPERATIONS</small><strong>Your work, connected.</strong></div><b>+ New case</b></div><div class="v2-ui-summary"><div><span>Documents</span><b>One place.</b><i></i></div><div><span>Approvals</span><b>Clear owners.</b>${mark('check')}</div></div><div class="v2-case-table"><div><span>CASE</span><span>NEXT STEP</span><span>STATUS</span></div><div><b>Supplier onboarding</b><span>Review documents</span><i>Ready for review</i></div><div><b>Project request</b><span>Assign an owner</span><i class="pending">Action needed</i></div><div><b>Purchase approval</b><span>Confirm decision</span><i>In progress</i></div></div><div class="v2-ui-activity"><span></span>Every next step has an owner.</div></div></div></div><div class="v2-phone"><div class="v2-phone-camera"></div><div class="v2-phone-top"><span>9:41</span><b>a.</b></div><small>YOUR CASE</small><strong>Ready for<br>the next step.</strong><div class="v2-phone-status"><i></i>Review required</div><div class="v2-phone-file">${mark('layers')}<b>Documents</b><span>Attached to the case</span></div><div class="v2-phone-owner"><span>APPROVAL OWNER</span><b>Your team</b></div><div class="v2-phone-button">Review case ${arrow}</div></div><div class="v2-product-benefits">${labels.map((label,i)=>`<span><i>0${i+1}</i>${esc(label)}</span>`).join('')}</div></div>`;
}
function compare(s){
 const p=(s.points||[]).map(x=>pair(x));
 const left=p[0]||pair('One specialist | A defined role in your team'),right=p[1]||pair('A dedicated squad | Several skills, one workstream'),bottom=p[2]||pair('Start with the work | Then choose the right setup');
 return `<div class="v2-compare-stage"><div class="v2-compare-origin"><span>YOUR PROJECT</span><b>Choose the setup.</b></div><div class="v2-compare-branches" aria-hidden="true"><i></i><i></i></div><div class="v2-options"><div class="v2-option option-one"><div class="v2-option-label"><span>01 / EMBED</span>${arrow}</div><div class="v2-option-symbol" aria-hidden="true"><i></i><b>+</b><span></span></div><strong>${esc(left.title)}</strong><p>${esc(left.detail)}</p><small>YOUR PRIORITIES. A CLEAR ROLE.</small></div><div class="v2-option option-team"><div class="v2-option-label"><span>02 / BUILD</span>${arrow}</div><div class="v2-option-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i></div><strong>${esc(right.title)}</strong><p>${esc(right.detail)}</p><small>COMPLEMENTARY SKILLS. ONE GOAL.</small></div></div><div class="v2-compare-decision"><span>${esc(bottom.title)}</span><strong>${esc(bottom.detail)}</strong>${arrow}</div></div>`;
}
function brief(s){
 const p=(s.points||[]).slice(0,3).map(x=>pair(x));
 while(p.length<3)p.push(pair(['The project | What needs to move forward?','The tools | What does your team use?','The first task | What should we start with?'][p.length]));
 return `<div class="v2-brief-stage"><div class="v2-brief-paper"><div class="v2-paper-top"><span>PROJECT STARTER</span><b>B&M / YOUR NEXT MOVE</b></div>${p.map((v,i)=>`<div class="v2-brief-row"><span>0${i+1}</span><div><small>${esc(v.title)}</small><strong>${esc(v.detail)}</strong></div>${i===2?mark('check'):'<i></i>'}</div>`).join('')}<div class="v2-paper-bottom"><i></i>A concrete starting point. We take it from there.</div></div><div class="v2-brief-contact"><div><span>CONSULTANTS / SQUADS / APPLICATIONS</span><b>Let’s talk about<br>your project.</b></div><span>${arrow}</span></div></div>`;
}
export function campaignArtwork(post,index=0){
 const s=post.slides[index]||post.slides[0]||{label:'',title:'Your next move.',body:'',points:[]};
 const layouts={launch,mission,product,compare,brief};
 if(!layouts[post.template])throw Error('Unknown campaign template.');
 const visual=post.image?`<div class="v2-custom-stage"><img src="${esc(post.image)}" alt="Visuel fourni pour cette publication"><div>${(s.points||[]).slice(0,3).map(p=>`<span>${esc(pair(p).title)}</span>`).join('')}</div></div>`:layouts[post.template](s);
 return chrome(post,s,index,visual);
}
