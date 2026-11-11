import { carouselMarkup, projectMarkup } from '../public/assets/portfolio-render.mjs';
import { projects } from './project-data.mjs';
import { indexCardsMarkup } from '../public/assets/portfolio-index-render.mjs';

export { projects };

export function projectCarousel(_api, { standalone = false } = {}) {
  const heading = standalone ? '' : `
    <header class="portfolio-heading">
      <div>
        <span class="folio-chapter">ÉTUDES DE CAS</span>
        <h2>Le produit <em>en situation.</em></h2>
      </div>
      <a class="text-link" href="/realisations/">Voir les études de cas ↗</a>
    </header>`;

  return `<section class="portfolio-section ${standalone ? 'portfolio-on-index' : ''}" ${standalone ? '' : 'id="realisations"'}>
    <div class="wrap">
      ${heading}
      <div data-project-carousel role="region" aria-roledescription="carrousel" aria-label="Sélection de projets">
        ${carouselMarkup(projects)}
      </div>
      <p class="folio-feed-status" role="status"></p>
    </div>
  </section>`;
}

export function portfolioIndex() {
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  return `<div class="pi-index">
    <header class="pi-hero"><div class="wrap">
      <p class="pi-kicker">B&M / RÉALISATIONS & DÉMONSTRATIONS</p>
      <div class="pi-hero-grid"><h1>Le travail,<br><span>en images.</span></h1><div><p>Des interfaces pensées pour le quotidien.<br>Découvrez les usages, les choix et les écrans de chaque projet.</p><a class="pi-explore" href="#projets">Explorer la sélection ${arrow}</a></div></div>
      <div class="pi-hero-bottom"><span>WEB / MOBILE / OUTILS MÉTIER</span><span><b data-index-count>${String(projects.length).padStart(2,'0')}</b> PROJETS À EXPLORER</span></div>
    </div></header>
    <section class="pi-selection" id="projets" aria-label="Projets et démonstrations"><div class="wrap"><div data-portfolio-index>${indexCardsMarkup(projects)}</div><p class="pi-disclosure" data-index-disclosure>Les projets présentés sont des démonstrations sur données fictives.</p><p class="pi-status" role="status"></p></div></section>
  </div>`;
}

export function projectPage(project) {
  const nextProject = projects.find(item => item.slug !== project.slug);
  return `<div data-cms-project data-example="${project.slug}">${projectMarkup(project, nextProject)}</div>`;
}

export function dynamicProjectShell() {
  return '<div data-cms-project><section class="folio-loading wrap"><h1>Votre projet.</h1><p role="status">Chargement de la réalisation…</p></section></div>';
}
