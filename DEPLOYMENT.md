# Déploiement

## Studio social privé

`/studio-social` ouvre le studio B&M, protégé par la session administrateur existante (`ADMIN_PASSWORD`). Les routes HTML, ressources et API vérifient l'authentification. Les écritures vérifient l'origine. Le studio est en `noindex` et absent du sitemap.

Les vingt brouillons et la stratégie initiale sont dans `studio-social/content/`. Les ressources sont sous `studio-social/assets/`, servies par une route authentifiée et incluses explicitement dans le traçage Vercel. `scripts/prepare-social.mjs` prépare les exports PNG/PDF/ZIP dans le navigateur ; aucun Chromium serveur nécessaire.

Le lot `practical-pack.json` ajoute huit exemples IA illustratifs (chatbot, extraction de document, automatisation), avec deux pages chacun. Il est intégré une seule fois grâce à `appliedPacks`, enregistré dans le document partagé ou IndexedDB. Les identifiants existants et les modifications utilisateur sont conservés ; supprimer un exemple après intégration ne le fait pas réapparaître. Le générateur éditorial de ce lot est `scripts/create-social-practical-pack.mjs`, sans appel IA. Les trois champs du visuel sont éditables dans « Conversation », « Document » ou « Flux ». Contrôle dédié : `SOCIAL_TEST_BROWSER=webkit node scripts/test-social-practical.mjs` (serveur local port 3007 par défaut).

`companion-pack.json` ajoute deux carrousels avec personnages : conseiller illustré et chat assistant. Les illustrations originales sont vectorielles et réutilisables (`studio-social/assets/characters.js`), sans service ni génération d'image payante. Les compositions `advisor` et `cat` acceptent une image importée en remplacement du personnage. Le contrôle des lots inclut ces deux modèles et vérifie leurs deux pages aux deux formats, la conservation des modifications et des suppressions.

### Vidéos motion design

Le bouton « Vidéo · 15 s » est disponible sur les modèles chat, conseiller et chatbot. Le dialogue propose deux styles : personnage en conversation et typographie animée inspirée de la référence vidéo fournie. Le premier reprend les textes du post ; le second utilise pour cette version un script fixe et une voix de démonstration locale facultative.

L'aperçu et l'export personnalisé utilisent le même moteur Canvas. Le navigateur enregistre le canvas via MediaRecorder, en MP4 quand il est supporté, sinon en WebM ; l'export dure environ 15 s et nécessite de garder l'onglet visible. Un passage en arrière-plan annule le rendu plutôt que livrer une vidéo incomplète. Les deux MP4 de démonstration sont téléchargeables même quand l'encodage personnalisé est indisponible. Les médias restent authentifiés et acceptent les requêtes Range pour les lecteurs mobiles.

Sources HyperFrames : `studio-social/motion-project/` et `studio-social/motion-kinetic/`. Préparer leurs ressources avec `npm run motion:prepare`. `npm run motion:render` vérifie puis régénère les deux MP4 localement ; FFmpeg et FFprobe sont nécessaires dans PATH, via `HYPERFRAMES_FFMPEG_PATH` / `HYPERFRAMES_FFPROBE_PATH`, ou dans `.local/motion-bin/`. Les binaires ne sont pas ajoutés aux dépendances de déploiement Vercel. Les deux petits MP4 et le WAV sont versionnés avec le studio.

La voix fournie est générée par Windows Speech via `create-local-voice.ps1`, pas par une API. Elle illustre le script fixe, et n'est pas une voix naturelle enregistrée. Le studio ne fournit pas de génération de voix libre à partir de n'importe quel texte. Le modèle typographique accepte la voix fixe ou un export muet ; le personnage est muet. Aucun coût de génération d'image, de voix ou de texte n'est requis pour ces exports. La création et les modifications du code via Codex restent consommatrices de tokens.

Vérification du studio : `node scripts/test-social-motion.mjs` (serveur local 3010), puis `SOCIAL_TEST_BROWSER=webkit node scripts/test-social-motion.mjs`. Vérifie aperçus, différences entre instants, fermeture, accès aux médias et Range. Les exports personnalisés sont effectivement encodés et téléchargés dans le test Chromium ; le test WebKit porte sur l'aperçu et les médias de démonstration. Contrôler ensuite les fichiers par FFprobe.

Le troisième style « Texte + laptop + iPhone » est conservé dans `studio-social/motion-mockups/` et disponible dans le même sélecteur. Il utilise deux interfaces illustratives existantes (`mockup-web.svg`, `mockup-mobile.svg`), un laptop de face, un iPhone entier, un zoom dans l'écran et une composition réunissant les deux appareils. Deux imports PNG/JPEG/WebP (3 Mo maximum) permettent de remplacer les écrans pour l'export courant, sans envoyer ces captures au serveur. Le script de démonstration et la voix locale sont fixes dans cette version. Fichiers : `mockups-demo.mp4` et `mockups-voice.wav`. Les exports et aperçus de ce seul modèle peuvent être vérifiés avec `SOCIAL_TEST_STYLE=mockups` ; le contrôle WebKit vérifie aussi les deux imports. `motion:prepare`, `motion:check` et `motion:render` incluent les trois modèles.

Sauvegarde partagée : le studio utilise d'abord le Blob Store privé existant si son jeton est configuré, sinon Postgres via `DATABASE_URL`. Postgres initialise une table indépendante `SocialStudioDocument` sans modifier les tables de recrutement. Les écritures utilisent une version / ETag pour refuser les écrasements concurrents.

Si le stockage serveur est absent ou indisponible, la consultation et l'édition restent utilisables avec sauvegarde IndexedDB sur l'appareil. Le bandeau indique alors « Sauvegarde sur cet appareil ». Dans ce mode, le JSON permet le transfert entre appareils, et la rédaction IA reste désactivée.

Rédaction facultative : définir `GEMINI_API_KEY` et, au besoin, `AI_MONTHLY_BUDGET_USD` (défaut 2 dollars) dans Vercel. Les appels réservent 0,02 dollar chacun avant la requête ; ce compteur prudent n'est pas un relevé de facture ni une limite globale de la clé. Aucun appel automatique à l'ouverture ou aux exports. Aucune publication sur les réseaux.

Contrôle : `node scripts/test-social.mjs` avec le serveur de build local sur le port 3006. Vérifie connexion, refus des accès anonymes et origines externes, affichage mobile et exports navigateur. Quand le stockage partagé est disponible, vérifie aussi la sauvegarde entre sessions et le refus des versions obsolètes. Le contrôle ne dépense aucun crédit API.

## Site B&M et recrutement sur le même domaine

Le projet Vercel utilise Next.js. `/` sert le site B&M Signature de `consulting-site/signature/`, `/offres`
liste les postes, `/<slug>` affiche chaque offre et `/admin` ouvre l'administration
protégée par mot de passe. Les candidatures et les CV utilisent les services
configurés ci-dessous.

`npm run dev` et `npm run build` génèrent les pages publiques Signature dans
`public/consulting/` via `scripts/prepare-home.mjs`. Ce dossier généré est ignoré
par Git ; modifier les sources dans `consulting-site/signature/src/` et ses ressources
dans `consulting-site/signature/public/assets/`. `docs/` conserve la version précédente
et ses modifications locales. Les réécritures de `next.config.ts` exposent les pages
Signature à la racine sans modifier `/offres`, les offres individuelles ni l’admin recrutement.

Validation : `npm run build` puis `npm run check`. Le contrôle couvre également les
ressources après intégration, en français et en anglais. Les pages publiques et l’interface
de gestion B&M sont générées ; les fichiers PHP et les données privées sont exclus de
`public/consulting/`. `.local/` est ignoré à tous les niveaux et ne doit jamais être publié.
Les exemples sont explicitement fictifs, le formulaire de contact prépare un message
sans l’envoyer. L’indexation est pilotée par l’environnement : voir la section SEO.

### CMS des réalisations et version anglaise

- Les pages anglaises sont générées sous `/en/`. Le catalogue de traductions se trouve
  dans `consulting-site/signature/src/locales/en.json`. Les nouveaux contenus éditoriaux
  doivent recevoir leur traduction ; aucun service de traduction externe n’est utilisé.
- En local : `npm run cms:setup` initialise un code privé, puis `npm run cms` démarre
  le serveur PHP sur le port 4348. Configurer `PHP_BINARY` si nécessaire.
- Next.js sert les pages publiques et relaie le CMS via `BM_CMS_ORIGIN`
  (valeur locale par défaut : `http://127.0.0.1:4348`).
- En production Next.js, définir `BM_CMS_ORIGIN` vers un hébergement PHP joignable
  pour les réalisations publiées et leur gestion. Un déploiement Next.js seul
  n’exécute pas le CMS PHP. Les données et médias privés sont à installer séparément,
  hors de Git, avec un code d’accès propre à la production.
- Pour un hébergement PHP/Apache direct, utiliser `consulting-site/signature/dist/`
  avec son routeur et son `.htaccess`. Cette option concerne le site vitrine et
  le CMS ; les routes de recrutement Next.js nécessitent toujours leur runtime.

`main` est la branche de référence. Le projet Vercel historique suit encore
`master` pour la production : synchroniser sans forcer avec
`git push origin main:master` après publication et validation de `main`.

Stack recommandée pour la mise en ligne :

- Vercel pour l’application Next.js.
- Postgres managé pour `DATABASE_URL`.
- Vercel Blob privé pour les CV.
- Resend pour les notifications e-mail.
- DNS Hostinger pointé vers le projet Vercel.

## Variables d’environnement

À configurer dans Vercel, environnement Production :

```env
ADMIN_PASSWORD=
DATABASE_URL=
SITE_URL=https://votre-domaine
EMAIL_FROM=
EMAIL_TO=recrutement@bandmdigitalconsulting.com
RESEND_API_KEY=
```

Pour les CV, créer un Blob Store privé dans Vercel et le connecter au projet. Vercel ajoute automatiquement les variables nécessaires au runtime. Pour travailler hors Vercel, ajouter aussi `BLOB_READ_WRITE_TOKEN`.

## Première mise en ligne

1. Pousser le projet sur GitHub.
2. Importer le dépôt dans Vercel.
3. Ajouter les variables d’environnement.
4. Créer/connecter la base Postgres.
5. Créer/connecter le Blob Store privé.
6. Lancer le premier déploiement.
7. Appliquer le schéma Prisma :

```bash
npm run db:deploy
```

Depuis Vercel, cette commande peut être lancée via la CLI après connexion :

```bash
vercel env pull
npm run db:deploy
vercel --prod
```

## Domaine Hostinger

Ajouter le domaine dans Vercel depuis Project Settings > Domains. Vercel indiquera ensuite les enregistrements DNS exacts à mettre chez Hostinger :

- domaine racine : record `A`
- sous-domaine `www` : record `CNAME`

Ne pas changer les nameservers sans recopier les records e-mail existants.

## SEO et indexation FR/EN

Le domaine canonique par défaut est `https://www.bandmdigitalconsulting.com`,
repris du catalogue B&M. Pour un autre domaine, définir `BM_SITE_URL` (origine HTTPS,
sans sous-chemin). `SITE_URL` sert de repli si `BM_SITE_URL` n’est pas défini.

En production, configurer avant le build :

```env
BM_SITE_URL=https://www.bandmdigitalconsulting.com
BM_INDEXING=true
```

Sur Vercel Production, l’indexation est activée automatiquement si `BM_INDEXING`
n’est pas explicitement à `false`. Les previews Vercel sont toujours non indexables.
En local, l’indexation est désactivée par défaut. Refaire le build après un changement
de domaine ou de politique d’indexation. Le build PHP/Apache utilise les mêmes règles.

- `/sitemap.xml` référence `/sitemap-pages.xml` (22 URL commerciales FR/EN)
  et `/sitemap-projects.xml` (réalisations réellement publiées via le CMS).
- Admin, aperçus, erreurs, pages légales provisoires et réalisations fictives restent
  en `noindex` et hors sitemap. Les pages privées conservent leur authentification.
- Les réalisations publiées et non marquées test reçoivent leurs propres titres,
  descriptions, canonicals et contenu initial côté PHP. Une variante anglaise n’est
  indexable que si `translations.en` contient au moins summary, need et response ;
  la traduction de nouveaux cas nécessite donc un travail éditorial.
- Les canonicals et les liens hreflang utilisent des URL sans slash final, cohérentes
  avec la normalisation Next.js, sauf la racine.
- Sur Next.js, configurer `BM_CMS_ORIGIN` pour que le sitemap éditorial reflète les
  réalisations publiées. Si le CMS est indisponible, ce sitemap reste vide ; le sitemap
  des pages commerciales reste disponible.

Contrôles : `npm run check`, `npm run check:seo`, `npm run build`.
Après publication, déclarer la propriété dans Google Search Console et soumettre
`https://www.bandmdigitalconsulting.com/sitemap.xml`. Aucun compte Search Console,
soumission externe ou déploiement n’a été effectué par ce travail local.

Voir [SEO.md](SEO.md) pour l’audit et les validations.
