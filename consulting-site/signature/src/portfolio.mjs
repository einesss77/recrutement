import { carouselMarkup, projectMarkup, collectionMarkup } from '../public/assets/portfolio-render.mjs';
import { projects } from './project-data.mjs';

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
  return `<header class="portfolio-page-heading">
    <div class="wrap">
      <div>
        <span class="folio-chapter">B&M / ÉTUDES DE CAS</span>
        <h1>Du besoin<br><em>à l’interface.</em></h1>
      </div>
      <div class="folio-index-aside">
        <span>WEB / MOBILE / OUTILS MÉTIER</span>
        <p>Le problème de départ, les choix de conception et les écrans. Chaque démonstration est signalée sur sa fiche.</p>
      </div>
    </div>
  </header>
  ${projectCarousel(null, { standalone: true })}
  <section class="folio-collection">
    <div class="wrap">
      <header class="folio-collection-heading">
        <span class="folio-chapter">L’INDEX</span>
        <h2>Projets et <em>démonstrations.</em></h2>
      </header>
      <div data-project-collection>${collectionMarkup(projects)}</div>
    </div>
  </section>
  <section class="portfolio-contact has-bm-signature">
    <span class="bm-signature-arc" aria-hidden="true"></span>
    <div class="wrap">
      <h2>Quel usage souhaitez-vous<br><em>simplifier ?</em></h2>
      <a href="/contact/?besoin=solution">Décrire mon projet <span aria-hidden="true">↗</span></a>
    </div>
  </section>`;
}

export function projectPage(project) {
  const nextProject = projects.find(item => item.slug !== project.slug);
  return `<div data-cms-project data-example="${project.slug}">${projectMarkup(project, nextProject)}</div>`;
}

export function dynamicProjectShell() {
  return '<div data-cms-project><section class="folio-loading wrap"><h1>Votre projet.</h1><p role="status">Chargement de la réalisation…</p></section></div>';
}
