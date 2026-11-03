# Organisation B&M — référence interne

Le plan directeur v2 de novembre 2026 constitue la référence initiale fournie par la direction. Sa version structurée est conservée dans `docs/organisation/plan-directeur-v2.md` et dans `lib/bmOrganizationPlan.ts`, exclusivement côté serveur. Mettre les deux représentations à jour ensemble.

Page : `/admin/organisation`, accessible depuis l’administration des candidatures. Téléchargement authentifié : `/admin/organisation/document`. La recherche filtre les parties du document ; elle ne modifie aucun contenu. Aucun statut ou résultat réel n’est inventé. Aucun workflow, CRM ou commission n’est activé par cette page.

Règles à conserver dans les prochains développements :

- Agency et IT ont des pipelines distincts. Eines conserve la responsabilité finale.
- Soheyl pilote l’exécution commerciale et opérationnelle Agency. Syrine porte la création et un véritable canal réseau. Sabrina pilote le marketing et l’acquisition digitale ; elle ne porte pas seule toute l’acquisition.
- Manar assure le montage / motion. Lorry est prestataire externe de closing. Mohamed intervient en développement commercial IT dès janvier 2027.
- Prix, budgets, commissions, outils et responsabilités proposés ne sont pas tous validés.
- Respecter les noms, les données manquantes et les hypothèses ; distinguer objectifs et réalisations.
- Analyser l’existant avant de modifier les systèmes ; favoriser outils modulaires, automatisation et coûts maîtrisés.

L’authentification utilise `isAdminAuthenticated`, comme les autres pages administrateur ; l’absence de session redirige vers `/admin`. Le téléchargement renvoie 401 sans session, avec `no-store`. Les informations salariales ne sont pas copiées dans `public` ni dans le site statique Consulting. La protection `X-Robots-Tag` existante couvre déjà `/admin/:path*`.

Les décisions de réunion restent à renseigner avec responsable, échéance, livrable et indicateur. Cette première intégration fournit une référence consultable, sans prétendre enregistrer des décisions collectives ou des résultats commerciaux.

## Synthèse visuelle v2.1

La vue d’ensemble est la page d’entrée. Le document complet reste sous ?vue=document et conserve sa recherche. /admin/organisation/presentation propose 14 slides avec navigation clavier, plein écran et versions PDF / HTML autonomes. Les exports n’incluent pas les rémunérations individuelles et restent des supports internes ; ils sont téléchargeables uniquement après authentification. Après téléchargement, ils peuvent être partagés hors de l’admin.

Les packs sont repris du catalogue du 31 octobre : Digital Start dès 590 €/mois, Digital Growth dès 890 €/mois, Digital 360 dès 1 290 €/mois. Les volumes ne s’additionnent pas ; exclusions et périmètres restent ceux du catalogue. Les anciennes fourchettes du plan ont été remplacées.

Sources visuelles : lib/bmStrategyVisual.ts ; styles et polices Manrope embarquées dans lib/bmStrategyStyles.ts. Exports versionnés dans ce dossier et inclus explicitement dans le traçage Next.js. Toute modification des slides doit régénérer le HTML et le PDF depuis le même rendu, avec contrôle des 14 pages. Les contrôles du projet restent dans scripts/check-organisation.mjs.
