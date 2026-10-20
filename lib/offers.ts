export type Offer = {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  missions: string[];
  skills: string[];
  profile: string[];
  specificQuestion: string;
  specificQuestions?: string[];
};

export const offers: Record<string, Offer> = {
  "business-developer-it": {
    slug: "business-developer-it",
    title: "Business Developer IT",
    summary:
      "Développer l’activité commerciale IT de B&M Digital Consulting auprès de clients recherchant des profils techniques qualifiés.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "Cette page sert de modèle visuel et fonctionnel pour valider le design commun avant de décliner les six autres offres.",
    ],
    missions: [
      "Identifier et qualifier de nouvelles opportunités commerciales IT.",
      "Comprendre les besoins clients et positionner les bons profils consultants.",
      "Suivre le cycle commercial de la prospection au closing.",
      "Maintenir une relation structurée avec les clients et les talents.",
    ],
    skills: [
      "Prospection B2B et développement commercial.",
      "Bonne compréhension des métiers IT et du staffing.",
      "Capacité à négocier, prioriser et documenter les échanges.",
      "Aisance avec LinkedIn, CRM et outils de suivi commercial.",
    ],
    profile: [
      "Expérience confirmée dans le recrutement, le consulting IT ou la vente de services numériques.",
      "Communication claire, autonomie et forte orientation résultat.",
      "Capacité à travailler avec des interlocuteurs en France, en Tunisie ou à l’international.",
    ],
    specificQuestion: "Quel type de produits ou services B2B avez-vous déjà vendu ?",
    specificQuestions: [
      "Quel type de produits ou services B2B avez-vous déjà vendu ?",
      "Faisiez-vous principalement de la chasse ou de la gestion de comptes existants ?",
      "Combien de nouveaux clients avez-vous personnellement signés au cours des 12 derniers mois ?",
      "Quel chiffre d’affaires ou volume d’affaires avez-vous personnellement généré ?",
      "Sur quels marchés/pays avez-vous déjà prospecté ?",
      "Quels canaux utilisez-vous pour obtenir vos rendez-vous : téléphone, email, LinkedIn, événements, réseau… ?",
      "Avez-vous déjà vendu des prestations IT, du staffing, de l’outsourcing ou des équipes techniques ?",
    ],
  },
  "growth-manager": {
    slug: "growth-manager",
    title: "Responsable Marketing Digital & Ads",
    summary:
      "Piloter les campagnes Google Ads, Meta Ads et TikTok Ads de nos clients, tout en coordonnant leur stratégie de contenu et leur présence sur les réseaux sociaux.",
    description: [
      "B&M Digital Consulting est une entreprise technologique basée à Dubaï, qui accompagne des clients en France et à l’international dans leurs projets digitaux.",
      "Dans le cadre du développement de notre agence marketing, nous recherchons un profil opérationnel capable de piloter les campagnes publicitaires de nos clients et de coordonner leur stratégie de contenu et leurs réseaux sociaux.",
      "Vous savez construire une campagne performante, proposer des idées de contenus et organiser leur production ? Ce poste est fait pour vous.",
      "Vous travaillerez avec les équipes chargées de la création graphique, du montage vidéo et du développement web. Votre rôle : définir les actions, coordonner leur réalisation et piloter les résultats.",
      "Poste basé en Tunisie, en télétravail ou depuis nos locaux à Tunis.",
      "Pour postuler, déposez votre CV dans le formulaire et partagez un exemple de campagne que vous avez personnellement pilotée ainsi qu’un calendrier éditorial ou un brief créatif. Vos exemples peuvent être anonymisés pour préserver la confidentialité de vos clients.",
    ],
    missions: [
      "Construire des stratégies publicitaires adaptées aux objectifs et aux budgets de chaque client.",
      "Créer, piloter et optimiser les campagnes Google Ads, Meta Ads et TikTok Ads.",
      "Définir les audiences, les messages, les formats et la répartition des budgets.",
      "Tester différentes créations et approches pour améliorer les résultats.",
      "Mettre en place et vérifier le suivi des conversions.",
      "Analyser les performances : leads, ventes, CPL, CAC, ROAS et taux de conversion.",
      "Proposer des améliorations sur les landing pages et les parcours de conversion.",
      "Définir les thèmes, les formats et le rythme de publication pour chaque client, puis construire les calendriers éditoriaux.",
      "Proposer des idées de vidéos, de publications, d’offres et d’angles publicitaires.",
      "Préparer les briefs pour les designers et monteurs vidéo, coordonner la production et vérifier la qualité des contenus avant diffusion.",
      "Assurer la cohérence entre les contenus publiés et les campagnes publicitaires.",
      "Comprendre les besoins des clients et les traduire en actions concrètes.",
      "Organiser les priorités, les plannings et les validations pour plusieurs comptes en parallèle.",
      "Présenter des reportings clairs et des recommandations aux clients.",
      "Utiliser l’IA et l’automatisation pour améliorer l’efficacité du travail.",
    ],
    skills: [
      "Maîtrise opérationnelle de Google Ads, Meta Ads et TikTok Ads.",
      "Bonne compréhension des réseaux sociaux, des contenus et des mécaniques de conversion.",
      "Capacité à proposer des idées pertinentes selon le secteur et les objectifs du client.",
      "Bonne connaissance du tracking et des outils d’analyse.",
      "Capacité à rédiger des briefs et à coordonner des créatifs.",
    ],
    profile: [
      "Expérience concrète en agence marketing, en agence digitale ou sur plusieurs comptes clients.",
      "Profil autonome, organisé, analytique et orienté résultats.",
      "Excellent niveau de français et d’anglais, à l’oral comme à l’écrit.",
    ],
    specificQuestion:
      "Présentez une campagne que vous avez personnellement pilotée : canal, objectif, budget, durée, résultats obtenus et optimisations réalisées.",
    specificQuestions: [
      "Présentez une campagne que vous avez personnellement pilotée : canal, objectif, budget, durée, résultats obtenus et optimisations réalisées.",
      "Quelle est votre expérience opérationnelle sur Google Ads, Meta Ads et TikTok Ads ? Précisez les campagnes gérées et les budgets sur chaque plateforme.",
      "Partagez un exemple de calendrier éditorial ou de brief créatif que vous avez réalisé (lien accessible ou extrait dans votre réponse). Précisez le contexte, les formats et votre rôle dans la coordination des créatifs. Les exemples peuvent être anonymisés.",
      "Comment mettez-vous en place et vérifiez-vous le suivi des conversions ? Quels outils et indicateurs utilisez-vous pour analyser les résultats et améliorer les landing pages ?",
      "Comment organisez-vous plusieurs comptes clients en parallèle : priorités, plannings, validations et reportings ? Donnez un exemple d’utilisation de l’IA ou de l’automatisation dans votre travail.",
      "Quel est votre niveau de français et d’anglais, à l’oral et à l’écrit ? Précisez votre expérience des échanges et reportings clients dans ces deux langues.",
    ],
  },
  "motion-designer": {
    slug: "motion-designer",
    title: "Motion Designer",
    summary:
      "Créer des contenus animés professionnels pour des supports digitaux, commerciaux et institutionnels.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "La structure de cette page reprendra exactement le même design que les autres offres.",
    ],
    missions: [
      "Produire des animations, vidéos courtes et assets motion.",
      "Adapter les créations aux formats web, social media et présentation.",
      "Travailler à partir d’une charte graphique existante.",
      "Préparer des livrables propres, exploitables et faciles à décliner.",
    ],
    skills: [
      "Maîtrise d’After Effects ou d’outils motion équivalents.",
      "Sens du rythme, du cadrage, de la composition et de la typographie.",
      "Capacité à décliner une identité visuelle en animation.",
      "Connaissance des formats digitaux et contraintes d’export.",
    ],
    profile: [
      "Portfolio solide avec réalisations récentes.",
      "Créativité structurée, autonomie et respect des délais.",
      "Bonne compréhension des besoins marketing et communication.",
    ],
    specificQuestion: "Ajoutez le lien vers votre portfolio ou vos trois meilleures réalisations.",
  },
  "digital-account-manager": {
    slug: "digital-account-manager",
    title: "Digital Account Manager",
    summary:
      "Piloter des projets digitaux et assurer une relation client claire, structurée et orientée livraison.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "La structure de cette page reprendra exactement le même design que les autres offres.",
    ],
    missions: [
      "Recueillir les besoins clients et cadrer les projets digitaux.",
      "Coordonner les équipes internes et les parties prenantes.",
      "Suivre les plannings, livrables, risques et priorités.",
      "Garantir une communication client régulière et professionnelle.",
    ],
    skills: [
      "Gestion de projet digital et relation client.",
      "Bonne compréhension des sites web, campagnes et outils digitaux.",
      "Capacité à formaliser les besoins et suivre les livrables.",
      "Organisation, clarté de communication et sens du service.",
    ],
    profile: [
      "Expérience en agence, ESN, cabinet digital ou environnement projet.",
      "Profil fiable, structuré et à l’aise avec plusieurs interlocuteurs.",
      "Capacité à piloter un projet de bout en bout.",
    ],
    specificQuestion: "Décrivez brièvement un projet digital que vous avez piloté de A à Z.",
  },
  "full-stack-developer": {
    slug: "full-stack-developer",
    title: "Full-Stack Developer",
    summary:
      "Concevoir, développer et maintenir des applications web robustes, côté front-end et back-end.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "La structure de cette page reprendra exactement le même design que les autres offres.",
    ],
    missions: [
      "Développer des fonctionnalités front-end et back-end.",
      "Contribuer à l’architecture technique et à la qualité du code.",
      "Intégrer APIs, bases de données et services tiers.",
      "Tester, corriger et maintenir les applications en production.",
    ],
    skills: [
      "Solides bases JavaScript/TypeScript et framework web moderne.",
      "Expérience back-end, APIs, bases de données et authentification.",
      "Compréhension des bonnes pratiques de sécurité et performance.",
      "Capacité à livrer du code propre, testé et maintenable.",
    ],
    profile: [
      "Expérience significative sur des applications en production.",
      "Autonomie technique, curiosité et sens du produit.",
      "Capacité à collaborer avec des profils métier et design.",
    ],
    specificQuestion: "Quel projet en production représente le mieux votre niveau technique ?",
  },
  "data-analyst-data-scientist": {
    slug: "data-analyst-data-scientist",
    title: "Data Analyst / Data Scientist",
    summary:
      "Transformer des données en analyses, dashboards et modèles exploitables pour orienter les décisions.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "La structure de cette page reprendra exactement le même design que les autres offres.",
    ],
    missions: [
      "Collecter, nettoyer et structurer les données utiles.",
      "Créer des analyses, dashboards et indicateurs de suivi.",
      "Identifier tendances, anomalies et opportunités business.",
      "Présenter les résultats de manière claire aux équipes concernées.",
    ],
    skills: [
      "SQL, Python ou outils d’analyse data.",
      "Maîtrise d’un outil BI ou de datavisualisation.",
      "Compréhension des statistiques, modèles ou analyses prédictives.",
      "Capacité à vulgariser les résultats et recommandations.",
    ],
    profile: [
      "Expérience sur des projets data concrets.",
      "Rigueur, esprit analytique et sens business.",
      "Capacité à passer de la donnée brute à une décision exploitable.",
    ],
    specificQuestion: "Partagez un dashboard, une analyse ou un projet Data représentatif.",
  },
  "forward-deployed-engineer": {
    slug: "forward-deployed-engineer",
    title: "Forward Deployed Engineer",
    summary:
      "Concevoir et déployer des solutions techniques, notamment IA, au plus près des besoins métiers et clients.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "La structure de cette page reprendra exactement le même design que les autres offres.",
    ],
    missions: [
      "Comprendre les problèmes métier et proposer des solutions techniques adaptées.",
      "Prototyper, intégrer et déployer des solutions IA ou logicielles.",
      "Travailler directement avec les clients ou équipes opérationnelles.",
      "Transformer les retours terrain en améliorations produit concrètes.",
    ],
    skills: [
      "Solides bases en développement logiciel et intégration d’APIs.",
      "Compréhension des usages IA, automatisation ou data.",
      "Capacité à prototyper rapidement puis industrialiser proprement.",
      "Communication claire avec des profils techniques et non techniques.",
    ],
    profile: [
      "Profil hybride, technique, terrain et orienté résolution de problèmes.",
      "Autonomie forte et capacité à gérer l’incertitude.",
      "Expérience sur des solutions déployées auprès d’utilisateurs réels.",
    ],
    specificQuestion: "Présentez une solution IA concrète que vous avez conçue et déployée.",
  },
};
