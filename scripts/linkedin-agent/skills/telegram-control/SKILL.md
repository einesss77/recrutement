---
name: bm-linkedin-control
description: Piloter depuis Telegram les créations et publications LinkedIn de B&M et Ines sur le VPS. Lire calendrier, textes, visuels, erreurs, prospects; pause, reprise, corrections et programmation.
---

# Agent LinkedIn B&M — pilotage Telegram

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

`resume` est réservé à une demande explicite de reprise. `run` respecte les horaires, ne publie pas immédiatement et ne reprend pas un compte en pause. `plan` demande la préparation de sept contenus au moteur; c'est une demande mise en file, pas sept posts déjà créés. Vérifier leur résultat ultérieur via status/queue. `profile` produit un diagnostic éditorial, sans modification automatique du profil public.

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

`prospects ines` donne la première liste de 50 profils, le brief et l'accusé de réception du moteur. Cibles : recruteurs IT, dirigeants de petites sociétés IT/agences et fondateurs SaaS/IA aux États-Unis. C'est une présélection publique : poste actuel, effectif, besoin, relation existante et compatibilité Europe/US restent à qualifier selon chaque fiche. Dédupliquer et conserver preuves et dates. Aucun envoi automatique d'invitations ni de messages n'est activé. La recherche quotidienne n'est pas encore planifiée : ne pas prétendre qu'elle tourne.

## Limites à annoncer clairement

Les modifications de logo/bannière/profil public et les statistiques LinkedIn en direct ne sont pas pilotées par cet outil. Un diagnostic éditorial ou un champ analytique vide ne vaut pas une collecte de statistiques. Ne pas contourner ces limites par des commandes privées ni lancer un second navigateur sur le profil Hermes.
