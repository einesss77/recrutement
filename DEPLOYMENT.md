# Déploiement

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
