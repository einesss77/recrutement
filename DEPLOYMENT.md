# Déploiement

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
sans l’envoyer et l’indexation reste désactivée.

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
