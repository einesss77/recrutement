# Worker LinkedIn sur le VPS

Cette installation déplace l’exécution du worker vers un VPS allumé en permanence. Le site conserve la stratégie, les deux comptes, les calendriers, les validations et la publication via l’API LinkedIn. Le VPS rédige avec Codex connecté à ChatGPT et produit les PNG/PDF. Le PC peut être éteint une fois le service distant connecté, vérifié et activé.

Le paquet ne contient aucun mot de passe, jeton LinkedIn, fichier de liaison ou session ChatGPT. Il n’installe ni le site Next.js ni Prisma, et n’ouvre aucun port public. Le petit serveur de rendu n’écoute que sur `127.0.0.1`, pendant la fabrication d’un visuel.

## Déploiement vérifié le 12 novembre 2026

Release `171b6d640b054e77` installée. Une session ChatGPT propre au VPS a été créée par le flux officiel de connexion par code ; aucun cache de session du PC n’a été copié. La liaison au studio a été importée avec des droits limités au compte du service.

Un brouillon réel et ses rendus PNG (585 Ko) et PDF (789 Ko) ont été produits sous les mêmes protections systemd que le service, avec un pic de mémoire de 321,3 Mo. Le contrôle éditorial a demandé une relecture pour une provenance manquante ; ce brouillon de validation n’a pas été publié. Le premier cycle connecté au studio s’est terminé avec succès, sans travail en attente.

Le minuteur serveur est activé et l’ancienne tâche locale Codex est en pause. Les comptes LinkedIn restent en pause : l’application LinkedIn et les autorisations de publication ne sont pas encore configurées dans le studio. Le déploiement du moteur ne les crée pas implicitement.

## Environnement confirmé et limites

La cible examinée est Ubuntu 24.04 x64 avec systemd 255. Le Node système est trop ancien (`/usr/bin/node`, version 18) ; utiliser le Node 22.23.4 déjà présent dans `/opt/node-v22.23.4-linux-x64/bin/node`. L’installateur accepte Ubuntu/Debian avec systemd et exige Node 22.15 ou plus récent. Il ne remplace pas le Node système et ne modifie aucun autre service.

Le VPS dispose de peu de mémoire libre. Le service a une limite ferme de 1 Go, un seuil de pression à 768 Mo et au plus un cœur CPU. Un dépassement arrête le cycle, sans redémarrage immédiat. Ces plafonds doivent être validés avec un vrai rendu et une rédaction avant activation. Aucun swap ni changement global du système n’est créé par l’installateur.

| Élément | Emplacement / comportement |
| --- | --- |
| Compte système | `bm-linkedin`, groupe dédié, sans shell de connexion |
| Application | `/opt/bm-linkedin/releases/<identifiant>` ; code appartenant à root |
| Version courante | `/opt/bm-linkedin/current`, lien vers une release |
| État du worker | `/var/lib/bm-linkedin/state`, droits 0700 |
| HOME | `/var/lib/bm-linkedin/home`, droits 0700 |
| Session Codex | `CODEX_HOME=/var/lib/bm-linkedin/home/.codex` ; créée sur le VPS |
| Chromium | `/opt/bm-linkedin/browsers`, cache distinct des autres services |
| Journaux | `journalctl -u bm-linkedin.service` |
| Timer | Toutes les cinq minutes, avec jusqu’à dix secondes de décalage |
| Cycle | Maximum 4 travaux ; 30 minutes au total ; chaque rédaction reste limitée à 5 minutes |

Le timer n’accélère pas la publication quotidienne. Le serveur garde les horaires et limites de chaque compte. systemd n’ouvre pas une deuxième instance si le service tourne déjà ; `Persistent=false` évite les exécutions de rattrapage au démarrage. `Restart=no` interdit une boucle de redémarrage immédiate. Après une panne ou un quota atteint, les contrôles du serveur continuent de déterminer les travaux admissibles.

## Construire le paquet portable

Depuis le dépôt sur Windows ou Linux :

```powershell
node scripts/deploy/linkedin-agent/package.mjs
```

Le résultat indique un dossier `.local/linkedin-agent-vps/<identifiant>`. Le builder copie uniquement une liste explicite de fichiers runtime, les styles, les polices et leurs licences. Il produit un manifest SHA-256 et un `package-lock.json` réduit à la fermeture transitive des six dépendances nécessaires :

| Dépendance directe | Version verrouillée au moment de la préparation |
| --- | --- |
| zod |4.6.7 |
| esbuild |0.28.2 |
| @playwright/test |1.64.1 |
| html-to-image |1.11.13 |
| jspdf |4.2.1 |
| fflate |0.8.3 |

Les versions et intégrités transitives viennent du lock du dépôt. Les binaires optionnels par plateforme restent dans ce lock ; npm sélectionne ceux du VPS. Codex est verrouillé séparément en 0.167.0 dans `runtime/codex/package-lock.json`, avec les intégrités npm. Aucun `npm install latest`, dépendance `file:` ou script postinstall du site n’est exécuté. `npm ci --ignore-scripts` est lancé depuis le dossier de chaque paquet, jamais avec un préfixe pointant vers un autre projet.

Vérifier puis transférer le dossier indiqué par le builder, par exemple en remplaçant `<identifiant>` et `<hôte>` :

```powershell
node scripts/deploy/linkedin-agent/verify-package.mjs .local/linkedin-agent-vps/<identifiant>
tar -czf .local/bm-linkedin-vps.tgz -C .local/linkedin-agent-vps/<identifiant> .
scp .local/bm-linkedin-vps.tgz root@<hôte>:/root/bm-linkedin-vps.tgz
```

Reconstruire le paquet après toute modification du worker. Ne pas utiliser le dépôt entier, `.env`, `node_modules` local ou le HOME comme archive de déploiement.

## Installer sans activer les publications

Sur le VPS, extraire le paquet dans un nouveau dossier privé et lancer :

```bash
install -d -m 0700 /root/bm-linkedin-install
tar -xzf /root/bm-linkedin-vps.tgz -C /root/bm-linkedin-install
bash /root/bm-linkedin-install/deploy/install.sh \
  --node /opt/node-v22.23.4-linux-x64/bin/node
```

L’installateur vérifie les fichiers et les dépendances, crée le compte et les répertoires s’ils manquent, installe les deux paquets avec leurs locks et télécharge la révision Chromium associée à Playwright. Il configure les unités et le helper `/usr/local/sbin/bm-linkedin-as-user`. L’installation est répétable ; HOME, état et session de connexion sont conservés. Les anciennes releases sont conservées pour le retour arrière.

Le timer reste **désactivé** après l’installation. Si un cycle est déjà actif lors d’une mise à jour, l’installateur arrête seulement le timer puis refuse d’interrompre le cycle ; attendre sa fin avant de relancer. Il ne tue pas une publication potentiellement en cours.

Les bibliothèques Linux de Chromium doivent être disponibles. Si le test de rendu relève une bibliothèque manquante, examiner la liste de dépendances Playwright sur l’hôte avant une installation ciblée. L’installateur n’exécute pas `apt upgrade`, ne redémarre pas les services voisins et ne modifie pas le pare-feu.

## Créer les connexions sur le serveur

Créer une nouvelle connexion ChatGPT sur le VPS, depuis un terminal administrateur privé :

```bash
bm-linkedin-as-user codex login --device-auth
bm-linkedin-as-user codex login status
```

Le navigateur sert à valider le code temporaire présenté par Codex. Le helper lance la CLI comme `bm-linkedin` avec le même HOME et le même Node que le service. Le code temporaire ne doit pas être placé dans un journal public. Si ce mode est désactivé pour le compte, l’activer dans les paramètres de sécurité ChatGPT ou utiliser le flux navigateur documenté avec un tunnel SSH limité au poste administrateur. Aucun port d’authentification n’a besoin d’être exposé publiquement.

Ne pas lire, copier ou transférer le cache de session d’un autre ordinateur. Ne pas fournir de clé API : le worker exige une session ChatGPT et retire les clés API de l’environnement de Codex. Les quotas de l’abonnement s’appliquent également au VPS. L’authentification peut devoir être renouvelée si elle est révoquée.

Pour la liaison au studio, télécharger une **nouvelle liaison privée du moteur** dans Agent LinkedIn. Cette opération révoque l’ancienne clé et met les comptes en pause : elle assure la bascule vers un seul moteur. Transférer ce fichier par SSH dans un emplacement privé, puis l’importer sans jamais afficher son contenu :

```bash
install -o bm-linkedin -g bm-linkedin -m 0600 \
  /root/bm-linkedin-worker.json /var/lib/bm-linkedin/state/pairing-import.json
bm-linkedin-as-user worker pair --file /var/lib/bm-linkedin/state/pairing-import.json
bm-linkedin-as-user worker doctor
```

Le JSON de liaison contient uniquement la clé du worker, son identifiant et l’origine du studio. Les autorisations OAuth LinkedIn restent sur le serveur du site ; une session Hermes reste dans le profil du navigateur sur le VPS. Les deux copies temporaires de transfert peuvent être supprimées après import ; le worker utilise `state/connection.json`. Il ne cherche pas de fichier de liaison dans les téléchargements d’un autre utilisateur du VPS.

## Réutiliser la session LinkedIn de Hermes

Le connecteur `hermes-browser` utilise le navigateur persistant déjà connecté sur le VPS, via son port CDP limité à `127.0.0.1:9222`. Il ne copie pas les cookies et ne les transforme pas en jetons OAuth. Il vérifie une navigation fraîche, le profil exact d’Ines Favre et l’administration de la page B&M `106357560` avant d’enregistrer la connexion dans le studio. La liaison est limitée à ces deux destinataires.

Chaque publication ouvre son propre onglet. Le moteur contrôle le compte visible, prépare le texte et le média, puis demande au studio une réservation atomique avant le clic final. Une trace locale est conservée avant l’envoi ; le résultat ne devient « publié » qu’avec un lien LinkedIn vérifié. Une réponse perdue ou ambiguë bloque le post et ne déclenche aucun second envoi. Les statistiques API ne sont pas disponibles avec cette connexion.

En cas d’expiration de session, de contrôle de sécurité ou de changement de compte, reconnecter humainement le navigateur Hermes puis relancer sa vérification. Une nouvelle vérification ne réactive pas un compte volontairement mis en pause. Aucun port CDP ou VNC ne doit être exposé publiquement.

Services utilisateur nécessaires : `linkedin-xvfb`, `linkedin-chromium`, `linkedin-vnc` et `linkedin-novnc`. Leur helper de disponibilité est conservé dans `/home/hermes/.hermes/linkedin-browser/wait-ready.py`, en dehors des anciens profils Hermes archivés. Le profil connecté reste dans `/home/hermes/.hermes/linkedin-browser/profile`. Ne pas lancer un second Chromium sur ce même répertoire.

Les anciennes routines LinkedIn archivées sont désactivées ; les processus résiduels correspondants ont été arrêtés lors de la bascule. Le gateway Hermes et les autres services du VPS restent indépendants du minuteur du studio.

Après les contrôles de préparation sans publication, la commande explicite de liaison est :

```bash
bm-linkedin-as-user worker connect-browser --activate
```

Elle vérifie les deux identités puis active leurs calendriers dans le studio. Sans `--activate`, elle établit la liaison en conservant les pauses. Les cycles utilisent un complément d’unité `/etc/systemd/system/bm-linkedin.service.d/browser.conf` :

```ini
[Service]
Environment="STUDIO_LINKEDIN_PROVIDER=hermes-browser"
Environment="STUDIO_LINKEDIN_BROWSER_URL=http://127.0.0.1:9222"
```

Recharger systemd après ajout de ce fichier. Les contrôles automatiques rafraîchissent uniquement une connexion Hermes existante ; ils ne remplacent pas une déconnexion explicite ou une connexion OAuth choisie ensuite dans le studio.

## Vérifier et activer

Avant d’activer le timer :

1. Vérifier `doctor` : ChatGPT connecté, liaison présente et Chromium disponible.
2. Produire un PNG et un PDF avec le rendu existant, puis inspecter leur résultat. Le helper permet `bm-linkedin-as-user worker render --file ... --format png|pdf --out ...` ; écrire les fichiers de test dans `/var/lib/bm-linkedin/state`.
3. Tester une rédaction locale bornée avec `draft --days 1 --account organization --out /var/lib/bm-linkedin/state/vps-draft.json`. Cette commande utilise l’abonnement sans publier. Vérifier aussi une exécution sous les protections et plafonds systemd, pas uniquement en terminal root.
4. Garder les comptes LinkedIn en pause pendant ces essais. Exécuter un cycle pour confirmer le signal de présence dans le studio, puis activer chaque compte selon la destination souhaitée.
5. Désactiver l’ancienne automatisation locale dans l’application Codex. La gestion de cette automatisation reste dans l’application, pas dans un script SSH.

Puis :

```bash
systemctl start bm-linkedin.service
journalctl -u bm-linkedin.service -n 40 --no-pager
systemctl enable --now bm-linkedin.timer
systemctl list-timers bm-linkedin.timer
```

Un état « actif » du timer indique seulement que les passages sont programmés. La preuve opérationnelle est un signal de présence récent dans le studio, une session ChatGPT valide et un compte LinkedIn connecté/activé. Un post n’est considéré publié que lorsque LinkedIn a renvoyé son identifiant.

## Exploitation et retour arrière

```bash
systemctl status bm-linkedin.timer bm-linkedin.service --no-pager
journalctl -u bm-linkedin.service --since '1 hour ago' --no-pager
systemctl show bm-linkedin.service -p Result -p MemoryPeak -p CPUUsageNSec
systemctl stop bm-linkedin.timer
```

Arrêter le timer empêche les prochains cycles ; cela n’interrompt pas un cycle déjà lancé. Pour arrêter toute publication, utiliser aussi Pause dans le studio : le serveur vérifie ce réglage avant l’envoi. Ne pas forcer une nouvelle tentative après une issue incertaine ; vérifier le journal et LinkedIn.

Pour une mise à jour, construire une nouvelle archive, relancer l’installation et les vérifications, puis réactiver le timer. Pour revenir à une release précédente, attendre l’arrêt du service, vérifier l’identifiant choisi sous `/opt/bm-linkedin/releases`, replacer le lien `current`, puis refaire `doctor` et un rendu avant activation. Ne jamais remplacer l’état ou le HOME par ceux d’une archive d’application.

Les journaux sont envoyés à journald, avec limitation du débit du service ; aucune politique globale de rétention du VPS n’est modifiée. Surveiller l’espace disque et la mémoire réelle lors de l’exploitation. Les anciens paquets et releases ne sont pas supprimés automatiquement.

Références : [authentification Codex sans navigateur](https://learn.chatgpt.com/docs/auth?surface=cli), [comportement des timers systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html), [limites et arrêt d’un service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [permissions et isolation](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html).
