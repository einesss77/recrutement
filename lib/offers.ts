export type Offer = {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  missions: string[];
  skills: string[];
  profile: string[];
  specificQuestion: string;
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
    specificQuestion: "Combien de consultants IT avez-vous déjà placés et sur quels marchés ?",
  },
  "growth-manager": {
    slug: "growth-manager",
    title: "Growth Manager",
    summary:
      "Concevoir, tester et optimiser des campagnes d’acquisition orientées performance pour soutenir la croissance commerciale.",
    description: [
      "Texte complet de l’annonce à intégrer ici dès réception de votre version finale.",
      "La structure de cette page reprendra exactement le même design que les autres offres.",
    ],
    missions: [
      "Définir les priorités d’acquisition et les canaux à tester.",
      "Construire, lancer et analyser les campagnes de growth marketing.",
      "Suivre les coûts, les conversions et les résultats par canal.",
      "Documenter les apprentissages et améliorer les campagnes en continu.",
    ],
    skills: [
      "Maîtrise des campagnes paid, SEO, outbound ou marketing automation.",
      "Lecture analytique des métriques d’acquisition et de conversion.",
      "Capacité à prioriser les tests selon l’impact business.",
      "Aisance avec les outils analytics, CRM et reporting.",
    ],
    profile: [
      "Expérience concrète sur des campagnes orientées performance.",
      "Autonomie, rigueur analytique et culture du résultat.",
      "Capacité à travailler avec des équipes commerciales et digitales.",
    ],
    specificQuestion:
      "Présentez brièvement votre campagne la plus performante : budget, canal et résultat.",
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
