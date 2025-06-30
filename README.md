# 🎪 Cirque Rummy

Un jeu de cartes multijoueur local inspiré du Jok-R-ummy, avec un thème cirque vintage et des mécaniques de missions progressives.

## 🎯 Objectif du jeu

Le premier joueur à réussir **7 missions** remporte la partie. Chaque joueur progresse à son propre rythme à travers les missions, et continue sa mission actuelle même si l'autre joueur termine une manche en premier.

## 🃏 Règles du jeu

### Mécaniques de base
- **Tour par tour** : Les joueurs alternent
- **Actions par tour** :
  1. Piocher une carte (du paquet ou de la défausse)
  2. Optionnel : Poser des combinaisons ou ajouter à des combinaisons existantes
  3. Défausser une carte pour terminer le tour

### Types de combinaisons
- **Groupes** : 3 cartes ou plus de même valeur, toutes de couleurs différentes (pas de limite maximale)
- **Suites** : 3 cartes ou plus consécutives de la même couleur
- **Jokers** : Peuvent remplacer n'importe quelle carte dans une combinaison

### Fin de manche et règles spéciales
- **Fin de manche** : Une manche se termine lorsqu'un joueur n'a plus de cartes en main
- **Après mission accomplie** : Une fois sa mission effectuée, le joueur peut continuer à :
  - **Étendre ses propres combinaisons** : Ajouter des cartes à ses groupes ou suites déjà posés
  - **Étendre les combinaisons adverses** : Ajouter des cartes aux groupes ou suites de l'adversaire (uniquement si l'adversaire a aussi fini sa mission)
  - **Former de nouveaux groupes uniquement** : Créer de nouveaux groupes d'au moins 3 cartes de même valeur
  - **⚠️ Restriction importante** : Il est **interdit de former de nouvelles suites** après avoir accompli sa mission
  - **📝 Règle clé** : Les cartes restantes peuvent seulement être utilisées pour :
    - Étendre des combinaisons existantes (groupes ou suites déjà posés)
    - Former de nouveaux groupes (3+ cartes de même valeur)
    - **Aucune nouvelle suite ne peut être créée** après l'accomplissement de la mission
- **Conditions pour étendre les combinaisons adverses** :
  - Le joueur actuel doit avoir accompli au moins une mission
  - L'adversaire doit également avoir accompli au moins une mission
  - Si l'une de ces conditions n'est pas remplie, l'extension des combinaisons adverses est interdite
- **Nouvelle manche** : Après la fin d'une manche, tous les joueurs reçoivent 13 nouvelles cartes et les combinaisons sont remises à zéro

### Missions disponibles

#### ✅ Missions actuelles
1. **Deux groupes de 3** cartes de même valeur  
   Ex : 7♣ 7♦ 7♠ + J♣ J♦ J♥
2. **Une suite de 4 + un groupe de 3**  
   Ex : 4♠ 5♠ 6♠ 7♠ + 9♥ 9♦ 9♣
3. **Deux suites de 4** cartes  
   Ex : 3♣ 4♣ 5♣ 6♣ + 9♥ 10♥ J♥ Q♥
4. **Trois groupes de 3** cartes  
   Ex : 5♦ 5♣ 5♠ + 8♠ 8♥ 8♣ + Q♦ Q♠ Q♥
5. **Une suite de 4 + deux groupes de 3**  
   Ex : 2♠ 3♠ 4♠ 5♠ + 6♣ 6♦ 6♥ + J♣ J♦ J♠
6. **Une suite de 7** cartes de la même couleur  
   Ex : 3♥ 4♥ 5♥ 6♥ 7♥ 8♥ 9♥
7. **Sept cartes** de la même couleur (ordre libre)  
   Ex : 2♠ 4♠ 5♠ 7♠ 9♠ J♠ K♠
8. **Deux suites de 4 + un groupe de 3**  
   Ex : 2♣ 3♣ 4♣ 5♣ + 7♥ 8♥ 9♥ 10♥ + Q♦ Q♠ Q♣
9. **Quatre groupes de 3** cartes  
   Ex : 3♦ 3♠ 3♥ + 6♣ 6♠ 6♦ + 8♣ 8♦ 8♥ + K♠ K♣ K♥
10. **Trois suites de 4** cartes  
    Ex : A♠ 2♠ 3♠ 4♠ + 6♥ 7♥ 8♥ 9♥ + 9♣ 10♣ J♣ Q♣
11. **Deux suites de 6** cartes  
    Ex : 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ + 8♦ 9♦ 10♦ J♦ Q♦ K♦
12. **Mission libre** : choisir une mission déjà réussie

#### 🆕 Missions inédites
13. **Un groupe de 4 + une suite de 4**  
    Ex : 8♥ 8♣ 8♦ 8♠ + 3♦ 4♦ 5♦ 6♦
14. **Deux groupes de 4**  
    Ex : 9♠ 9♦ 9♣ 9♥ + Q♣ Q♦ Q♠ Q♥
15. **Une suite de 5 + un groupe de 3**  
    Ex : 4♠ 5♠ 6♠ 7♠ 8♠ + 2♣ 2♦ 2♥
16. **Une suite de 8 (max 2 couleurs)**  
    Ex : 5♠ 6♠ 7♠ 8♠ 9♠ 10♣ J♣ Q♣
17. **Deux groupes de 3 + un groupe de 4**  
    Ex : 3♣ 3♥ 3♠ + 7♦ 7♣ 7♠ + A♥ A♠ A♣ A♦
18. **Trois suites de 3**  
    Ex : 2♦ 3♦ 4♦ + 5♠ 6♠ 7♠ + 8♣ 9♣ 10♣
19. **Suite de 9 cartes (A à 9)** - Couleurs libres  
    Ex : A♠ 2♦ 3♠ 4♣ 5♥ 6♣ 7♠ 8♦ 9♣
20. **Sept cartes impaires** - Valeurs : A, 3, 5, 7, 9, J, K  
    Ex : 3♠ 5♣ 7♥ 9♦ A♠ J♥ K♣
21. **Deux suites de 5, de couleurs différentes**  
    Ex : 2♣ 3♣ 4♣ 5♣ 6♣ + 7♦ 8♦ 9♦ 10♦ J♦
22. 
23. **Trois groupes de 4 cartes**  
    Ex : 5♥ 5♣ 5♠ 5♦ + 8♣ 8♦ 8♠ 8♥ + K♠ K♦ K♣ K♥
24. **Suite complète (A à K) d'une seule couleur**  
    Ex : A♦ 2♦ 3♦ … K♦

#### 🎨 Missions avec contrainte de couleur spécifique
25. **Suite de 7-8-9-10 de cœur**  
    Ex : 7♥ 8♥ 9♥ 10♥ (obligatoirement en ♥)
26. **Deux suites de 4 : une en ♠ et une en ♣**  
    Ex : 3♠ 4♠ 5♠ 6♠ + 9♣ 10♣ J♣ Q♣
27. **Suite de 5 cartes rouges (♥ ou ♦)**  
    Ex : 4♦ 5♦ 6♥ 7♥ 8♥
28. **Deux groupes de 3 : un tout rouge, un tout noir**  
    Ex : 7♥ 7♦ 7♥ + 10♣ 10♠ 10♠
29. **Trois cartes identiques mais une de chaque couleur (♠ ♣ ♥)**  
    Ex : Q♠ Q♣ Q♥ (le ♦ est interdit ici)
30. **Une suite paire de 6 cartes rouges** - Valeurs : 2 4 6 8 10 Q  
    Ex : 2♦ 4♥ 6♦ 8♥ 10♦ Q♥

### Progression des missions
- Chaque joueur a sa propre mission en cours
- Les missions sont assignées aléatoirement parmi les 30 missions disponibles
- Le premier joueur à réussir 7 missions remporte la partie
- Si un joueur termine une manche sans compléter sa mission, il continue avec la même mission à la manche suivante
- Si un joueur termine une manche (n'a plus de cartes), il reçoit une nouvelle mission aléatoire pour la manche suivante
- La mission de l'IA n'est pas visible au joueur humain

## 🎨 Thème visuel

**Style Cirque Vintage / Freak Show**
- Palette : rouge carmin, ivoire, bleu nuit, noir vieilli, or patiné
- Typographie style affiche de cirque ancienne
- Animations stylisées pour les cartes et interactions
- Interface mobile-first et responsive

## 🛠️ Installation et développement

### Prérequis
- Node.js (recommandé via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm

### Installation
```bash
# Cloner le repository
git clone <URL_DU_REPO>

# Naviguer dans le dossier
cd cirque-rummy

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Scripts disponibles
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run build:dev    # Build de développement
npm run lint         # Vérification du code
npm run preview      # Aperçu du build
```

## 🏗️ Architecture technique

### Technologies utilisées
- **React** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI
- **React Router** pour la navigation
- **localStorage** pour la persistance des parties

### Structure du projet
```
src/
├── components/          # Composants React
│   ├── GameBoard.tsx   # Plateau de jeu principal
│   ├── Card.tsx        # Composant carte
│   └── MissionCard.tsx # Affichage des missions
├── hooks/
│   └── useGameState.ts # Gestion de l'état du jeu
├── types/
│   └── game.ts         # Types TypeScript
├── utils/
│   ├── cardUtils.ts    # Utilitaires pour les cartes
│   └── aiPlayer.ts     # Intelligence artificielle
└── data/
    └── missions.ts     # Définition des missions
```

### Fonctionnalités implémentées
- ✅ Jeu multijoueur local (2 joueurs)
- ✅ Mode contre IA
- ✅ Système de missions progressives
- ✅ Validation des combinaisons
- ✅ Extension de combinaisons après mission accomplie
- ✅ Groupes de taille illimitée (minimum 3 cartes)
- ✅ Fin de manche automatique
- ✅ Persistance en localStorage
- ✅ Interface responsive
- ✅ Thème cirque vintage
- ✅ Historique des actions
- ✅ Gestion des jokers

## 🎮 Modes de jeu

### 2 Joueurs
- Jeu en local sur le même appareil
- Chaque joueur voit sa mission actuelle
- Alternance des tours

### Contre IA
- L'IA joue automatiquement
- La mission de l'IA n'est pas visible
- L'IA n'a pas accès à la mission du joueur
- Délai de 1.5s pour simuler la réflexion

## 🔧 Développement

### Tests
```bash
# Tester la compilation TypeScript
npx tsc --noEmit

# Tester le build
npm run build

# Script de test personnalisé
node test-game.js
```

### Contribution
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request
