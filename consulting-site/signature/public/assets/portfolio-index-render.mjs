import {esc,image,href} from './portfolio-render.mjs';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';

export function indexCardsMarkup(projects) {
  if (!projects.length) return '<div class="pi-empty"><h2>La suite se prépare.</h2><p>Les prochains projets seront présentés ici.</p></div>';
  return projects.map((project,index)=>{
    const number=String(index+1).padStart(2,'0');
    const name=project.isTest?(project.name||'').replace(/^TEST\s*[—–-]\s*/i,''):project.name;
    const mobile=project.type==='mobile';
    const second=(project.gallery||[]).find(media=>media?.url&&media.url!==project.cover?.url);
    const screen=mobile
      ? `<div class="pi-phone-group" data-index-depth>${second?`<div class="pi-phone pi-phone-secondary">${image(second)}</div>`:''}<div class="pi-phone pi-phone-primary">${image(project.cover,'',index===0)}</div></div>`
      : `<div class="pi-browser" data-index-depth><div class="pi-browser-bar" aria-hidden="true"><span><i></i><i></i><i></i></span><span>${esc(name)}</span><span>WEB</span></div>${image(project.cover,'',index===0)}</div>`;
    return `<article class="pi-case ${mobile?'pi-case-mobile':'pi-case-web'}" data-index-card>
      <a class="pi-case-link" href="${href(project)}" aria-labelledby="pi-case-title-${index}">
        <div class="pi-case-copy" data-index-reveal>
          <span class="pi-case-number" aria-hidden="true">${number}<i></i></span>
          <p class="pi-kicker">${esc(project.category||'Projet digital')}</p>
          <h2 id="pi-case-title-${index}">${esc(name)}</h2>
          <p class="pi-case-summary">${esc(project.objective||project.summary)}</p>
          <ul class="pi-case-tags">${(project.tags||[]).slice(0,3).map(tag=>`<li>${esc(tag)}</li>`).join('')}</ul>
          <span class="pi-case-cta">Explorer le projet <span>${arrow}</span></span>
        </div>
        <div class="pi-case-stage" data-index-reveal>
          <div class="pi-stage-top"><span>${number} / ${mobile?'MOBILE':'WEB'}</span>${project.isTest?'<span class="pi-demo-label">Démonstration</span>':''}</div>
          <div class="pi-stage-grid" aria-hidden="true"></div>
          ${screen}
          <div class="pi-stage-bottom"><span>${esc(project.sector||project.category||'')}</span><span>${arrow}</span></div>
        </div>
      </a>
    </article>`;
  }).join('');
}
