# Vérification du modèle

- Modèle vertical de 15 s, 720 × 1280, 30 fps.
- Animation, encodage et voix de démonstration réalisés localement, sans requête IA. La création du code avec Codex consomme toujours des tokens.
- HyperFrames check et lint : aucun défaut bloquant ; images de début, milieu et fin inspectées. Les textes du canvas ont été contrôlés sur les images, pas par l’audit DOM.
- MP4 mesurés par FFprobe : H.264, 15 s, 720 × 1280, 30 fps. Le modèle typographique possède une piste AAC, le chat est muet.
- Aperçus du studio vérifiés dans WebKit et Chromium. Enregistrements personnalisés vérifiés dans Chromium, y compris l’audio du modèle typographique. Les fichiers MP4 fixes restent disponibles sur téléphone.
- La voix locale de démonstration utilise Windows Speech, avec six phrases alignées sur les changements de scène. Le son a été mesuré, pas écouté ; une voix enregistrée serait le prochain travail de qualité.
- Partie la plus simple : les mouvements du personnage utilisent des entrées et une respiration globale ; aucune animation labiale n’est revendiquée.
