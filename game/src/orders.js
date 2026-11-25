// orders.js — the order board: spawning tickets, their countdowns, serving
// a plate against a ticket, and the score, tip and combo a serve earns.
// Pressure grows with the shift: tickets arrive faster, live shorter, and
// the menu unlocks longer recipes as the clock runs down.
import { MAX_TICKETS, FIRST_TICKET_DELAY } from './config.js';
import { pickRecipe, recipeById, sameMultiset } from './recipes.js';
import { sfxNewTicket } from './audio.js';

let nextTicketId = 0;

export function createOrders() {
  return {
    tickets: [],
    spawnIn: FIRST_TICKET_DELAY,
    served: 0,
    missed: 0,
    tips: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
  };
}

export function spawnInterval(elapsedSeconds) {
  return Math.max(9, 18 - elapsedSeconds * 0.05);
}

export function ticketLifetime(elapsedSeconds) {
  return Math.max(50, 78 - elapsedSeconds * 0.15);
}

export function spawnTicket(orders, elapsedSeconds, random, recipeId = null) {
  if (orders.tickets.length >= MAX_TICKETS) return null;
  const recipe = recipeId ? recipeById(recipeId) : pickRecipe(elapsedSeconds, random);
  if (!recipe) return null;
  const lifetime = ticketLifetime(elapsedSeconds);
  const ticket = { id: ++nextTicketId, recipe, timeLeft: lifetime, total: lifetime };
  orders.tickets.push(ticket);
  sfxNewTicket();
  return ticket;
}

export function updateOrders(orders, dt, elapsedSeconds, random, onExpire) {
  orders.spawnIn -= dt;
  if (orders.spawnIn <= 0) {
    if (spawnTicket(orders, elapsedSeconds, random)) {
      orders.spawnIn = spawnInterval(elapsedSeconds);
    } else {
      orders.spawnIn = 3;
    }
  }
  for (let i = orders.tickets.length - 1; i >= 0; i--) {
    const ticket = orders.tickets[i];
    ticket.timeLeft -= dt;
    if (ticket.timeLeft <= 0) {
      orders.tickets.splice(i, 1);
      orders.missed += 1;
      orders.combo = 0;
      if (onExpire) onExpire(ticket);
    }
  }
}

// The ticket a plate answers, if any: an exact multiset match on its recipe.
// A plate that matches no ticket is a wrong dish, not a slow one.
export function ticketForPlate(orders, plateItems) {
  return orders.tickets.find((ticket) => sameMultiset(plateItems, ticket.recipe.needs)) ?? null;
}

export function serveTicket(orders, ticket) {
  const index = orders.tickets.indexOf(ticket);
  if (index === -1) return null;
  orders.tickets.splice(index, 1);
  const freshness = Math.max(0, ticket.timeLeft / ticket.total);
  const base = 100 + ticket.recipe.needs.length * 15;
  const tip = Math.round(freshness * 60);
  const comboBonus = orders.combo * 10;
  const points = base + tip + comboBonus;
  orders.score += points;
  orders.tips += tip;
  orders.served += 1;
  orders.combo += 1;
  orders.bestCombo = Math.max(orders.bestCombo, orders.combo);
  return { points, tip, combo: orders.combo, recipe: ticket.recipe, freshness };
}
