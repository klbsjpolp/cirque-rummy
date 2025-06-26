
import { Mission } from '../types/game';

export const MISSIONS: Mission[] = [
  {
    id: 1,
    title: "Deux groupes de 3",
    description: "Deux groupes de 3 cartes de même valeur",
    requirements: { groups: 2 }
  },
  {
    id: 2,
    title: "Suite de 4 + groupe de 3",
    description: "Une suite de 4 cartes + un groupe de 3",
    requirements: { sequences: 1, groups: 1, minSequenceLength: 4 }
  },
  {
    id: 3,
    title: "Deux suites de 4",
    description: "Deux suites de 4 cartes",
    requirements: { sequences: 2, minSequenceLength: 4 }
  },
  {
    id: 4,
    title: "Trois groupes de 3",
    description: "Trois groupes de 3 cartes",
    requirements: { groups: 3 }
  },
  {
    id: 5,
    title: "Suite de 4 + deux groupes de 3",
    description: "Une suite de 4 + deux groupes de 3",
    requirements: { sequences: 1, groups: 2, minSequenceLength: 4 }
  },
  {
    id: 6,
    title: "Suite de 7 même couleur",
    description: "Une suite de 7 cartes de la même couleur",
    requirements: { sequences: 1, minSequenceLength: 7, specificRequirements: "same_suit" }
  },
  {
    id: 7,
    title: "7 cartes même couleur",
    description: "7 cartes de la même couleur",
    requirements: { specificRequirements: "7_same_suit" }
  },
  {
    id: 8,
    title: "Deux suites de 4 + groupe de 3",
    description: "Deux suites de 4 + un groupe de 3",
    requirements: { sequences: 2, groups: 1, minSequenceLength: 4 }
  },
  {
    id: 9,
    title: "Quatre groupes de 3",
    description: "Quatre groupes de 3 cartes",
    requirements: { groups: 4 }
  },
  {
    id: 10,
    title: "Trois suites de 4",
    description: "Trois suites de 4 cartes",
    requirements: { sequences: 3, minSequenceLength: 4 }
  },
  {
    id: 11,
    title: "Deux suites de 6",
    description: "Deux suites de 6 cartes",
    requirements: { sequences: 2, minSequenceLength: 6 }
  },
  {
    id: 12,
    title: "Mission libre",
    description: "Choisir une mission déjà réussie",
    requirements: { specificRequirements: "free_choice" }
  }
];
