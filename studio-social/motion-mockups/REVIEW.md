# Vérification du modèle texte et mockups

- Images inspectées à 0, 2, 4,8, 7,8, 10,5 et 13,5 s, puis aperçu des cinq scènes extrait du MP4 final. Laptop et iPhone reconnaissables, proportions conservées, appareils droits à la fin de leurs entrées.
- Contrôle HyperFrames : aucun défaut de lint, runtime ou audio. Le contenu du canvas est vérifié par les images plutôt que par l’analyse des boîtes DOM.
- MP4 vérifié par FFprobe : H.264, 720 × 1280, 30 fps, 15 secondes, piste audio AAC. Export personnalisé également exécuté dans Chromium ; aperçu, changement de temps et remplacement des captures testés dans WebKit.
- Voix française locale : cinq phrases alignées sur les cinq scènes. Son mesuré, pas écouté ; la voix reste une démonstration de synthèse, pas une prestation de comédien.
- Les interfaces Atelier sont illustratives. La lisibilité des petites étiquettes d’interface est secondaire ; les gros titres portent le message.
- Aucun appel IA nécessaire à l’animation, à l’encodage ou à la voix de démonstration. Les captures importées pour la vidéo restent dans le navigateur.
