# Outils pour le site Consulting V3

## Préparation frontend du 25 octobre 2026

Périmètre : environnement uniquement. Aucun HTML, CSS, composant, routage,
contenu public ou déploiement modifié. Aucune dépendance applicative ajoutée.

### Socle constaté

- Source de la vitrine : `docs/index.html`, `docs/styles.css`,
  `docs/interactions.js`, polices locales Noto Sans Display et Noto Serif Display.
- `consulting-site/index.html` est un ancien prototype V2, pas la source à éditer.
- Next.js **16.3.8**, React/React DOM **19.3.0**, TypeScript **6.0.3**.
  La réécriture `/` sert le HTML préparé dans `public/consulting/`.
  Ne pas éditer cette copie générée.
- Recrutement dans `app/` ; composants `OfferChrome` et `ApplicationForm`, CSS
  propre dans `app/globals.css`. Conserver ces fonctionnalités et leurs routes.
- Motion **14.3.0**, Lucide **1.58.0** et Lucide React **1.46.0** déjà présents.
  Playwright **1.64.1**, axe, esbuild et ESLint déjà installés.
- Ni Tailwind ni configuration shadcn (`components.json`) ; pas de migration.
- Aucune consigne `AGENTS.md` trouvée dans le dépôt ni ses répertoires parents.

### Outils retenus

- **Impeccable 4.7.0** : skill officiel installé localement dans
  `.agents/skills/impeccable/`, sans hooks automatiques et sans modification du
  frontend. Chargement du contexte vérifié sur `docs/index.html`.
  Disponible au prochain tour via `$impeccable` ; critique, audit et polish
  s'appliqueront à la section demandée. Les choix du dossier B&M priment sur les
  préférences génériques du skill. Aucun travail de conception lancé ici.
- **Context7 MCP** : `.codex/config.toml` pointe vers
  `https://mcp.context7.com/mcp`. Initialisation, liste des outils et résolution
  Next.js testées sans clé. Recharger la session pour exposer les outils MCP
  natifs ; le test HTTP ne prouve pas leur chargement dans cette session.
  Utiliser les versions réellement installées, puis vérifier les versions
  proposées par `resolve-library-id` avant `query-docs`. Au contrôle du jour,
  `/vercel/next.js` liste jusqu'à **v16.2.9**, pas **16.3.8** : consulter les
  sources officielles de la version exacte si nécessaire, sans substituer
  silencieusement une autre version et sans changer les dépendances.
  Aucun identifiant ni secret ajouté. Une clé ou authentification pourra devenir
  nécessaire selon les quotas ; aucun accès manquant observé pendant ce test.
- **Navigateur** : Playwright CLI officiel fonctionne avec Chrome installé,
  en complément des dépendances Playwright et axe existantes. Pas de second
  serveur MCP navigateur ajouté. Le contrôle navigateur intégré à cette session
  ne voit actuellement aucun navigateur ; Playwright est la voie vérifiée.
- **shadcn MCP / Magic UI MCP** : examinés, non ajoutés. Compatibles avec un
  écosystème React, mais aucun composant prévu ne justifie de les introduire
  dans la vitrine HTML/CSS/JS ni d'ajouter leurs prérequis. Réexaminer seulement
  sur un besoin concret, sans remplacer les composants existants.
- Skills existants utiles : `frontend-design`, `ui-ux-pro-max`, `ux-writing`,
  `responsive-design`, `accessibility-compliance`, `interaction-design`,
  `web-design-guidelines`, `playwright`, `e2e-testing-patterns` et les skills React.
  Aucun doublon installé ; aucun ajout Figma, Storybook ou bibliothèque UI.

### Contrôle navigateur reproductible

Pour la vitrine seule, sans lancer les services de recrutement :

```powershell
python -m http.server 4177 --bind 127.0.0.1 --directory docs
# Dans un autre terminal :
npx --yes --package @playwright/cli playwright-cli -s=bm-setup open http://127.0.0.1:4177 --browser chrome
npx --yes --package @playwright/cli playwright-cli -s=bm-setup resize 1440 1000
npx --yes --package @playwright/cli playwright-cli -s=bm-setup snapshot
npx --yes --package @playwright/cli playwright-cli -s=bm-setup screenshot --filename output/playwright/bm-baseline-desktop.png
npx --yes --package @playwright/cli playwright-cli -s=bm-setup resize 390 844
npx --yes --package @playwright/cli playwright-cli -s=bm-setup screenshot --filename output/playwright/bm-baseline-mobile.png
npx --yes --package @playwright/cli playwright-cli -s=bm-setup close
```

Pour vérifier les routes intégrées, utiliser `npm run dev` (exécute la préparation
existante de la home) ; ne pas employer le serveur statique pour juger les routes
Next.js. Les captures desktop et mobile ci-dessus ont été produites et inspectées.
Le serveur statique signale un favicon absent (404), laissé inchangé à cette étape.
Ce contrôle d'outillage n'est pas une recette complète du site.

### Références lues et décisions à conserver

PDF locaux fournis : `Audit_Kreactive_BM_Digital_Consulting.pdf` (20 pages) et
`BM_Dossier_Conception_Site.pdf` (46 pages). Lecture du texte et inspection des
planches visuelles : références Kreactive, Yield, Be API, charte, hero,
démonstration, étude de cas et mobile. Le dossier normatif ultérieur prime sur
les pistes exploratoires de l'audit ; aucun nouveau benchmark n'est requis.

- Cabinet digital éditorial avec démonstration produit ; deux offres, profils et
  squads / solutions sur mesure. L'IA reste une compétence, le marketing séparé.
- Grandes typographies, italiques courtes ; Manrope et Source Serif 4 Italic
  proposées par le dossier, à installer seulement lors du lot visuel autorisé.
  Ne pas remplacer les polices actuelles pendant la préparation.
- Palette de marque : `#24465C`, `#43ADB5`, `#A58C63`, `#4D6A7E`, `#658CA7`,
  `#C5CCD7`, `#DADADA` ; utilitaires `#FFFFFF`, `#F5F7F8`, `#172F3E`.
- Grille maximale 1248 px ; marges 48/32/20 px ; H1 64/70, 48/54, 38/43.
  Alternance clair et bleu profond ; navigation horizontale ; captures 16:10
  sans perspective illisible. Ces valeurs sont consignées, pas appliquées.
- Révélations facultatives 240 ms / 12 px maximum, reduced motion, pas de scroll
  détourné ni vidéo automatique. Démonstration commandée par l'utilisateur,
  données fictives visibles et validation humaine. Préserver les contrôles natifs.
- Cas et articles pilotés par données lors des futurs lots ; aucun faux client,
  chiffre, portrait ou statut de disponibilité. Masquer les sections sans contenu
  publiable. Ne pas réutiliser les médias des sites de référence.
- Recette future : 360, 390, 768, 1024, 1440, 1920 px, zoom 200 %, clavier,
  contraste, reduced motion et états de formulaire. Aucun score de performance
  ni envoi de contact revendiqué à ce stade.

Éléments non fournis pour les lots ultérieurs : Markdown compagnon annoncé dans
le PDF, logo SVG officiel, médias et cas approuvés, identité éditrice et canal de
contact validés. Ils ne bloquent pas cette préparation. Aucun secret `.env` lu.

Sources outils :
[Impeccable](https://impeccable.style/docs/),
[Context7](https://github.com/upstash/context7),
[configuration MCP Codex](https://developers.openai.com/codex/mcp),
[shadcn MCP](https://ui.shadcn.com/docs/mcp),
[Magic UI MCP](https://magicui.design/docs/mcp).

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
