# VoiceStudio pour B&M

Installation headless officielle 0.5.8, image épinglée par digest, SDK Supertonic 1.3.1. Le serveur existant exécute le moteur ONNX sur CPU ; aucun abonnement ElevenLabs n'est requis. Les poids Supertonic 3 sont épinglés par VoiceStudio à `724fb5abbf5502583fb520898d45929e62f02c0b` (~400 Mo).

- Configuration : `/srv/bm-voicestudio/{compose.yaml,Dockerfile}`.
- Secret : `/etc/bm-voicestudio/runtime.env`, mode 0600, `OMNIVOICE_API_KEY`.
- Données persistantes, licence et modèles : `/var/lib/bm-voicestudio`.
- Backend : `127.0.0.1:3900`, plafond 2,5 Go et un CPU.
- Proxy : `/etc/caddy/bm-voice.caddy`, importé depuis le Caddyfile existant. Seuls le catalogue et la synthèse sont accessibles en HTTPS ; ils exigent le Bearer token. L'administration n'est pas exposée.

Depuis `/srv/bm-voicestudio`, `docker compose up -d --build` démarre le service ; `docker compose logs --tail 50` et `docker compose ps` permettent de le contrôler. `docker compose stop` arrête uniquement cette intégration. Ne pas supprimer le volume de données lors d'une mise à jour.

Avant toute première génération, l'utilisateur doit accepter la [licence OpenRAIL-M des poids](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE). VoiceStudio enregistre cette acceptation via son endpoint local authentifié `POST /api/settings/license`, corps `{"engine_id":"supertonic3","accepted":true}`. Ne pas automatiser cette acceptation sans accord. Le SDK est sous MIT. Les voix sont des presets, sans clonage. Le studio conserve la mention « Voix générée par IA » dans les exports utilisant une narration générée.

Côté Next.js/Vercel : `VOICESTUDIO_BASE_URL=https://bm-voice.145.14.158.179.sslip.io`, `VOICESTUDIO_MODEL=supertonic3`, `VOICESTUDIO_LANGUAGE=fr`, et `VOICESTUDIO_API_KEY` secret correspondant. Les sept presets sont lus depuis `engines[].preset_voices`, uniquement lorsque le moteur est disponible. Les alias OpenAI ne sont pas affichés comme des voix différentes. Une adresse configurée ne suffit pas à prouver qu'un modèle fonctionne : vérifier une vraie génération française, sa durée et l'export vidéo avant de déclarer l'intégration terminée.
