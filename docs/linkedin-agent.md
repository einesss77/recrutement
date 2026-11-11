# Agent LinkedIn B&M

Le studio pilote la stratégie, les créneaux, les validations et le journal, séparément pour la **page entreprise B&M** et le **profil professionnel personnel**. Un worker sur un ordinateur de confiance utilise la connexion **Codex avec ChatGPT** pour préparer les textes et compose les images avec les mêmes templates que le studio. La publication passe par l’API officielle LinkedIn, côté serveur.

## Ce qui doit être connecté

1. Dans **Studio → Agent LinkedIn**, configurer chaque destination : profil et page, objectif, voix, faits confirmés et sujets exclus. Le profil peut porter un point de vue personnel ; la page explique l’offre et le travail collectif. Les contenus ne sont pas simplement copiés d’un compte à l’autre.
2. Relier une application LinkedIn et autoriser le compte. Les permissions accordées déterminent les capacités réelles de publication et de lecture des performances. Les commentaires, messages privés et modifications automatiques du profil ne sont pas pris en charge par cette version ; les optimisations du profil sont des recommandations.
3. Télécharger le fichier de liaison privée depuis le studio dans le dossier **Téléchargements**, en gardant son nom `bm-linkedin-worker…json`. La tâche Codex exécutant `run --auto-pair-download` l’importera au prochain passage, sans commande à saisir. Elle ne consulte que les fichiers portant ce nom, limités à 10 Ko et liés au studio B&M de production. Si le fichier n’est pas encore présent, elle reste en attente, sans appel réseau ni rédaction.

### Application LinkedIn à préparer une seule fois

Dans le [portail LinkedIn Developer](https://www.linkedin.com/developers/apps), l’application doit disposer des permissions `openid`, `profile`, `w_member_social`, `w_organization_social`, `r_organization_social` et `rw_organization_admin`. Les accès de gestion de page nécessitent l’approbation LinkedIn correspondante ; créer une application ne les accorde pas automatiquement.

Renseigner l’URL de retour `https://www.bandmdigitalconsulting.com/api/studio-agent/callback` dans les paramètres OAuth de l’application, puis saisir le Client ID et le Client Secret uniquement dans **Agent LinkedIn → Connexions & réglages → Renseigner l’application LinkedIn**. Les deux comptes réutilisent cette application, mais possèdent leurs connexions et calendriers propres. Les permissions demandées restent identiques pour les deux connexions afin que LinkedIn n’invalide pas le premier accès en autorisant le second.

Connecter ensuite la page, puis le profil et confirmer l’identité reçue de LinkedIn. Après le premier signal du moteur local, activer le quotidien séparément pour chaque compte. Aucun identifiant, jeton ou mot de passe n’a besoin d’être envoyé dans un chat.

Pour une installation manuelle, importer explicitement le fichier sur l’ordinateur qui exécutera l’agent :

```powershell
Set-Location C:\Users\eines\recrutement
node scripts/linkedin-agent.mjs pair --file C:\chemin\liaison-agent.json
node scripts/linkedin-agent.mjs doctor
```

Le fichier de liaison contient un secret de worker, pas les identifiants LinkedIn ou ChatGPT. Il ne doit pas être partagé ou ajouté à Git. Après import, la copie utilisée par le worker est dans `.local/linkedin-agent/connection.json`, dossier ignoré par Git, protégé au niveau du compte Windows ou par les permissions Unix. Une nouvelle liaison invalide l’ancienne selon le réglage du serveur.

Si vous renouvelez la liaison dans le studio, téléchargez de nouveau son fichier : au prochain passage, un téléchargement B&M plus récent que la liaison locale la remplace automatiquement. Une ancienne copie restée dans Téléchargements ne remplace pas une liaison importée plus récemment.

Une alternative réservée aux environnements dont le mot de passe administrateur local correspond au serveur est `node scripts/linkedin-agent.mjs pair --studio https://www.bandmdigitalconsulting.com`. Le mot de passe est lu dans `.env`, jamais dans un argument de commande. Si la connexion échoue, utiliser le fichier téléchargé dans le studio ; ne pas modifier le mot de passe pour contourner l’échec.

## Connexion ChatGPT et fonctionnement quotidien

`doctor` vérifie la présence de Codex, le mode d’authentification ChatGPT, la liaison et Chromium. Si nécessaire :

```powershell
codex login
npx playwright install chromium
```

Le worker supprime les clés API et les autres secrets de l’environnement transmis à Codex. Il refuse de rédiger si `codex login status` n’indique pas une connexion ChatGPT. Il ne copie jamais le cache d’authentification. L’usage reste soumis aux limites de l’abonnement ; aucun passage automatique vers une API payante n’est prévu.

Le cycle opérationnel est :

```powershell
node scripts/linkedin-agent.mjs run --auto-pair-download
```

Une tâche récurrente créée dans Codex peut déclencher cette commande. **L’ordinateur doit être allumé, connecté au réseau et capable d’exécuter cette tâche.** Le worker n’installe aucun service Windows caché et ne crée pas de planificateur alternatif. Le serveur décide si un créneau est dû ; l’exécution d’un cycle n’impose pas une publication immédiate. Plusieurs cycles servent à préparer les contenus avant leur heure de diffusion.

L’automatisation Codex **Agent LinkedIn B&M — profil et page** a été créée avec un passage chaque heure, à la minute 0. Elle utilise `run --auto-pair-download --max-jobs 4`. Les créneaux initiaux sont 09 h pour la page B&M et 10 h pour le profil, en heure de Paris ; chaque compte possède son réglage dans le studio. Un passage en attente de liaison ne déclenche aucun envoi.

Le studio indique séparément « connecté », « préparé », « programmé » et « publié ». Tant que la liaison ou l’autorisation LinkedIn manque, l’automatisation n’est pas opérationnelle, même si l’interface est en ligne.

## Étapes d’un cycle

1. Vérifier la connexion ChatGPT, envoyer un signal de présence, prendre un travail avec un bail exclusif.
2. Pour un plan : lire les faits et réglages du studio, les publications des deux comptes et les statistiques réellement disponibles, préparer les prochains créneaux, obtenir une réponse JSON structurée de Codex, puis contrôler sa forme et sa cohérence. Sans statistiques exploitables, les choix restent des hypothèses éditoriales ; aucune performance n’est inventée.
3. Repérer les répétitions, les sources non vérifiées, les résultats chiffrés absents des faits, les références clients et les sujets exclus. Les éléments concernés reviennent dans la file de contrôle humain avec une raison précise.
4. Pour une publication : rendre le PNG ou le PDF localement. Le navigateur de rendu est isolé et n’accède qu’aux fichiers nécessaires au visuel. Les PNG/JPEG/WebP importés sous forme de données sont acceptés ; aucune URL d’image externe n’est chargée.
5. Envoyer une seule demande au serveur, qui vérifie le compte, le créneau et les doublons, charge le média chez LinkedIn et journalise le résultat.
6. Si la réponse de publication est perdue, signaler une issue incertaine : **ne pas republier automatiquement**. Contrôler le journal et le compte avant de relancer.

Les limites du worker sont bornées : 7 jours par plan, 4 pages par post, 2,8 Mo par média, 4 travaux maximum par cycle, 5 minutes maximum par appel de rédaction. Le serveur conserve ses propres vérifications et limites indépendantes.

Les contrôles déterministes réduisent les erreurs courantes ; ils ne certifient pas automatiquement tous les faits d’un texte. Les nouveautés, références clients et engagements commerciaux doivent être fournis dans les faits confirmés. Les informations manquantes restent visibles.

## Prévisualiser sans publier

```powershell
node scripts/linkedin-agent.mjs draft --days 7
node scripts/linkedin-agent.mjs render --file .local/linkedin-agent/draft-preview.json --format png
node scripts/linkedin-agent.mjs render --file .local/linkedin-agent/draft-preview.json --format pdf
```

`draft` utilise réellement Codex, mais n’appelle ni le studio ni LinkedIn. Les fichiers restent dans `.local/linkedin-agent/`. `render` prend une publication, un objet `{post: ...}` ou la première publication d’un plan.

## Diagnostic

| Situation | Comportement |
| --- | --- |
| Liaison absente ou révoquée | Importer une nouvelle liaison depuis le studio. Aucun travail n’est pris. |
| Session ChatGPT absente ou clé API active | Connecter Codex avec ChatGPT. Aucun autre mode n’est utilisé. |
| Quota Codex atteint | Travail signalé en erreur, sans nouvelle tentative de rédaction en boucle. |
| Ordinateur arrêté | Aucun cycle ne tourne ; le signal de présence devient ancien. |
| Bail concurrent | Le serveur n’attribue pas le même travail à deux workers. |
| Visuel trop lourd ou non lisible | Le travail est bloqué. Le worker ne remplace pas discrètement un carrousel par du texte. |
| Réponse d’envoi perdue | Contrôle de l’issue avant toute nouvelle publication. |

Tests locaux : `node --test scripts/linkedin-agent/test.mjs`.

Documentation officielle utilisée : [Codex non interactif](https://learn.chatgpt.com/docs/non-interactive-mode), [authentification Codex](https://learn.chatgpt.com/docs/auth), [OAuth LinkedIn](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow), [Posts API LinkedIn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api).
