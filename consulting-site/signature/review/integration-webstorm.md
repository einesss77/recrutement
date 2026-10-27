# Intégration dans le dépôt WebStorm — 26 octobre 2026

Le dépôt cible est C:/Users/eines/recrutement, origin einesss77/recrutement.
Inspection avant copie : application Next.js de recrutement, ancienne vitrine dans docs/ avec modifications locales, configuration Vercel et domaine géré chez Hostinger selon DEPLOYMENT.md. Aucun fichier FTP/SFTP Hostinger trouvé dans ce dépôt.

Les sources OneDrive ont été ajoutées dans consulting-site/signature/, dossier absent avant intégration. Comparaison SHA-256 après copie : aucune différence. .local, dist, node_modules et les métadonnées Git n’ont pas été copiés.

Adaptations : scripts/prepare-home.mjs génère uniquement la version publique Signature, réécrit ses chemins de ressources vers /consulting/assets/ et remplace uniquement le dossier généré public/consulting/. next.config.ts expose les 11 routes B&M sans toucher aux routes du recrutement. npm run check contrôle le site et les ressources intégrées. .local/ est ignoré à tous les niveaux.

Conservés : docs/ et ses modifications locales, ancien consulting-site/index.html, Git et origin, .idea, vercel.json, secrets et configuration de recrutement. L’admin B&M commencé reste dans les sources pour la suite mais son API PHP, ses pages et ses styles sont exclus du build. L’admin recrutement reste disponible à /admin.

Validation : npm run build puis npm run check réussis ; 12 pages, 488 liens et ressources. Chrome via Next.js de production local à 4337 : 11 routes à 390 et 1440 px, aucun débordement horizontal ni erreur JavaScript ; menu mobile/Échap, carrousel et fiche mobile, démonstration métier, contact prérempli et validation sans envoi testés. /offres, /business-developer-it et /admin répondent 200. Chemins du CMS B&M exclus inaccessibles. Captures avec mouvement réduit dans output/playwright/bm-integration/.

Intégration locale seulement : aucun commit, push, déploiement ni changement DNS effectué. Le contact reste sans envoi, les exemples fictifs restent signalés et le noindex est conservé.
