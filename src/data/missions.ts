
import { Mission } from '../types/game';

export const MISSIONS: Mission[] = [
  // ✅ Missions actuelles
  {
    id: 1,
    title: "Deux groupes de 3",
    description: "Deux groupes de 3 cartes de même valeur",
    icon: "3️⃣🔗➕3️⃣🔗",
    requirements: { groups: 2 }
  },
  {
    id: 2,
    title: "Suite de 4 + groupe de 3",
    description: "Une suite de 4 cartes + un groupe de 3",
    icon: "4️⃣➡️➕3️⃣🔗",
    requirements: { sequences: 1, groups: 1, minSequenceLength: 4 }
  },
  {
    id: 3,
    title: "Deux suites de 4",
    description: "Deux suites de 4 cartes",
    icon: "2️⃣×4️⃣➡️",
    requirements: { sequences: 2, minSequenceLength: 4 }
  },
  {
    id: 4,
    title: "Trois groupes de 3",
    description: "Trois groupes de 3 cartes",
    icon: "3️⃣×3️⃣🔗",
    requirements: { groups: 3 }
  },
  {
    id: 5,
    title: "Suite de 4 + deux groupes de 3",
    description: "Une suite de 4 + deux groupes de 3",
    icon: "4️⃣➡️➕3️⃣🔗➕3️⃣🔗",
    requirements: { sequences: 1, groups: 2, minSequenceLength: 4 }
  },
  {
    id: 6,
    title: "Suite de 7 même couleur",
    description: "Une suite de 7 cartes de la même couleur",
    icon: "7️⃣➡️🌈",
    requirements: { sequences: 1, minSequenceLength: 7, specificRequirements: "same_suit" }
  },
  {
    id: 7,
    title: "7 cartes même couleur",
    description: "7 cartes de la même couleur",
    icon: "7️⃣🌈",
    requirements: { specificRequirements: "7_same_suit" }
  },
  {
    id: 8,
    title: "Deux suites de 4 + groupe de 3",
    description: "Deux suites de 4 + un groupe de 3",
    icon: "2️⃣×4️⃣➡️➕3️⃣🔗",
    requirements: { sequences: 2, groups: 1, minSequenceLength: 4 }
  },
  {
    id: 9,
    title: "Quatre groupes de 3",
    description: "Quatre groupes de 3 cartes",
    icon: "4️⃣×3️⃣🔗",
    requirements: { groups: 4 }
  },
  {
    id: 10,
    title: "Trois suites de 4",
    description: "Trois suites de 4 cartes",
    icon: "3️⃣×4️⃣➡️",
    requirements: { sequences: 3, minSequenceLength: 4 }
  },
  {
    id: 11,
    title: "Deux suites de 6",
    description: "Deux suites de 6 cartes",
    icon: "2️⃣×6️⃣➡️",
    requirements: { sequences: 2, minSequenceLength: 6 }
  },
  {
    id: 12,
    title: "Mission libre",
    description: "Choisir une mission déjà réussie",
    icon: "🆓✨",
    requirements: { specificRequirements: "free_choice" }
  },

  // 🆕 Missions inédites
  {
    id: 13,
    title: "Groupe de 4 + suite de 4",
    description: "Un groupe de 4 + une suite de 4",
    icon: "4️⃣🔗➕4️⃣➡️",
    requirements: { groups: 1, sequences: 1, minSequenceLength: 4, specificRequirements: "group_4_sequence_4" }
  },
  {
    id: 14,
    title: "Deux groupes de 4",
    description: "Deux groupes de 4 cartes",
    icon: "2️⃣×4️⃣🔗",
    requirements: { groups: 2, specificRequirements: "groups_of_4" }
  },
  {
    id: 15,
    title: "Suite de 5 + groupe de 3",
    description: "Une suite de 5 + un groupe de 3",
    icon: "5️⃣➡️➕3️⃣🔗",
    requirements: { sequences: 1, groups: 1, minSequenceLength: 5 }
  },
  {
    id: 16,
    title: "Suite de 8 (max 2 couleurs)",
    description: "Une suite de 8 cartes (maximum 2 couleurs)",
    icon: "8️⃣➡️*️⃣2️⃣🌈",
    requirements: { sequences: 1, minSequenceLength: 8, specificRequirements: "sequence_8_max_2_suits" }
  },
  {
    id: 17,
    title: "Deux groupes de 3 + groupe de 4",
    description: "Deux groupes de 3 + un groupe de 4",
    icon: "2️⃣×3️⃣🔗➕4️⃣🔗",
    requirements: { groups: 3, specificRequirements: "two_groups_3_one_group_4" }
  },
  {
    id: 18,
    title: "Trois suites de 3",
    description: "Trois suites de 3 cartes",
    icon: "3️⃣×3️⃣➡️",
    requirements: { sequences: 3, minSequenceLength: 3 }
  },
  {
    id: 19,
    title: "Suite de 9 cartes (A à 9)",
    description: "Suite de 9 cartes (A à 9), couleurs libres",
    icon: "🅰️➡️9️⃣",
    requirements: { specificRequirements: "sequence_A_to_9" }
  },
  {
    id: 20,
    title: "Sept cartes impaires",
    description: "Sept cartes impaires (A, 3, 5, 7, 9, J, K)",
    icon: "7️⃣🔢🎭",
    requirements: { specificRequirements: "seven_odd_cards" }
  },
  {
    id: 21,
    title: "Deux suites de 5, couleurs différentes",
    description: "Deux suites de 5, de couleurs différentes",
    icon: "2️⃣×5️⃣➡️🌈",
    requirements: { sequences: 2, minSequenceLength: 5, specificRequirements: "different_suits" }
  },
  {
    id: 23,
    title: "Trois groupes de 4 cartes",
    description: "Trois groupes de 4 cartes",
    icon: "3️⃣×4️⃣🔗",
    requirements: { groups: 3, specificRequirements: "three_groups_of_4" }
  },
  {
    id: 24,
    title: "Suite complète (A à K) d'une couleur",
    description: "Suite complète (A à K) d'une seule couleur",
    icon: "🅰️➡️👑🌈",
    requirements: { sequences: 1, minSequenceLength: 13, specificRequirements: "full_suit_A_to_K" }
  },

  // 🎨 Missions avec contrainte de couleur spécifique
  {
    id: 25,
    title: "Suite de 7-8-9-10 de cœur",
    description: "Suite de 7-8-9-10 de cœur (obligatoirement en ♥)",
    icon: "7️⃣8️⃣9️⃣🔟♥️",
    requirements: { sequences: 1, minSequenceLength: 4, specificRequirements: "hearts_7_8_9_10" }
  },
  {
    id: 26,
    title: "Deux suites de 4 : une en ♠ et une en ♣",
    description: "Deux suites de 4 : une en ♠ et une en ♣",
    icon: "4️⃣➡️♠️➕4️⃣➡️♣️",
    requirements: { sequences: 2, minSequenceLength: 4, specificRequirements: "spades_and_clubs_sequences" }
  },
  {
    id: 27,
    title: "Suite de 5 cartes rouges",
    description: "Suite de 5 cartes rouges (♥ ou ♦)",
    icon: "5️⃣➡️♥️♦️",
    requirements: { sequences: 1, minSequenceLength: 5, specificRequirements: "red_sequence_5" }
  },
  {
    id: 28,
    title: "Deux groupes de 3 : un rouge, un noir",
    description: "Deux groupes de 3 : un tout rouge, un tout noir",
    icon: "3️⃣🔗♥️/♦️➕3️⃣🔗♠️/♣️",
    requirements: { groups: 2, specificRequirements: "one_red_group_one_black_group" }
  },
  {
    id: 29,
    title: "Trois cartes identiques (♠ ♣ ♥)",
    description: "Trois cartes identiques mais une de chaque couleur (♠ ♣ ♥)",
    icon: "3️⃣🔗♠️♣️♥️",
    requirements: { groups: 1, specificRequirements: "three_suits_no_diamonds" }
  },
  {
    id: 30,
    title: "Suite paire de 6 cartes rouges",
    description: "Une suite paire de 6 cartes rouges (2 4 6 8 10 Q)",
    icon: "6️⃣➡️2️⃣4️⃣6️⃣🔟⚜️♥️/♦️",
    requirements: { specificRequirements: "red_even_sequence_6" }
  }
];
