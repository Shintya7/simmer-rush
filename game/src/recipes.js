// recipes.js — the dishes on Simmer Rush's menu: what each one needs, when
// it unlocks during the shift, and how a plate is matched against a ticket.
// Every recipe is an original name; nothing here is borrowed from another game.
import { INGREDIENTS } from './config.js';

export const RECIPES = [
  { id: 'sunny', name: 'Sunny Stack', needs: ['bun', 'patty', 'cheese'], unlock: 0 },
  { id: 'garden', name: 'Garden Melt', needs: ['bun', 'tomato_chopped', 'lettuce_chopped', 'cheese'], unlock: 0 },
  { id: 'ember', name: 'Ember Stack', needs: ['bun', 'patty', 'onion_chopped', 'cheese'], unlock: 30 },
  { id: 'green', name: 'Green Garden', needs: ['bun', 'lettuce_chopped', 'tomato_chopped', 'onion_chopped'], unlock: 45 },
  { id: 'sunrise', name: 'Sunrise Melt', needs: ['bun', 'patty', 'tomato_chopped', 'cheese'], unlock: 75 },
  { id: 'double', name: 'Double Ember', needs: ['bun', 'patty', 'patty', 'cheese'], unlock: 105 },
];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id) ?? null;
}

export function unlockedRecipes(elapsedSeconds) {
  return RECIPES.filter((recipe) => elapsedSeconds >= recipe.unlock);
}

export function pickRecipe(elapsedSeconds, random) {
  const pool = unlockedRecipes(elapsedSeconds);
  return pool[Math.floor(random() * pool.length)];
}

export function ingredientName(id) {
  return INGREDIENTS[id] ? INGREDIENTS[id].name : id;
}

// Order-insensitive comparison: a plate matches a recipe when it holds
// exactly the same ingredients, however they were stacked.
export function sameMultiset(left, right) {
  if (left.length !== right.length) return false;
  const counts = new Map();
  for (const item of left) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of right) {
    const remaining = counts.get(item) ?? 0;
    if (remaining === 0) return false;
    counts.set(item, remaining - 1);
  }
  return true;
}

export function findMatchingRecipe(plateItems) {
  return RECIPES.find((recipe) => sameMultiset(plateItems, recipe.needs)) ?? null;
}

export function recipeNeedsNames(recipe) {
  return recipe.needs.map(ingredientName);
}

// A plate is servable only when it matches a real ticket's recipe exactly:
// too few, too many or the wrong ingredients all count as the wrong dish.
export function plateMatchesAnyTicket(plateItems) {
  return findMatchingRecipe(plateItems) !== null;
}
