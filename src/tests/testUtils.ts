import {CardSuit, CardValue, JokerCard, NormalCard} from "@/types/game.ts";


export const createCard = (value: CardValue, suit: CardSuit): NormalCard => ({
  id: `${value}-${suit}`,
  value,
  suit
})

export const createJokerCard = (): JokerCard => ({
  id: `joker-${Math.random()}`,
  isJoker: true
})
