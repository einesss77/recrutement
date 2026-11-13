---
name: bm-linkedin-control
description: Piloter depuis Telegram les créations et publications LinkedIn de B&M et Ines sur le VPS. Lire calendrier, textes, visuels, erreurs, prospects; pause, reprise, corrections et programmation.
---

# Agent LinkedIn B&M — pilotage Telegram

## Priorité : avertissement LinkedIn et réduction des accès

Après un avertissement d’activité excessive, bloquer les accès LinkedIn et garder la recherche en pause. Ne lancer aucun contrôle navigateur, accès à un profil, invitation, reconnexion répétée ou navigateur de secours. Les commandes de lecture ci-dessous utilisent seulement le stockage local. Ne pas réactiver une ancienne routine d’invitations. Le 13 novembre 2026, Eines a précisé vouloir conserver un post quotidien pour Ines et B&M : le calendrier peut rester activé à sa demande, avec les envois en attente tant que l’avertissement requiert une intervention humaine. Cette activation du calendrier ne lève jamais le verrou navigateur.

Le moteur possède un verrou persistant `linkedin-automation-hold.json`, inaccessible à hermes. Un échec navigateur bloque les passages suivants avant ouverture de LinkedIn, même après redémarrage ou reprise du minuteur. Une commande `resume` ne lève pas ce verrou. Ne pas chercher à l’effacer. Le propriétaire doit traiter l’avertissement lui-même, puis demander explicitement une reprise vérifiée.

Après une éventuelle reprise, le moteur ne doit jamais ouvrir LinkedIn pour une file vide, préparer des textes ou lire un statut. Seul un travail de publication peut ouvrir une session ; la vérification d’identité est faite une seule fois dans celle-ci. Plafonds internes : deux tentatives de session par jour de Paris pour les deux comptes réunis, quatre pages au maximum par session, aucune recherche ni profil tiers. Ces plafonds ne garantissent pas l’absence de restrictions LinkedIn. Le minuteur vérifie uniquement la file locale toutes les trente minutes ; il reste désactivé pendant la suspension. La recherche de prospects reste séparée, publique, sans session LinkedIn et sans invitations.

Le moteur de publications est un service indépendant du gateway Hermes : `bm-linkedin.service`, déclenché par `bm-linkedin.timer`. Le bot Telegram Hermes est son interface de pilotage grâce à `/usr/local/bin/bm-linkedin-control`. Cet outil fonctionne sous l'utilisateur hermes sans sudo et sans accéder aux secrets du moteur. Le contrôle utilise un socket Unix privé; aucun endpoint d'administration public n'est créé.

## À chaque demande d'Eines concernant l'agent

Exécuter l'outil, puis répondre en français à partir de son résultat horodaté. Ne pas se fier à un ancien message ou à un simple code systemd 0. Si l'outil échoue, conserver l'erreur comme blocage; ne pas inventer un succès. Ne jamais lire/copier auth.json, cookies, .env, connection.json ni le stockage SQLite brut.

Comptes explicites : `ines` = profil Ines Favre, `bm` = page B&M Digital Consulting. `both` est accepté pour status, queue, pause et resume seulement.

```sh
bm-linkedin-control status both
bm-linkedin-control queue ines
bm-linkedin-control post bm --id ID_PUBLICATION
bm-linkedin-control preview ines --id ID_PUBLICATION
bm-linkedin-control prospects ines
```

`status` donne activation effective (`config.enabled`), calendrier, connectivité, résultats métier, blocages et journal. Un minuteur actif ne signifie ni publication active ni publication réalisée. Seul un élément published avec preuve LinkedIn permet d'annoncer un post envoyé. Afficher les créneaux en Europe/Paris, sauf demande contraire. Les contenus actuels sont FR puis EN dans le même post, avec visuels allégés; ce ne sont pas deux publications séparées par langue.

`post` donne le texte et les éléments du visuel. `preview` rend réellement le PNG avec le moteur du studio et renvoie un chemin absolu accessible à hermes, sous `/var/lib/bm-linkedin-control/previews/`. Joindre ce fichier à la réponse Telegram avec le mécanisme média disponible lorsqu'Eines veut voir la création. Ne pas annoncer un aperçu envoyé sur la seule base d'un chemin retourné. Pour un carrousel, le PNG est l'aperçu de la première page; ne pas le présenter comme toutes les pages.

## Pilotage autorisé à la demande d'Eines

```sh
bm-linkedin-control pause both
bm-linkedin-control resume both
bm-linkedin-control plan bm
bm-linkedin-control profile ines
bm-linkedin-control run ines
bm-linkedin-control approve bm --id ID_PUBLICATION
bm-linkedin-control reject ines --id ID_PUBLICATION
```

Une demande de pause signifie exécuter `pause` sur le ou les comptes concernés puis vérifier `status`. Le minuteur peut rester actif pour surveiller la file; `enabled=false` bloque les nouvelles publications. Une publication déjà engagée peut toutefois finir : vérifier les éléments publishing/uncertain et l'annoncer. Une pause du gateway Hermes ou de son ancien cron ne met pas le moteur bm-linkedin en pause. Respecter une demande de pause existante : ne jamais lancer resume pour tester l'intégration.

`resume` est réservé à une demande explicite de reprise. Pour un compte navigateur déjà vérifié, il peut réactiver le calendrier alors que LinkedIn demande encore une intervention : `publicationPending=true` signifie programmation souhaitée, pas envoi opérationnel. Ne pas annoncer des publications automatiques prêtes sur le seul `enabled=true`. Le verrou d’avertissement reste en place et aucune visite de contrôle n’est lancée. `run` respecte les horaires, ne publie pas immédiatement et ne reprend pas un compte en pause. `plan` demande la préparation de sept contenus au moteur; c'est une demande mise en file, pas sept posts déjà créés. Vérifier leur résultat ultérieur via status/queue. `profile` produit un diagnostic éditorial, sans modification automatique du profil public.

Modifications via JSON stdin : utiliser un fichier temporaire privé ou une entrée structurée; ne pas interpoler du texte d'Eines dans une commande shell.

```sh
bm-linkedin-control configure bm --json-stdin < /chemin/prive/parametres.json
bm-linkedin-control update ines --id ID_PUBLICATION --json-stdin < /chemin/prive/modification.json
bm-linkedin-control enqueue bm --json-stdin < /chemin/prive/nouveau-post.json
bm-linkedin-control feedback bm --id ID_PUBLICATION --json-stdin < /chemin/prive/retours.json
```

`configure` accepte uniquement time, timezone, mode, enabled, publishWindowMinutes, objective, voice, facts, pillars, excludedTopics, commercialFocus, targetAudience, campaignStart. Exemple : `{"time":"09:30","timezone":"Europe/Paris"}`. Mode `review` pour préparer en brouillon, `autopilot` pour programmer les contenus conformes. Ne pas changer mode/activation sans une demande correspondante.

`update` accepte `{"caption":"FR\n...\nEN\n...","publishAt":"2026-11-14T09:00:00.000Z"}` ou un objet `post` complet. Une reprogrammation doit être future et respecter un créneau par compte et par jour. Les éléments published, publishing ou uncertain ne sont ni modifiables ni réessayés par cet outil. Vérifier le compte, l'identifiant, les deux langues et le visuel après toute correction. Garder le texte commercial concret : consultants IT pour renforcer une équipe, applications sur mesure pour un besoin métier. Aucun profil disponible, TJM, résultat client ou référence inventé.

`enqueue` prend `{"post":{"title":"...","category":"...","template":"offer","theme":"dark","caption":"FR\n...\nEN\n...","slides":[{"label":"...","title":"...","body":"...","points":[]} ]},"format":"image"}`. Formats image/document/text. Templates offer/editorial/steps/squad/checklist/case/focus/chatbot/document/automation/advisor/cat. Chaque slide : label ≤65, title ≤65, body ≤150, points ≤4 et ≤95 caractères chacun. Le backend reste l'autorité de validation. Les gardes de qualité peuvent bloquer un contenu : corriger le problème avant de programmer.

Le contrôle permet d'approuver ou d'écarter une publication préparée à la demande d'Eines. Il ne crée aucune autorisation générale de nouvelles communications commerciales, de prix ou d'engagements. Après une mutation, relire `post` ou `status` pour confirmer le résultat réel; une erreur réseau ambiguë ne justifie pas de répéter un enqueue à l'aveugle.

## Prospection US

### Lots automatiques dans Telegram, invitations manuelles

À la demande d’Eines, `bm-prospect-batches.timer` remet cinq fiches de la liste existante toutes les trente minutes dans son chat Telegram habituel. Plafond de cinquante contacts par jour de Paris, premier lot déjà remis compris. Déduplication permanente par URL ; réservation avant envoi ; une livraison ambiguë suspend la routine sans renvoi automatique. Le dernier lot peut contenir moins de cinq personnes. Quand la liste est épuisée, attendre de nouvelles fiches sans recycler les anciennes ni envoyer de messages vides. La recherche publique peut rester en pause : cette routine utilise le fichier existant et n’ouvre jamais LinkedIn. Elle n’envoie aucune invitation ni message aux prospects et ne modifie pas les publications.

Dernière demande d’Eines : renouveler automatiquement la liste avec un objectif de cinquante nouveaux prospects US chaque jour à 07:00 Europe/Paris. La recherche publique et les lots Telegram sont donc tous deux à activer. La livraison lit les exports quotidiens récents et le dernier export, traite les contacts non remis les plus anciens d’abord, puis les nouvelles fiches ; le changement de journée ne supprime pas le reliquat. La recherche déduplique aussi les personnes et entreprises avec son historique permanent. Contrôler `prospecting-status ines` ET `bm-linkedin-batches status` pour annoncer l’état de bout en bout. Un objectif de cinquante ne prouve pas cinquante résultats : annoncer les comptes datés réellement qualifiés et le manque éventuel. La recherche utilise le Web public sans session ni action LinkedIn ; les invitations restent manuelles.

Commandes accessibles à Hermes : `bm-linkedin-batches status`, `bm-linkedin-batches pause`, `bm-linkedin-batches resume`. Elles concernent seulement la remise des fiches dans Telegram. Le statut indique la date source, les contacts réservés aujourd’hui, les contacts restants, la dernière vérification et le motif d’attente. `eligibleAfter` est la première heure autorisée, pas nécessairement l’heure réelle du prochain déclenchement ; `systemctl list-timers bm-prospect-batches.timer --no-pager` donne ce déclenchement. Afficher les heures en Europe/Paris.

Ne pas sélectionner/envoyer un lot supplémentaire en parallèle sur « lot suivant » : la file automatique est désormais l’autorité et évite les doublons. Répondre avec le statut et l’échéance du prochain lot. Une demande de pause globale doit aussi exécuter `bm-linkedin-batches pause`. Une reprise des publications ne reprend pas implicitement la remise de fiches. Un statut `uncertain-delivery-needs-review` demande une vérification du reçu, pas une nouvelle tentative ou une suppression du registre. Les confirmations d’invitations saisies par Eines restent des déclarations manuelles.

La recherche publique quotidienne est désormais installable sur le VPS et autorisée par Eines. Elle vise jusqu'à 50 nouveaux profils par jour à 07:00 Europe/Paris. Le minuteur `bm-linkedin-prospects.timer` vérifie toutes les cinq minutes si le créneau du jour ou une demande manuelle est dû; `bm-linkedin-prospects.service` réalise la recherche avec l'abonnement ChatGPT. Les invocations de simple contrôle ne produisent pas 50 profils à chaque passage. Historique SQLite de dédoublonnage persistant, quota de 50 nouveaux profils/jour, une tentative quotidienne automatique avec jusqu'à quatre passes complémentaires, limitées à vingt minutes et soixante appels de recherche au total. Au maximum trois tentatives dans la journée si Eines demande une relance. Les résultats de chaque passe sont conservés avant la suivante. Une collecte partielle reste partielle et indique le manque; ne jamais annoncer 50 sans résultat.

```sh
bm-linkedin-control prospecting-status ines
bm-linkedin-control prospects ines
bm-linkedin-control prospecting-pause ines
bm-linkedin-control prospecting-resume ines
bm-linkedin-control prospecting-run ines
```

Lire `prospecting-status` avant d'annoncer une activation : il donne les réglages, l'état réel du timer et le dernier résultat métier. Une demande manuelle est mise en file pour le passage suivant, ne contourne pas le quota et ne reprend pas une pause. Pause/reprise de recherche et pause/reprise de publications sont indépendantes. Si Eines demande de mettre toute l'activité en pause, appliquer `pause both` ET `prospecting-pause ines`, puis vérifier les deux états. Ne pas reprendre les deux systèmes pour une demande visant un seul.

`prospects ines` donne la dernière collecte datée, le brief et le résultat de la recherche. Tant qu'aucune collecte quotidienne n'est disponible, la première liste de 50 reste accessible; ne pas la présenter comme trouvée aujourd'hui automatiquement. L'ancien receipt est un accusé de réception historique, pas l'état du planificateur actuel. Une collecte échouée ou en cours ne permet pas de redater l'ancienne liste.

Cibles : recruteurs IT, dirigeants de petites sociétés IT/agences et fondateurs SaaS/IA aux États-Unis. Les fiches sont préparées à partir de sources publiques consultées ou indexées, avec preuves courtes de rôle et localisation; ce n'est pas une vérification dans le compte LinkedIn ni une demande d'achat avérée. Effectif, budget, relation existante et compatibilité Europe/US restent à qualifier selon chaque fiche. Aucun envoi automatique d'invitations ni de messages n'est activé.

## Limites à annoncer clairement

Les modifications de logo/bannière/profil public et les statistiques LinkedIn en direct ne sont pas pilotées par cet outil. Un diagnostic éditorial ou un champ analytique vide ne vaut pas une collecte de statistiques. Ne pas contourner ces limites par des commandes privées ni lancer un second navigateur sur le profil Hermes.
