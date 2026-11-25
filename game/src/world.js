// world.js — the kitchen itself: the chef, the stations, what the chef
// holds, chopping, cooking, plating and serving. One update per frame, one
// action per key press, and a prompt that always says what E will do next.
import {
  BINS,
  CHOP_SECONDS,
  COOK_SECONDS,
  BURN_AFTER_SECONDS,
  INGREDIENTS,
  CHOPPED_FORM,
  INTERACT_RANGE,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  STATIONS,
  APPROACH,
  MAX_PLATE_ITEMS,
  FLOOR,
  binApproach,
} from './config.js';
import { ticketForPlate, serveTicket } from './orders.js';
import {
  sfxPickup,
  sfxPlace,
  sfxChop,
  sfxCookReady,
  sfxServe,
  sfxFail,
  sfxSizzle,
} from './audio.js';

const SOLID_RECTS = [
  STATIONS.counter,
  STATIONS.board,
  STATIONS.stove,
  STATIONS.plate,
  STATIONS.serve,
  STATIONS.trash,
];

export function createWorld() {
  return {
    player: {
      x: 640,
      y: 520,
      tx: null,
      ty: null,
      held: null,
      carryingPlate: false,
      face: 1,
      moving: false,
      chopAnim: 0,
    },
    plate: { items: [] },
    board: { item: null, progress: 0 },
    burners: [
      { item: null, progress: 0 },
      { item: null, progress: 0 },
    ],
    prompt: '',
    sizzleIn: 0,
    chopIn: 0,
  };
}

function hitsSolid(x, y) {
  const r = PLAYER_RADIUS - 2;
  for (const rect of SOLID_RECTS) {
    if (x > rect.x - r && x < rect.x + rect.w + r && y > rect.y - r && y < rect.y + rect.h + r) {
      return true;
    }
  }
  return false;
}

function movePlayer(world, dx, dy) {
  const p = world.player;
  const nx = Math.max(FLOOR.x, Math.min(FLOOR.x + FLOOR.w, p.x + dx));
  const ny = Math.max(FLOOR.y, Math.min(FLOOR.y + FLOOR.h, p.y + dy));
  if (!hitsSolid(nx, p.y)) p.x = nx;
  if (!hitsSolid(p.x, ny)) p.y = ny;
  if (dx !== 0) p.face = dx > 0 ? 1 : -1;
  p.moving = dx !== 0 || dy !== 0;
}

// The station the chef is close enough to use, with its approach point.
export function nearestStation(world) {
  const p = world.player;
  let best = null;
  let bestDist = INTERACT_RANGE;
  const consider = (id, point) => {
    const dist = Math.hypot(p.x - point.x, p.y - point.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  };
  for (const bin of BINS) consider(`bin:${bin.id}`, binApproach(bin));
  consider('board', APPROACH.board);
  consider('stove', APPROACH.stove);
  consider('plate', APPROACH.plate);
  consider('serve', APPROACH.serve);
  consider('trash', APPROACH.trash);
  return best;
}

function handsFree(world) {
  return world.player.held === null && !world.player.carryingPlate;
}

// What the prompt bubble says, and what E does, for the nearest station.
export function stationPrompt(world, orders) {
  const station = nearestStation(world);
  if (!station) return '';
  const p = world.player;
  if (station.startsWith('bin:')) {
    const id = station.slice(4);
    if (!handsFree(world)) return 'Hands full';
    return `E — Grab ${INGREDIENTS[id].name}`;
  }
  if (station === 'board') {
    if (world.board.item) {
      const def = INGREDIENTS[world.board.item];
      if (def.kind === 'chop') return 'Hold E — Chop';
      return `E — Take ${def.name}`;
    }
    if (p.held && p.held.kind === 'ingredient' && INGREDIENTS[p.held.id].kind === 'chop') {
      return `E — Place ${INGREDIENTS[p.held.id].name} on board`;
    }
    return 'Chopping board';
  }
  if (station === 'stove') {
    const free = world.burners.find((b) => b.item === null);
    const ready = world.burners.find((b) => b.item === 'patty' || b.item === 'patty_burnt');
    if (p.held && p.held.kind === 'ingredient' && p.held.id === 'patty_raw' && free) {
      return 'E — Start cooking patty';
    }
    if (ready && !p.held) return `E — Take ${INGREDIENTS[ready.item].name}`;
    if (world.burners.some((b) => b.item === 'patty_raw')) return 'Patty cooking…';
    return 'Stove';
  }
  if (station === 'plate') {
    if (p.carryingPlate) return 'E — Set plate down';
    if (p.held && p.held.kind === 'ingredient') return `E — Add ${INGREDIENTS[p.held.id].name} to plate`;
    if (world.plate.items.length > 0) return 'E — Pick up plate';
    return 'Plating station';
  }
  if (station === 'serve') {
    if (p.carryingPlate) {
      const ticket = ticketForPlate(orders, world.plate.items);
      return ticket ? `E — Serve ${ticket.recipe.name}` : 'E — Serve (no ticket wants this)';
    }
    return 'Serving window';
  }
  if (station === 'trash') {
    if (p.held) return `E — Toss ${INGREDIENTS[p.held.id].name}`;
    if (p.carryingPlate) return 'E — Toss plate';
    return 'Bin';
  }
  return '';
}

export function interact(world, orders, hooks) {
  const station = nearestStation(world);
  if (!station) return;
  const p = world.player;

  if (station.startsWith('bin:')) {
    if (!handsFree(world)) return;
    p.held = { kind: 'ingredient', id: station.slice(4) };
    sfxPickup();
    return;
  }

  if (station === 'board') {
    // A raw ingredient on the board is chopped by holding E, never picked
    // back up: the same press that starts chopping must not grab it away.
    // Only a finished, chopped item can be taken off the board.
    if (!world.board.item && p.held && p.held.kind === 'ingredient' && INGREDIENTS[p.held.id].kind === 'chop') {
      world.board.item = p.held.id;
      world.board.progress = 0;
      p.held = null;
      sfxPlace();
    } else if (world.board.item && !p.held && INGREDIENTS[world.board.item].kind === 'ready') {
      p.held = { kind: 'ingredient', id: world.board.item };
      world.board.item = null;
      world.board.progress = 0;
      sfxPickup();
    }
    return;
  }

  if (station === 'stove') {
    if (p.held && p.held.kind === 'ingredient' && p.held.id === 'patty_raw') {
      const free = world.burners.find((b) => b.item === null);
      if (free) {
        free.item = 'patty_raw';
        free.progress = 0;
        p.held = null;
        sfxPlace();
      }
      return;
    }
    if (!p.held) {
      const ready = world.burners.find((b) => b.item === 'patty' || b.item === 'patty_burnt');
      if (ready) {
        p.held = { kind: 'ingredient', id: ready.item };
        ready.item = null;
        ready.progress = 0;
        sfxPickup();
      }
    }
    return;
  }

  if (station === 'plate') {
    if (p.carryingPlate) {
      p.carryingPlate = false;
      sfxPlace();
    } else if (p.held && p.held.kind === 'ingredient' && world.plate.items.length < MAX_PLATE_ITEMS) {
      world.plate.items.push(p.held.id);
      p.held = null;
      sfxPlace();
    } else if (!p.held && world.plate.items.length > 0) {
      p.carryingPlate = true;
      sfxPickup();
    }
    return;
  }

  if (station === 'serve') {
    if (!p.carryingPlate) return;
    const ticket = ticketForPlate(orders, world.plate.items);
    if (ticket) {
      const result = serveTicket(orders, ticket);
      world.plate.items = [];
      p.carryingPlate = false;
      sfxServe();
      if (hooks.onServe) hooks.onServe(result);
    } else {
      world.plate.items = [];
      p.carryingPlate = false;
      sfxFail();
      if (hooks.onFail) hooks.onFail('No ticket wants that dish — plate tossed');
    }
    return;
  }

  if (station === 'trash') {
    if (p.held) {
      p.held = null;
      sfxPlace();
    } else if (p.carryingPlate) {
      world.plate.items = [];
      p.carryingPlate = false;
      sfxPlace();
    }
  }
}

export function updateWorld(world, orders, input, dt, hooks) {
  const p = world.player;

  // Movement: keys win over a click target; arriving clears the target.
  const { dx, dy } = input.axis();
  if (dx !== 0 || dy !== 0) {
    p.tx = null;
    p.ty = null;
    movePlayer(world, dx * PLAYER_SPEED * dt, dy * PLAYER_SPEED * dt);
  } else if (p.tx !== null && p.ty !== null) {
    const distX = p.tx - p.x;
    const distY = p.ty - p.y;
    const dist = Math.hypot(distX, distY);
    if (dist < 8) {
      p.tx = null;
      p.ty = null;
      p.moving = false;
    } else {
      movePlayer(world, (distX / dist) * PLAYER_SPEED * dt, (distY / dist) * PLAYER_SPEED * dt);
    }
  } else {
    p.moving = false;
  }
  if (input.clickTarget) {
    p.tx = input.clickTarget.x;
    p.ty = input.clickTarget.y;
    input.clickTarget = null;
  }

  // Hold E at the board to chop: progress ticks, the knife taps, and the
  // ingredient comes out chopped when the ring fills.
  const nearBoard = nearestStation(world) === 'board';
  if (input.interactHeld() && nearBoard && world.board.item && INGREDIENTS[world.board.item].kind === 'chop') {
    world.board.progress += dt / CHOP_SECONDS;
    world.chopAnim += dt * 14;
    world.chopIn -= dt;
    if (world.chopIn <= 0) {
      world.chopIn = 0.28;
      sfxChop();
    }
    if (world.board.progress >= 1) {
      world.board.item = CHOPPED_FORM[world.board.item];
      world.board.progress = 0;
      sfxPlace();
    }
  } else {
    world.chopAnim = 0;
  }

  // The stove: a raw patty cooks, then must be grabbed before it burns.
  let cooking = false;
  for (const burner of world.burners) {
    if (!burner.item) continue;
    burner.progress += dt;
    if (burner.item === 'patty_raw') {
      cooking = true;
      if (burner.progress >= COOK_SECONDS) {
        burner.item = 'patty';
        sfxCookReady();
        if (hooks.onCookReady) hooks.onCookReady();
      }
    } else if (burner.item === 'patty' && burner.progress >= BURN_AFTER_SECONDS) {
      burner.item = 'patty_burnt';
      if (hooks.onBurnt) hooks.onBurnt();
    }
  }
  if (cooking) {
    world.sizzleIn -= dt;
    if (world.sizzleIn <= 0) {
      world.sizzleIn = 0.22;
      sfxSizzle();
    }
  }

  // Toss what is held, Q: a quick way to clear a mistake.
  if (input.consumePressed('KeyQ')) {
    if (p.held) {
      p.held = null;
      sfxPlace();
    } else if (p.carryingPlate) {
      world.plate.items = [];
      p.carryingPlate = false;
      sfxPlace();
    }
  }

  if (input.consumePressed('KeyE') || input.consumePressed('Space')) {
    interact(world, orders, hooks);
  }

  world.prompt = stationPrompt(world, orders);
}
