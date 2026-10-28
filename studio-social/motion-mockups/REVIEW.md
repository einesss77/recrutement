# Révision 2 — démonstration produit

- Référence PipelineX examinée sur ses 31,146 secondes, transitions d’ouverture et d’interface décomposées à 4 images/seconde. Aucune bande-son de référence reprise.
- Recomposition complète : texte construit, cartes successives, formulaire saisi, confirmation, suivi sur iPhone, changement de fond et signature par anneau.
- Correction des chevauchements repérés sur les premières images : cartes d’ouverture espacées ; notification mobile au-dessus de l’appareil. Curseur dirigé vers les deux vrais boutons aux instants d’action.
- Images inspectées à 1,3 ; 3,3 ; 4,7 ; 5,6 ; 6,8 ; 8,9 ; 9,7 ; 11,5 et 13,8 secondes. Planche du MP4 inspectée sur toute la durée. L’analyse automatique du DOM ne couvre pas les textes peints dans le canvas.
- HyperFrames check : zéro erreur, zéro avertissement. Rendu local H.264/AAC, 720 × 1280, 30 fps, exactement 15 secondes. Aperçu WebKit et export personnalisé Chromium testés, captures laptop/mobile remplaçables, médias privés avec requêtes Range.
- Six phrases synthétisées localement avec Windows, alignées aux séquences. Niveau audio mesuré ; aucune écoute humaine de contrôle. Narration désactivable dans le studio.
- Pas d’API générative, pas de frais par rendu. Écrans fictifs indiqués, aucun résultat client inventé.

## Personnalisation — 28 octobre 2026

Palette de cinq couleurs, quatre préréglages, tous les textes des six séquences, captures laptop/mobile et narration importable. Les interactions illustratives peuvent être masquées. Les titres adaptent leur taille à la largeur disponible ; les autres champs sont bornés à leur zone. La voix de démo est désactivée si le texte change.

Sauvegarde IndexedDB par publication sur cet appareil : textes, palette, captures et données audio binaires. JSON portable pour les textes et couleurs ; médias à transférer séparément. Le MP4 de démonstration reste un fichier fixe, distinct de l’export personnalisé.

Tests : quatre tests unitaires de normalisation, indépendance des palettes, voix et contraste ; scénario Chromium avec export personnalisé et scénario WebKit avec palettes, textes, restauration de captures/audio, aller-retour JSON, import invalide et absence de débordement horizontal. Export audio personnalisé vérifié dans Chromium ; pas de validation d’encodage audio sur un iPhone physique.
