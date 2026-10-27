# B&M — Signature

Nouvelle proposition indépendante du site existant. HTML rendu au build, CSS et JavaScript natif ; aucune dépendance à installer.

## Démarrer

Node.js 20 ou plus récent :

```sh
npm run dev
```

Ouvrir http://127.0.0.1:4348/ (serveur PHP ; configurer PHP_BINARY si nécessaire). Le serveur écoute uniquement sur ce PC. `npm run build` génère `dist/` ; `npm run check` vérifie les routes, les liens, les ressources locales et les titres.

## Structure

- `src/site.mjs` : contenus, pages et composants partagés.
- `src/home.mjs`, `src/home-editorial.mjs` : accueil synthétique : présentation illustrée, expertises interactives, formats solo/squad, schéma du référent et exploration de solutions.
- `src/talent-studio.mjs` : catalogue commun des cinq profils et studio interactif de cartes d'expertise, utilisé sur l'accueil et la page Profils & squads.
- `src/collaboration.mjs` : présentation factuelle et trois usages illustrés.
- `src/mission-support.mjs`, `public/assets/mission-support.css` : consultant solo, squad, responsabilités et accompagnement par un référent projet, de l’intégration à la fin de mission.
- `src/visual-scenes.mjs` : les trois interfaces illustratives de la carte Solutions.
- `src/delivery-method.mjs`, `public/assets/delivery-method.css` : méthode des projets sur mesure sur fond blanc, six étapes communes à l’accueil et à la page Solutions.
- `src/squad-scene.mjs`, `public/assets/finishing.css` : composition graphique de la squad, contribution de chaque expertise et suivi par le référent.
- `public/assets/palette.css` : palette commune bleu nuit, blanc, vert d’eau et bleu doux.
- `public/assets/home-editorial.css` : compositions visuelles et responsive de l’accueil.
- `public/assets/bm-collective.png` : nature morte éditoriale générée pour le projet ; prompt et provenance dans `review/visuel-accueil.md`.
- `public/assets/site.css` : direction Signature et responsive.
- `public/assets/studio.css` : cartes d'expertise, scènes produit, transitions et adaptation mobile.
- `public/assets/collaboration.css` : identité, usages et parcours, adaptés au mobile.
- `public/assets/site.js` : menus, accordéons natifs, sélecteur profil/squad, démonstration métier et formulaire de préparation.
- `public/assets/fonts.css`, `fonts/` et `licenses/` : Bricolage Grotesque, Instrument Serif et Manrope hébergées localement, licences incluses.
- `scripts/` : génération, serveur local et vérification.

## Avant une publication

En local et en preview, le site reste en noindex. En production, l’indexation, les canonicals, les langues et les sitemaps sont gérés par `src/seo.mjs`. Configurer `BM_SITE_URL` et `BM_INDEXING` avant le build ; voir `../../DEPLOYMENT.md`. Les démonstrations, les aperçus et l’administration restent exclus de l’indexation.

Le formulaire permet de préparer et valider un message mais ne l'envoie pas. Aucune donnée saisie n'est transmise ou stockée durablement. Activer une vraie réception persistante, avec validation serveur et protection anti-abus, avant de proposer un envoi commercial.

Confirmer l'entité éditrice, le contact, l'hébergement et la politique de traitement des demandes. Les pages d'information signalent actuellement leur statut de préproduction.

Aucun cas client, témoignage, effectif, implantation, résultat ou portrait fictif n'est publié. La démonstration métier est explicitement fictive et reste locale au navigateur sur la page Solutions. Les usages de l’accueil sont des exemples, pas des réalisations clients.

À compléter avec les informations réelles : fondateurs et interlocuteurs, organisation de l’équipe ou du réseau, implantation et modalités d’intervention, références autorisées, coordonnées de réception. Le suivi par un référent projet tout au long de la mission est confirmé par le porteur du site. La fréquence des points, les modalités d’intervention et les engagements précis sont définis dans la proposition.

## Vérification visuelle locale

Le serveur de développement expose `/_preview?width=390` pour examiner la page à une largeur donnée dans un cadre. Largeurs autorisées : 320, 360, 390, 768, 1024 et 1440. Ajouter `&page=/contact/` ou une autre page principale pour vérifier son adaptation. Ce cadre ne fait pas partie du build de production.

Le bloc photo autonome du sur mesure a été retiré : son message figure dans la méthode sur fond blanc. La photographie a également été retirée de la squad, au profit d’une composition graphique des expertises. L’image abstraite de présentation est conservée.

- `public/assets/motion-design.js`, `public/assets/motion-design.css` : navigation compacte, apparitions décalées, parallaxe bornée, figurines et interactions ; pause et mouvement réduit. Validation responsive dans `review/validation-motion.md`.

- `src/portfolio.mjs`, `src/project-data.mjs`, `public/assets/portfolio.css` et `portfolio.js` : page Nos réalisations, carrousel partagé et deux modèles web/mobile. Les entrées actuelles sont des démonstrations signalées. L’administration et la publication dynamique restent à connecter.

## Intégration au dépôt WebStorm

Depuis la racine du dépôt : `npm run dev` sert Next.js sur le port 3000,
`npm run cms` démarre séparément le CMS PHP, et `npm run build` vérifie
la compilation de production complète. `npm run check` contrôle les pages générées
FR/EN et les liens. Consulter `../../DEPLOYMENT.md` pour les runtimes de production.

Sources des services : `src/services.mjs` et `src/service-depth.mjs`.
Traductions : `src/locales/en.json` ; génération EN dans `scripts/build.mjs`.
Les codes, configurations privées et contenus CMS locaux restent dans `.local/`, ignoré par Git.
