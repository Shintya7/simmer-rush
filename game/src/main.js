// main.js — Simmer Rush's loop: screens, the shift clock, input wiring and
// the staged kitchen states the screenshots are taken from. Boots from
// index.html. The whole game is plain modules under src/, no build step.
import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, STATIONS } from './config.js';
import { createInput } from './input.js';
import { createOrders, updateOrders, spawnTicket } from './orders.js';
import { createWorld, updateWorld } from './world.js';
import { drawGame } from './render.js';
import { unlockAudio, sfxClick, sfxFail, sfxStart, sfxTick } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  screen: 'title',
  elapsed: 0,
  timeLeft: SHIFT_SECONDS,
  world: createWorld(),
  orders: createOrders(),
  popups: [],
  last: 0,
  lastTickSecond: -1,
};

const input = createInput(canvas);

function popup(x, y, text, color) {
  state.popups.push({ x, y, text, color, life: 1.6 });
}

function startGame() {
  state.world = createWorld();
  state.orders = createOrders();
  state.elapsed = 0;
  state.timeLeft = SHIFT_SECONDS;
  state.popups = [];
  state.lastTickSecond = -1;
  state.screen = 'playing';
  sfxStart();
}

// A kitchen mid-rush, built from the same pieces real play uses: tickets on
// the board, a dish half-built on the plate, something on the stove. The
// title screen shows it behind its panel; the screenshot stages start from it.
function setupKitchenScene() {
  state.world = createWorld();
  state.orders = createOrders();
  state.elapsed = 40;
  state.timeLeft = 140;
  const sunny = spawnTicket(state.orders, 40, Math.random, 'sunny');
  if (sunny) sunny.timeLeft = 45;
  const garden = spawnTicket(state.orders, 40, Math.random, 'garden');
  if (garden) garden.timeLeft = 62;
  state.world.plate.items = ['bun', 'patty'];
  state.world.player.x = 560;
  state.world.player.y = 540;
  state.world.player.held = { kind: 'ingredient', id: 'cheese' };
  state.world.burners[0].item = 'patty_raw';
  state.world.burners[0].progress = 4;
  state.world.board.item = 'tomato';
  state.world.board.progress = 0.5;
  state.orders.score = 120;
  state.orders.served = 1;
  state.orders.combo = 1;
  state.orders.bestCombo = 1;
}

function setupStage(stage) {
  setupKitchenScene();
  if (stage === 'serve') {
    // A finished plate in hand, in front of the serving window, with the
    // ticket it answers still on the board and the score already counting.
    state.world.plate.items = ['bun', 'patty', 'cheese'];
    state.world.player.carryingPlate = true;
    state.world.player.held = null;
    state.world.player.x = 1010;
    state.world.player.y = 600;
    state.world.burners[0].item = null;
    state.world.burners[0].progress = 0;
    state.world.board.item = null;
    state.world.board.progress = 0;
    const sunny = state.orders.tickets.find((t) => t.recipe.id === 'sunny');
    if (sunny) sunny.timeLeft = 50;
    state.orders.score = 340;
    state.orders.served = 2;
    state.orders.combo = 2;
    state.orders.bestCombo = 2;
    state.elapsed = 65;
    state.timeLeft = 115;
  }
  state.screen = 'playing';
}

const hooks = {
  // Serve and expiry news goes to the middle of the open floor, where no
  // station and no chef ever stands in front of it.
  onServe(result) {
    popup(640, 340, `Served! +${result.points}`, '#2e933c');
    if (result.combo > 1) {
      popup(640, 312, `Combo x${result.combo}!`, '#f2b705');
    }
  },
  onFail(message) {
    popup(640, 340, message, '#d7263d');
  },
  onExpire(ticket) {
    popup(640, 340, `"${ticket.recipe.name}" walked out!`, '#d7263d');
    sfxFail();
  },
  onCookReady() {
    popup(STATIONS.stove.x + 100, STATIONS.stove.y - 16, 'Patty ready!', '#2e933c');
  },
  onBurnt() {
    popup(STATIONS.stove.x + 100, STATIONS.stove.y - 16, 'Burnt! Toss it.', '#d7263d');
  },
};

function update(dt) {
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  updateWorld(state.world, state.orders, input, dt, hooks);
  updateOrders(state.orders, dt, state.elapsed, Math.random, hooks.onExpire);

  // A ticket under 12 seconds ticks every whole second, so the rush is heard.
  const urgent = state.orders.tickets.some((t) => t.timeLeft <= 12 && t.timeLeft > 0);
  const wholeSecond = Math.ceil(state.timeLeft);
  if (urgent && wholeSecond !== state.lastTickSecond) {
    state.lastTickSecond = wholeSecond;
    sfxTick();
  }

  for (let i = state.popups.length - 1; i >= 0; i--) {
    const p = state.popups[i];
    p.life -= dt;
    p.y -= dt * 34;
    if (p.life <= 0) state.popups.splice(i, 1);
  }

  if (state.timeLeft <= 0) {
    state.screen = 'over';
    sfxFail();
  }
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!state.last) state.last = timestamp;
  const dt = Math.min(0.05, (timestamp - state.last) / 1000);
  state.last = timestamp;

  if (state.screen === 'title') {
    if (input.consumePressed('Enter') || input.consumePressed('Space') || input.consumeClick()) {
      unlockAudio();
      sfxClick();
      startGame();
    }
  } else if (state.screen === 'playing') {
    if (input.consumePressed('KeyP') || input.consumePressed('Escape')) {
      state.screen = 'paused';
      input.clearPressed();
    } else {
      update(dt);
    }
  } else if (state.screen === 'paused') {
    if (input.consumePressed('KeyP') || input.consumePressed('Escape') || input.consumePressed('Enter')) {
      state.screen = 'playing';
      input.clearPressed();
    }
  } else if (state.screen === 'over') {
    if (input.consumePressed('Enter') || input.consumeClick()) {
      unlockAudio();
      startGame();
    }
  }

  drawGame(ctx, state);
}

// First gesture unlocks sound; the game itself never needs a click to start
// drawing, so the title screen is alive from the first paint.
window.addEventListener('keydown', unlockAudio, { once: false });
window.addEventListener('pointerdown', unlockAudio, { once: false });

const stage = new URLSearchParams(window.location.search).get('stage');
setupKitchenScene();
if (stage === 'play' || stage === 'serve') {
  setupStage(stage);
}
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// Handle for the play-test and the screenshots: state, starting a game, and
// staging a kitchen. Nothing here changes how the game plays.
window.__simmer = { state, startGame, setupStage };
requestAnimationFrame(frame);
