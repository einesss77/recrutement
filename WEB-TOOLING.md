# Outils pour le site Consulting V3

La home B&M est maintenue dans `docs/`. Vercel la sert à `/` dans le même
projet Next.js que `/offres`, les candidatures et `/admin`. Le script
`scripts/prepare-home.mjs` prépare ses fichiers avant le développement et le build.
GitHub Pages reste une publication statique séparée de `docs/` depuis `main`.

## Bibliothèques installées

- `motion` : animations HTML/SVG et interactions.
- `lucide` : icônes SVG utilisables en JavaScript classique.
- `zod` : validation des données côté client ou serveur.
- `esbuild` (développement) : compilation des modules destinés au site statique.
- `@playwright/test` (développement) : tests navigateur.
- `@axe-core/playwright` (développement) : contrôles automatisés d'accessibilité.

Ces dépendances sont installées et verrouillées dans `package-lock.json`.
Elles ne sont pas encore chargées dans le HTML publié : leur installation ne
modifie pas l'apparence du site et n'active pas le formulaire de contact.
Les futurs modules npm du site devront être compilés vers des fichiers statiques
dans `docs/` avant publication. GitHub Pages ne fournit pas de serveur applicatif.

## Skills ajoutés le 17 octobre 2026

Installés dans l'environnement Codex de l'utilisateur, hors du dépôt :

- OpenAI : `playwright`, `security-best-practices`, `security-threat-model`,
  `vercel-deploy`, `gh-fix-ci`.
- Vercel : `web-design-guidelines`, `vercel-react-best-practices`,
  `vercel-composition-patterns`.
- wshobson/agents : `api-design-principles`, `architecture-patterns`,
  `nodejs-backend-patterns`, `accessibility-compliance`, `responsive-design`,
  `interaction-design`, `design-system-patterns`.

Les skills déjà disponibles incluent `frontend-design`, `ui-ux-pro-max`,
`ux-writing`, `e2e-testing-patterns`, `supabase` et
`supabase-postgres-best-practices`.

Sources : https://github.com/openai/skills,
https://github.com/vercel-labs/agent-skills,
https://github.com/wshobson/agents.
