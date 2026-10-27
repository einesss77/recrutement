import {carouselMarkup,projectMarkup,collectionMarkup} from '../public/assets/portfolio-render.mjs';
export const projects=[
  {
    "slug": "exemple-web",
    "name": "Atelier web",
    "title": "Centraliser les demandes.|Coordonner le travail.",
    "summary": "Un espace partagé pour recevoir les demandes internes, les attribuer et retrouver les documents associés. Ce cas fictif présente le fonctionnement et les choix de conception d’un outil métier.",
    "client": "Atelier — entreprise fictive",
    "sector": "Services aux entreprises",
    "year": "2026",
    "objective": "Permettre à chaque collaborateur de savoir quoi traiter, qui s’en charge et où retrouver les informations.",
    "category": "Application web",
    "type": "web",
    "tone": "mint",
    "isTest": true,
    "cover": {
      "url": "/assets/project-web-demo.svg",
      "alt": "Interface Atelier illustrative : planning et priorités."
    },
    "mobileCover": {
      "url": "/assets/project-atelier-mobile.svg",
      "alt": "Interface mobile Atelier illustrative : demandes et statuts."
    },
    "gallery": [
      {
        "url": "/assets/project-web-detail.svg",
        "alt": "Fiche illustrative de préparation d’un atelier.",
        "caption": "La fiche rassemble le contexte, l’équipe et les documents du sujet."
      },
      {
        "url": "/assets/project-web-demo.svg",
        "alt": "Vue d’ensemble du planning et des priorités.",
        "caption": "Le planning d’équipe et les sujets à traiter."
      }
    ],
    "icons": [
      {
        "icon": "layers",
        "title": "Suivi des demandes",
        "caption": "Un responsable et un statut visibles pour chaque sujet."
      },
      {
        "icon": "search",
        "title": "Documents contextualisés",
        "caption": "Les pièces utiles rattachées à la demande concernée."
      },
      {
        "icon": "phone",
        "title": "Consultation mobile",
        "caption": "Retrouver les demandes et leur avancement sur téléphone."
      }
    ],
    "tags": [
      "Design d’interface",
      "Développement",
      "Recette"
    ],
    "stack": [
      "React",
      "Node.js",
      "PostgreSQL"
    ],
    "contentBlocks": [
      {
        "type": "text",
        "title": "De la demande à l’action",
        "text": "Une demande commence par un contexte et une priorité. L’équipe désigne ensuite un responsable, prépare les documents et organise la prochaine étape. La fiche conserve ces repères au fil du traitement.\n\nLa version mobile reprend ce même parcours : consulter ses demandes, vérifier leur statut et ouvrir les informations utiles."
      }
    ],
    "need": "Dans ce scénario, les équipes reçoivent les demandes par e-mail, suivent leur avancement dans un tableau et conservent les pièces utiles dans des dossiers séparés. Reconstituer le contexte d’un sujet demande de passer d’un outil à l’autre.\n\nLe besoin porte sur un point d’entrée commun : enregistrer la demande, identifier son responsable, suivre son statut et retrouver ses documents. Le parcours doit rester accessible aux personnes qui déposent une demande comme à celles qui la traitent.",
    "response": "Le projet rassemble la réception et le suivi des demandes dans une application web. Chaque sujet dispose de sa fiche : description, responsable, échéance, statut et documents associés.\n\nLa vue d’ensemble donne les priorités de l’équipe. Le détail permet de préparer l’action suivante sans rechercher les informations dans plusieurs conversations.",
    "delivery": "Un tableau des demandes avec filtres par statut et responsable\nUne fiche par demande : contexte, échéance et documents associés\nUn planning partagé pour préparer les prochains ateliers\nUn parcours mobile pour consulter et déposer une demande",
    "outcome": "Retrouver le contexte et les documents depuis une seule fiche.\nIdentifier le responsable et l’avancement de chaque demande.\nPartager les mêmes priorités entre les collaborateurs.",
    "conclusion": "Ces bénéfices sont les objectifs du scénario de démonstration. Les gains de temps et l’adoption seraient mesurés après une mise en service réelle.",
    "featured": true,
    "position": 0,
    "plainTitle": "Atelier web — demandes et coordination"
  },
  {
    "slug": "exemple-mobile",
    "type": "mobile",
    "category": "Application mobile",
    "name": "Compagnon terrain",
    "title": "Préparer les interventions.|Garder le lien avec le terrain.",
    "plainTitle": "L’essentiel, à portée de main.",
    "summary": "Une application mobile qui rassemble les missions, leurs informations et les actions de suivi. Ce cas fictif illustre le parcours d’un intervenant et de son équipe de coordination.",
    "image": "/assets/project-mobile-demo.svg",
    "imageAlt": "Interface mobile illustrative : liste de missions et accès aux détails. Projet fictif.",
    "tone": "sand",
    "tags": [
      "Parcours mobile",
      "Design d’interface",
      "Développement"
    ],
    "need": "Dans ce scénario, le planning est partagé par e-mail et les informations d’intervention circulent dans plusieurs conversations. Les intervenants doivent appeler le bureau pour confirmer une adresse, retrouver une pièce ou signaler une évolution.\n\nLe besoin : disposer sur téléphone d’une mission à jour, de son contexte et de ses documents, puis transmettre son avancement à l’équipe de coordination.",
    "response": "L’application organise le travail autour de la mission. Une liste présente les interventions à venir ; chaque fiche rassemble les informations utiles et les actions de suivi.\n\nLes repères restent les mêmes du planning au détail de mission pour faciliter la consultation pendant un déplacement.",
    "delivery": "Liste des missions et accès au détail\nConsultation des informations et documents de mission\nActions de suivi accessibles depuis le téléphone",
    "outcome": "Préparer une mission sans reconstituer son contexte.\nRetrouver les informations utiles pendant l’intervention.\nPartager l’avancement avec l’équipe de coordination.",
    "cover": {
      "url": "/assets/project-mobile-demo.svg",
      "alt": "Interface mobile illustrative : liste de missions et accès aux détails. Projet fictif."
    },
    "isTest": true,
    "mobileCover": {
      "url": "/assets/project-mobile-demo.svg",
      "alt": "Interface mobile illustrative. Projet fictif."
    },
    "stack": [
      "React Native",
      "TypeScript"
    ],
    "featured": true,
    "position": 1,
    "gallery": [
      {
        "url": "/assets/project-mobile-demo.svg",
        "alt": "Interface mobile illustrative : liste de missions et accès aux détails. Projet fictif.",
        "caption": "Vue d’ensemble de l’interface."
      },
      {
        "url": "/assets/project-mobile-detail.svg",
        "alt": "Écran illustratif du détail d’une mission.",
        "caption": "Une information lisible et des actions accessibles sur le terrain."
      }
    ],
    "icons": [
      {
        "icon": "phone",
        "title": "Fiche de mission",
        "caption": "Les informations utiles accessibles depuis un écran."
      },
      {
        "icon": "check",
        "title": "Suivi d’avancement",
        "caption": "Des statuts partagés entre le terrain et le bureau."
      }
    ],
    "client": "Entreprise de services — scénario fictif",
    "sector": "Interventions techniques",
    "year": "2026",
    "objective": "Donner aux intervenants les informations nécessaires avant une mission et permettre au bureau d’en suivre l’avancement.",
    "contentBlocks": [
      {
        "type": "text",
        "title": "Un parcours centré sur la mission",
        "text": "L’intervenant consulte sa prochaine mission, ouvre ses informations et retrouve les actions de suivi. La présentation privilégie des commandes accessibles et une lecture adaptée au téléphone."
      }
    ],
    "conclusion": "Scénario de démonstration : les bénéfices présentés sont des objectifs, sans mesure d’impact réelle."
  }
];
export function projectCarousel(api,{standalone=false}={}){return `<section class="portfolio-section ${standalone?'portfolio-on-index':''}" ${standalone?'':'id="realisations"'}><div class="wrap">${standalone?'':`<div class="portfolio-heading"><div><span class="folio-chapter">NOS RÉALISATIONS</span><h2>Quelques <em>réalisations.</em></h2></div><a class="text-link" href="/realisations/">Explorer les réalisations ↗</a></div>`}<div data-project-carousel role="region" aria-roledescription="carrousel" aria-label="Nos réalisations">${carouselMarkup(projects)}</div><p class="folio-feed-status" role="status"></p></div></section>`;}
export function portfolioIndex(){return `<header class="portfolio-page-heading"><div class="wrap"><div><span class="folio-chapter">B&M / SÉLECTION DE PROJETS</span><h1>Du besoin au produit.<br><em>Nos réalisations.</em></h1></div><div class="folio-index-aside"><span>WEB / MOBILE / OUTILS MÉTIER</span><p>Applications, outils métier et expériences mobiles.<br>Découvrez le contexte et notre intervention.</p></div></div></header>${projectCarousel(null,{standalone:true})}<section class="folio-collection"><div class="wrap"><div class="folio-collection-heading"><span class="folio-chapter">EXPLORER</span><h2>Toutes les<br><em>réalisations.</em></h2></div><div data-project-collection>${collectionMarkup(projects)}</div></div></section><section class="portfolio-contact has-bm-signature"><span class="bm-signature-arc" aria-hidden="true"></span><div class="wrap"><h2>Un profil ou un projet ?<br><em>Parlons-en.</em></h2><a href="/contact/">Parlons de votre besoin <span aria-hidden="true">↗</span></a></div></section>`;}
export function projectPage(p){return `<div data-cms-project data-example="${p.slug}">${projectMarkup(p,projects.find(n=>n.slug!==p.slug))}</div>`;}
export function dynamicProjectShell(){return '<div data-cms-project><section class="folio-loading wrap"><h1>Votre projet.</h1><p role="status">Chargement de la réalisation…</p></section></div>';}
