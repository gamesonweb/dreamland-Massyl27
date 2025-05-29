[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/tcwhlYLU)
Dreams Catcher - Documentation Technique

1. Présentation du Projet

---

Jeu 3D développé avec Babylon.js où le joueur incarne un avatar collectant des rêves (sphères colorées) dans un monde onirique. Le but est d'obtenir le meilleur score possible avant la fin du temps imparti.

2. Structure des Fichiers

---

- index.html : Structure principale et interface utilisateur
- app.js : Logique principale du jeu (moteur 3D, déplacements, mécaniques)
- save-score.js : Backend pour la sauvegarde des scores (Netlify Function)
- assets/ : Dossier contenant les modèles 3D (.glb)
- textures/ : Textures pour le terrain et skybox
- Sound/ : Fichiers audio et icônes son

3. Fonctionnalités Clés

---

3.1 Système de Jeu

- Déplacement fluide avec touches ZQSD (W ey A pour les QWERTY)
- Collecte de 5 types de rêves avec effets différents
- Chronomètre de 30 secondes démarre au premier mouvement
- Système de score dynamique
- Meilleur score persistant (via Supabase)

  3.2 Éléments Graphiques

- Avatar humanoïde animé
- Terrain procédural avec obstacles
- Sphères colorées avec effets lumineux
- Skybox immersive
- Interfaces utilisateur stylisées

  3.3 Systèmes Avancés

- Authentification utilisateur (Netlify Identity)
- Sauvegarde cloud des scores (Supabase)
- Gestion audio avec bouton mute
- Collisions physiques Babylon.js
- Animation de personnage basée sur les mouvements

4. Architecture Technique

---

4.1 Technologies Utilisées

- Babylon.js v5.0 (rendu 3D)
- Supabase (base de données)
- Netlify Identity (authentification)
- Netlify Functions (backend serverless)

  4.2 Structure du Code (app.js)

---

- Initialisation Babylon.js (engine, scene, camera)
- Chargement des assets 3D (terrain, avatar, rêves)
- Gestion des entrées clavier (mouvements)
- Système d'animation (4 états de mouvement)
- Mécanique de collecte des rêves
- Gestion du chronomètre et du score
- Intégration avec Supabase via Netlify Functions

5. Points Forts du Code

---

- Découpage modulaire des fonctionnalités
- Gestion optimisée des animations (start/stop)
- Système de respawn aléatoire des rêves
- Collisions précises pour la collecte
- UI/UX intuitive avec transitions fluides
- Persistance des données via Supabase
- Gestion des erreurs robuste (chargement assets)

6. Fonctionnement du Backend

---

- Utilise Netlify Functions pour proxy entre frontend et Supabase
- Endpoint POST /.netlify/functions/save-score
- Stocke les scores dans table Supabase "scores" :
  - user_id (clé primaire)
  - best_score (entier)
  - updated_at (timestamp)

7. Dépendances

---

- Babylon.js (via CDN)
- Netlify Identity Widget (intégré automatiquement)
- Supabase-js (dans save-score.js)

8. Optimisations Notables

---

- Instancing pour les rêves (économie de ressources)
- Désactivation des meshes inutilisés
- Skybox à faible coût de rendu
- Gestion précise du game loop
- Colliders optimisés pour le terrain

9. Points d'Amélioration Potentiels

---

- Ajout d'effets sonores pour la collecte
- Implémentation des cauchemars (sphères noires)
- Système de particules pour les collectes
- Adaptation mobile (contrôles tactiles)
- Niveaux de difficulté progressifs

10. Instructions d'Installation

---

1. Cloner le dépôt
2. Configurer les variables d'environnement Netlify :
   - SUPABASE_URL
   - SUPABASE_KEY
3. Déployer sur Netlify (ou serveur Node.js)
4. Configurer la table Supabase "scores" avec les colonnes :

   - user_id (text, PK)
   - best_score (int)
   - updated_at (timestamp)

5. Workflow de Développement

---

- Modifier les assets dans Blender (fichiers .glb)
- Tester localement avec Live Server
- Déployer sur Netlify pour tester l'authentification
- Vérifier les logs des fonctions via Netlify Dashboard
- Optimiser les performances avec Babylon.js Inspector

12. Pourquoi j'ai fait la vidéo

---

- Apprendre l'utilisation de babylonJS
- Faire mon premier jeu en 3D
- Apprendre à créer et modéliser des différents objets avec blender
- Héberger mon premier jeu en ligne

13. Crédits

---

- Modèles 3D : Personnalisés (Blender)
- Textures : Création maison
- Bibliothèques : Babylon.js, Supabase
- Conception : HABBI Massyl
