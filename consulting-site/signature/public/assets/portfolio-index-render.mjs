import {esc,image,href} from './portfolio-render.mjs';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const contactCard = `<aside class="pi-invitation" data-index-reveal><a href="/contact/?besoin=solution" aria-labelledby="pi-next-project"><span class="pi-invitation-top">LE PROCHAIN CHAPITRE <span aria-hidden="true">+</span></span><div class="pi-invitation-copy"><p class="pi-kicker">ET VOTRE PROJET ?</p><h2 id="pi-next-project">Une idée à<br>mettre en œuvre.</h2><p>Un outil à créer, un parcours à simplifier.<br>Parlons de votre besoin.</p></div><span class="pi-invitation-link">Échangeons ${arrow}</span></a></aside>`;

export function indexCardsMarkup(projects) {
  if (!projects.length) return `<div class="pi-empty"><h2>La suite se prépare.</h2><p>Les prochains projets seront présentés ici.</p></div>${contactCard}`;
  return projects.map((project,index)=>{
    const name=project.isTest?(project.name||'').replace(/^TEST\s*[—–-]\s*/i,''):project.name;
    const mobile=project.type==='mobile';
    const second=(project.gallery||[]).find(media=>media?.url&&media.url!==project.cover?.url);
    const screen=mobile
      ? `<div class="pi-phone-group" data-index-depth>${second?`<div class="pi-phone pi-phone-secondary">${image(second)}</div>`:''}<div class="pi-phone pi-phone-primary">${image(project.cover,'',index<3)}</div></div>`
      : `<div class="pi-browser" data-index-depth><div class="pi-browser-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><span>${esc(name)}</span><span>WEB</span></div>${image(project.cover,'',index<3)}</div>`;
    const tags=[mobile?'Mobile':'Web',...(project.tags||[]).slice(0,1)];
    return `<article class="pi-case ${mobile?'pi-case-mobile':'pi-case-web'}" data-index-card data-index-reveal>
      <a class="pi-case-link" href="${href(project)}" aria-labelledby="pi-case-title-${index}">
        <div class="pi-case-stage">
          ${screen}
        </div>
        <div class="pi-stage-top">${project.isTest?'<span class="pi-demo-label">Démonstration</span>':`<span class="pi-category-label">${esc(project.category||'Projet digital')}</span>`}<span class="pi-case-arrow">${arrow}</span></div>
        <div class="pi-case-copy">
          <ul class="pi-case-tags">${tags.map(tag=>`<li>${esc(tag)}</li>`).join('')}</ul>
          <h2 id="pi-case-title-${index}">${esc(name)}</h2>
        </div>
      </a>
    </article>`;
  }).join('')+contactCard;
}
