export const projects = [
  {
    slug: 'exemple-web',
    name: 'Atelier web',
    title: 'Traiter les demandes.|Garder le fil.',
    plainTitle: 'Atelier web, démonstration de suivi des demandes',
    summary: 'Une démonstration web pour attribuer les demandes d’équipe, suivre leur avancement et retrouver leurs documents.',
    sector: 'Coordination d’équipe',
    objective: 'Donner à chaque demande un responsable, une échéance et une prochaine action.',
    category: 'Application web',
    type: 'web',
    tone: 'mint',
    isTest: true,
    featured: true,
    position: 0,
    cover: {
      url: '/assets/project-web-demo.svg', width: 1440, height: 900,
      alt: 'Maquette Atelier web avec planning d’équipe et liste des demandes.'
    },
    mobileCover: {
      url: '/assets/project-atelier-mobile.svg', width: 390, height: 844,
      alt: 'Maquette mobile Atelier avec les demandes et leur statut.'
    },
    gallery: [
      {
        url: '/assets/project-web-detail.svg', width: 1280, height: 900,
        alt: 'Maquette d’une fiche de préparation d’atelier.',
        caption: 'Sur la fiche, le contexte, le responsable et les documents.'
      },
      {
        url: '/assets/project-web-demo.svg', width: 1440, height: 900,
        alt: 'Maquette de la vue d’ensemble du planning.',
        caption: 'Le planning met les échéances en regard des priorités.'
      }
    ],
    icons: [
      { icon: 'layers', title: 'Suivi des demandes', caption: 'Un responsable et un statut par demande.' },
      { icon: 'search', title: 'Pièces jointes', caption: 'Les documents restent accessibles depuis la fiche.' },
      { icon: 'phone', title: 'Consultation mobile', caption: 'Les mêmes repères depuis le téléphone.' }
    ],
    tags: ['Design d’interface', 'Outil métier'],
    need: 'Une équipe reçoit ses demandes par e-mail, suit les échéances dans un tableau et classe les pièces jointes à part. Pour reprendre un dossier, il faut reconstituer son contexte à travers plusieurs outils.',
    response: 'Nous avons illustré un parcours en deux vues. Le tableau aide à choisir la demande à traiter. La fiche conserve les éléments nécessaires pour prendre la suite.',
    delivery: [
      'Maquette du tableau des demandes et du planning',
      'Maquette de la fiche avec responsable, statut et documents',
      'Déclinaison mobile de la liste et du suivi'
    ].join('\n'),
    contentBlocks: [
      {
        type: 'text',
        title: 'Un repère commun à chaque étape',
        text: 'Les mêmes intitulés et statuts relient le tableau, la fiche et le téléphone. Un collaborateur peut reprendre une demande à partir de la dernière action visible.'
      }
    ],
    outcome: [
      'Voir qui traite chaque demande.',
      'Retrouver les pièces depuis la fiche.',
      'Identifier les échéances à partir du planning.'
    ].join('\n'),
    conclusion: 'Un test utilisateur mesurerait le temps nécessaire pour reprendre une demande et retrouver ses documents.'
  },
  {
    slug: 'exemple-mobile',
    name: 'Compagnon terrain',
    title: 'La journée de terrain.|Mission par mission.',
    plainTitle: 'Compagnon terrain, démonstration mobile pour les interventions',
    summary: 'Une démonstration mobile pour préparer une intervention, retrouver les pièces utiles et partager son avancement.',
    sector: 'Interventions techniques',
    objective: 'Permettre à un intervenant de préparer sa prochaine mission depuis son téléphone.',
    category: 'Application mobile',
    type: 'mobile',
    tone: 'sand',
    isTest: true,
    featured: true,
    position: 1,
    cover: {
      url: '/assets/project-mobile-demo.svg', width: 390, height: 844,
      alt: 'Maquette de la liste des missions sur téléphone.'
    },
    gallery: [
      {
        url: '/assets/project-mobile-demo.svg', width: 390, height: 844,
        alt: 'Maquette de la liste des missions sur téléphone.',
        caption: 'La journée commence par les prochaines interventions.'
      },
      {
        url: '/assets/project-mobile-detail.svg', width: 390, height: 844,
        alt: 'Maquette de la fiche détaillée d’une intervention.',
        caption: 'La fiche réunit adresse, consignes et actions de suivi.'
      }
    ],
    icons: [
      { icon: 'phone', title: 'Fiche de mission', caption: 'L’adresse et les consignes dès l’ouverture.' },
      { icon: 'check', title: 'Suivi d’avancement', caption: 'Un statut partagé avec la coordination.' }
    ],
    tags: ['Parcours mobile', 'Design d’interface'],
    need: 'Le planning arrive par e-mail et les détails d’intervention circulent entre plusieurs conversations. Avant un déplacement, un intervenant doit confirmer une adresse et rechercher les consignes à jour.',
    response: 'La maquette organise le parcours autour de la mission. La liste présente les prochains déplacements. Une fiche donne accès aux renseignements nécessaires et à l’action de suivi.',
    delivery: [
      'Maquette de la liste des missions du jour',
      'Maquette de la fiche d’intervention',
      'Présentation des actions de suivi sur téléphone'
    ].join('\n'),
    contentBlocks: [
      {
        type: 'text',
        title: 'Les informations dans l’ordre du travail',
        text: 'Le parcours met en avant la prochaine intervention, puis l’adresse et les consignes. L’action de suivi reste à portée de main une fois la mission ouverte.'
      }
    ],
    outcome: [
      'Confirmer les détails de la prochaine intervention.',
      'Retrouver les consignes depuis la mission.',
      'Rendre l’avancement visible à l’équipe de coordination.'
    ].join('\n'),
    conclusion: 'Un test en situation vérifierait la lecture des consignes et le passage à l’action sur téléphone.'
  }
];
