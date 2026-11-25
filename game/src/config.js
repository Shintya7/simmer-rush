// config.js — every tunable number, colour and layout rect in Simmer Rush.
// One place to tune the kitchen: nothing else in the game hard-codes sizes,
// so the whole feel of the shift can be rebalanced from this file alone.
export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const SHIFT_SECONDS = 180;
export const PLAYER_SPEED = 285;
export const PLAYER_RADIUS = 18;
export const INTERACT_RANGE = 105;
export const CHOP_SECONDS = 1.4;
export const COOK_SECONDS = 7;
export const BURN_AFTER_SECONDS = 13;
export const MAX_PLATE_ITEMS = 5;
export const MAX_TICKETS = 4;
export const FIRST_TICKET_DELAY = 5;
export const TICKET_WARN_SECONDS = 12;

export const COLORS = {
  wall: '#f7e8c8',
  wallTrim: '#e8cf9e',
  floorA: '#d98e5f',
  floorB: '#cf7f52',
  counterTop: '#c98f4e',
  counterSide: '#8a5a2b',
  counterEdge: '#6e451f',
  hud: '#3a2417',
  hudText: '#ffe9b8',
  accent: '#e4572e',
  gold: '#f2b705',
  ticket: '#fff8e6',
  ticketEdge: '#d9b36c',
  danger: '#d7263d',
  ok: '#2e933c',
  board: '#e9c893',
  stove: '#4a4a52',
  metal: '#8d8d99',
};

// Every ingredient the kitchen stocks: its display name, what it needs before
// it can go on a plate, and the two colours its drawing is built from.
export const INGREDIENTS = {
  bun: { name: 'Bun', kind: 'ready', base: '#e8a95c', dark: '#b97a2e' },
  patty_raw: { name: 'Raw Patty', kind: 'cook', base: '#c96f6f', dark: '#8f3d3d' },
  patty: { name: 'Patty', kind: 'ready', base: '#7a4a21', dark: '#54300f' },
  patty_burnt: { name: 'Burnt Patty', kind: 'trash', base: '#2b2b2b', dark: '#111111' },
  cheese: { name: 'Cheese', kind: 'ready', base: '#f7c948', dark: '#d99e06' },
  tomato: { name: 'Tomato', kind: 'chop', base: '#e63946', dark: '#a4161a' },
  tomato_chopped: { name: 'Chopped Tomato', kind: 'ready', base: '#ef5350', dark: '#c62828' },
  lettuce: { name: 'Lettuce', kind: 'chop', base: '#6ab04c', dark: '#3d7a2e' },
  lettuce_chopped: { name: 'Chopped Lettuce', kind: 'ready', base: '#8bc34a', dark: '#558b2f' },
  onion: { name: 'Onion', kind: 'chop', base: '#b388eb', dark: '#7e57c2' },
  onion_chopped: { name: 'Chopped Onion', kind: 'ready', base: '#ce93d8', dark: '#8e24aa' },
};

export const CHOPPED_FORM = {
  tomato: 'tomato_chopped',
  lettuce: 'lettuce_chopped',
  onion: 'onion_chopped',
};

// The six ingredient bins along the top counter, by centre x.
export const BINS = [
  { id: 'bun', x: 100 },
  { id: 'patty_raw', x: 300 },
  { id: 'cheese', x: 500 },
  { id: 'tomato', x: 700 },
  { id: 'lettuce', x: 900 },
  { id: 'onion', x: 1100 },
];

// Solid station rectangles: the chef walks around them, never through them.
export const STATIONS = {
  counter: { x: 60, y: 228, w: 1160, h: 78 },
  board: { x: 60, y: 380, w: 200, h: 140 },
  stove: { x: 1020, y: 380, w: 200, h: 140 },
  plate: { x: 440, y: 640, w: 240, h: 120 },
  serve: { x: 960, y: 640, w: 260, h: 120 },
  trash: { x: 60, y: 640, w: 140, h: 120 },
};

// Where the chef stands to use each station (bin approach points are
// derived from BINS: directly below each bin, y = 332).
export const APPROACH = {
  board: { x: 285, y: 450 },
  stove: { x: 995, y: 450 },
  plate: { x: 560, y: 615 },
  serve: { x: 1090, y: 615 },
  trash: { x: 225, y: 700 },
};

export function binApproach(bin) {
  return { x: bin.x, y: 332 };
}

// The chef walks the open floor: below the top counter, above the bottom
// stations, with the middle of the kitchen free for crossing between them.
export const FLOOR = { x: 30, y: 318, w: 1220, h: 472 };
