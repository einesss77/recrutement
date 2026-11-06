import {projects} from './project-data.mjs';

const services = [
  ['01','Application web & SaaS','/services/application-web-saas/'],
  ['02','Application mobile','/services/application-mobile/'],
  ['03','Logiciel métier','/services/logiciel-metier/'],
  ['04','Intelligence artificielle','/services/intelligence-artificielle/'],
];
const steps = [
  {title:'Cadrer',label:'Le plan',copy:'Définir le problème, les usages et le premier périmètre utile.',output:'Périmètre & priorités'},
  {title:'Construire',label:'Le prototype',copy:'Voir le produit prendre forme, tester les parcours et ajuster ensemble.',output:'Prototype & démonstrations'},
  {title:'Livrer',label:'Le produit',copy:'Vérifier la solution, préparer la mise en service et transmettre les clés.',output:'Recette & prise en main'},
];

function stepVisuals() {
  return `
    <div class="ph-scene" data-ph-scene="0">
      <div class="ph-brief"><span>01 / LE CADRAGE</span><strong>Le plan de départ.</strong><ol><li>Usages <b>✓</b></li><li>Priorités <b>✓</b></li><li>Périmètre <b>✓</b></li></ol></div>
    </div>
    <div class="ph-scene" data-ph-scene="1" hidden>
      <div class="ph-window"><div class="ph-window-bar"><i></i><i></i><i></i><span>PROTOTYPE</span></div><div class="ph-wire"><aside></aside><div><b></b><div><i></i><i></i></div><i></i><i></i></div></div></div><span class="ph-scene-chip">↖ À tester</span>
    </div>
    <div class="ph-scene" data-ph-scene="2" hidden>
      <div class="ph-window ph-window-live"><div class="ph-window-bar"><i></i><i></i><i></i><span>VOTRE APPLICATION</span></div><div class="ph-dashboard"><aside></aside><div><strong>Vue d’ensemble</strong><div class="ph-dashboard-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ph-dashboard-row"><i></i><i></i><i></i></div></div></div></div><span class="ph-scene-chip">✓ Prêt à livrer</span>
    </div>`;
}

export function renderHome({icon,button,arrowLink}) {
  return `
  <section class="ph-hero" aria-labelledby="ph-title">
    <div class="wrap ph-hero-grid">
      <div class="ph-hero-content">
        <p class="ph-kicker"><i></i> STUDIO PRODUIT & INGÉNIERIE IT</p>
        <h1 id="ph-title">Produits numériques.<br><em>Équipes renforcées.</em></h1>
        <p class="ph-lead">B&M conçoit vos applications et mobilise les experts IT pour faire avancer vos projets.</p>
        <div class="ph-actions">${button('Parler de mon projet','/contact/?besoin=solution','dark')}${arrowLink('Renforcer mon équipe','#outsourcing')}</div>
      </div>
      <figure class="ph-hero-art">
        <div class="ph-photo"><img src="/assets/bm-collective-960.webp" srcset="/assets/bm-collective-640.webp 640w, /assets/bm-collective-960.webp 960w, /assets/bm-collective-1536.webp 1536w" sizes="(max-width: 760px) 92vw, (max-width: 1400px) 46vw, 620px" width="1536" height="1024" alt="Une arche et des volumes en pierre et en verre assemblés en équilibre." fetchpriority="high"><span class="ph-art-index" aria-hidden="true">B&M / 01</span><span class="ph-art-plus" aria-hidden="true">＋</span></div>
        <figcaption><span>FIG. 01 / L’ART D’ASSEMBLER</span><span aria-hidden="true">↓</span></figcaption>
      </figure>
    </div>
  </section>
  <div class="ph-strip" id="accompagnements"><div class="wrap"><span>CONSEIL & CONCEPTION</span><span>INGÉNIERIE LOGICIELLE</span><span>CONSULTANTS & SQUADS</span></div></div>

  <section class="ph-section ph-expertise" id="expertises" aria-labelledby="ph-expertise-title"><div class="wrap">
    <header class="ph-section-head"><div><p class="ph-kicker">01 / EXPERTISES</p><h2 id="ph-expertise-title">Deux façons<br><em>de faire équipe.</em></h2></div><p>Confiez-nous un produit à réaliser ou intégrez les compétences qui manquent à votre équipe.</p></header>
    <div class="ph-offers">
      <article class="ph-offer ph-offer-product" id="solutions-concretes"><div class="ph-offer-top"><span>01 / PROJET SUR MESURE</span>${icon('layers')}</div><h3>Construire un produit.</h3><p>De la conception à la mise en service, autour de vos usages.</p><div class="ph-service-list" id="nos-services">${services.map(([n,label,href])=>`<a href="${href}"><span aria-hidden="true">${n}</span><strong>${label}</strong>${icon()}</a>`).join('')}</div>${arrowLink('Explorer les solutions','/solutions-sur-mesure/','ph-offer-link')}</article>
      <article class="ph-offer ph-offer-team" id="outsourcing"><div class="ph-offer-top"><span>02 / RENFORT IT</span>${icon('people')}</div><h3>Renforcer une équipe.</h3><p>Un consultant ou une squad, selon le périmètre et le pilotage souhaités.</p><div class="ph-team-lines" id="formats"><div><span>SOLO</span><strong>Une expertise ciblée</strong></div><div><span>SQUAD</span><strong>Des rôles complémentaires</strong></div></div><div class="ph-tags"><span>Fullstack</span><span>Cloud</span><span>Data</span><span>IA</span><span>Produit</span></div>${arrowLink('Découvrir les profils & squads','/profils-et-squads/','ph-offer-link')}</article>
    </div>
  </div></section>

  <section class="ph-section ph-work" id="demonstrations" aria-labelledby="ph-work-title"><div class="wrap">
    <header class="ph-section-head"><div><p class="ph-kicker">02 / DÉMONSTRATIONS</p><h2 id="ph-work-title">Des usages.<br><em>Des interfaces.</em></h2></div>${arrowLink('Voir les projets et démonstrations','/realisations/')}</header>
    <div class="ph-projects">${projects.slice(0,2).map((project,i)=>`<article class="ph-project"><a href="/realisations/${project.slug}/"><div class="ph-project-image ph-project-image-${i}"><span class="ph-project-index">0${i+1} / DÉMO</span><img src="${project.cover.url}" alt="${project.cover.alt}" width="${project.cover.width}" height="${project.cover.height}" loading="lazy" decoding="async"></div><div class="ph-project-details"><div><p class="ph-kicker">${project.category}</p><h3>${project.name}</h3><p>${project.summary}</p></div><span class="ph-circle" aria-hidden="true">${icon()}</span></div></a></article>`).join('')}</div>
    <p class="ph-caption">Concepts illustratifs · données fictives.</p>
  </div></section>

  <section class="ph-section ph-method" id="methode-projet" aria-labelledby="ph-method-title"><div class="wrap">
    <header class="ph-section-head"><div><p class="ph-kicker">03 / MÉTHODE</p><h2 id="ph-method-title">Du brief<br><em>au premier usage.</em></h2></div><p>Un produit se construit avec vous, par étapes courtes et décisions visibles.</p></header>
    <div class="ph-lab" data-ph-lab>
      <div class="ph-lab-visual" aria-hidden="true"><div class="ph-lab-meta"><span>ATELIER B&M</span><span data-ph-number>01 / 03</span></div>${stepVisuals()}<div class="ph-lab-footer"><span data-ph-caption>${steps[0].label}</span><i></i></div></div>
      <div class="ph-lab-steps">${steps.map((step,i)=>`<div class="ph-step" data-ph-step><button type="button" data-ph-trigger="${i}" aria-expanded="${i===0}" aria-controls="ph-step-${i}"><span class="ph-step-index">0${i+1}</span><strong>${step.title}</strong><span class="ph-step-icon" aria-hidden="true">${icon('plus')}</span></button><div class="ph-step-detail" id="ph-step-${i}" ${i===0?'':'hidden'}><p>${step.copy}</p><span>${icon('check')}${step.output}</span></div><span hidden data-ph-label>${step.label}</span></div>`).join('')}${arrowLink('Découvrir notre méthode','/notre-methode/','ph-method-link')}</div>
    </div>
  </div></section>

  <section class="ph-end" id="parlons-en"><div class="wrap ph-end-inner"><div><p class="ph-kicker"><i></i> LE PREMIER ÉCHANGE</p><h2>Qu’est-ce qu’on<br><em>construit ensemble ?</em></h2></div><div><p>Parlez-nous de votre projet ou du rôle qu’il vous manque.</p>${button('Contacter B&M','/contact/')}</div></div></section>`;
}
