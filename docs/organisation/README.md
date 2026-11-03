# Organisation B&M — référence interne

Le plan directeur v2 de novembre 2026 constitue la référence initiale fournie par la direction. Sa version structurée est conservée dans `docs/organisation/plan-directeur-v2.md` et dans `lib/bmOrganizationPlan.ts`, exclusivement côté serveur. Mettre les deux représentations à jour ensemble.

Page : `/admin/organisation`, accessible depuis l’administration des candidatures. Téléchargement authentifié : `/admin/organisation/document`. La recherche filtre les parties du document ; elle ne modifie aucun contenu. Aucun statut ou résultat réel n’est inventé. Aucun workflow, CRM ou commission n’est activé par cette page.

Règles à conserver dans les prochains développements :

- Agency et IT ont des pipelines distincts. Le fondateur conserve la responsabilité finale.
- Soheyl pilote l’exécution commerciale et opérationnelle Agency. Syrine porte la création et un véritable canal réseau. Sabrina pilote le marketing et l’acquisition digitale ; elle ne porte pas seule toute l’acquisition.
- Manar assure le montage / motion. Lorry est prestataire externe de closing. Mohamed intervient en développement commercial IT dès janvier 2027.
- Prix, budgets, commissions, outils et responsabilités proposés ne sont pas tous validés.
- Respecter les noms, les données manquantes et les hypothèses ; distinguer objectifs et réalisations.
- Analyser l’existant avant de modifier les systèmes ; favoriser outils modulaires, automatisation et coûts maîtrisés.

L’authentification utilise `isAdminAuthenticated`, comme les autres pages administrateur ; l’absence de session redirige vers `/admin`. Le téléchargement renvoie 401 sans session, avec `no-store`. Les informations salariales ne sont pas copiées dans `public` ni dans le site statique Consulting. La protection `X-Robots-Tag` existante couvre déjà `/admin/:path*`.

Les décisions de réunion restent à renseigner avec responsable, échéance, livrable et indicateur. Cette première intégration fournit une référence consultable, sans prétendre enregistrer des décisions collectives ou des résultats commerciaux.
