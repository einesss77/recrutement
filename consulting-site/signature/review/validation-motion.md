# Passe visuelle et mouvement — 26 octobre 2026

## Changements
- Navigation fixe, compacte après défilement et fond translucide adapté aux pages claires/sombres.
- Progression de lecture discrète en haut de page.
- Apparitions décalées des formats, des étapes de méthode et du suivi.
- Arrivée des figurines en profondeur ; dessin du lien équipe/consultants.
- Parallaxe bornée de l’image abstraite, du jeu de cartes, des scènes solo/squad et du schéma de suivi.
- Inclinaison des cartes selon le pointeur sur ordinateur ; désactivée sur petits écrans et écrans tactiles.
- Surfaces, bordures, ombres et retours des boutons harmonisés.
- Pause depuis le hero ; désactivation des effets par prefers-reduced-motion via CSS et JS.

## Vérifications dans le navigateur
- Accueil : aucun débordement à 320, 390, 768 et 1440 px.
- Aucun titre, paragraphe ou bouton hors écran à 320 et 768 px.
- Profils, Solutions, À propos, Contact : aucun débordement à 390 et 1440 px.
- Menu mobile : ouverture et fermeture par Échap.
- Onglets mobile : Cloud affiché, puis Produit sélectionné par la touche Fin.
- Parallaxe : déplacement de l’image mesuré de -2,09 à +13,99 px durant le défilement.
- Pause : classe motion-enhanced retirée, décalages réinitialisés ; reprise vérifiée.
- Navigation compacte : hauteur mesurée de 72 px sur ordinateur.
- Pas d’erreur ou avertissement dans les journaux inspectés ; aucune image cassée à 390 px.
- Préférence système de mouvement réduit prise en charge dans le code ; pas de changement de réglage système effectué pour le test.
- node --check, build et contrôle des 9 pages / 319 liens et ressources réussis.

Tests de dimensions effectués dans le navigateur, sans appareil mobile physique. Aucun envoi de formulaire ni publication.
