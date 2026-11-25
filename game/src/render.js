// render.js — every pixel of Simmer Rush: the kitchen, the order board, the
// chef, the food, the HUD and the title / pause / end screens. Canvas 2D
// only, drawn shapes on a warm palette; no images, no fonts to load.
import {
  CANVAS_W,
  CANVAS_H,
  COLORS,
  STATIONS,
  BINS,
  INGREDIENTS,
  TICKET_WARN_SECONDS,
  MAX_TICKETS,
} from './config.js';
import { ingredientName } from './recipes.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn from shapes at (x, y) with radius s. The same
// drawing is used on the counter, on tickets, on the plate and in hand,
// so a dish always reads the same wherever it sits.
export function drawIngredient(ctx, id, x, y, s) {
  const def = INGREDIENTS[id];
  if (!def) return;
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'bun': {
      ctx.fillStyle = def.base;
      ctx.beginPath();
      ctx.arc(0, 0, s, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.dark;
      ctx.fillRect(-s, 0, s * 2, s * 0.45);
      ctx.fillStyle = '#fff3d6';
      for (const [dx, dy] of [[-s * 0.4, -s * 0.45], [0, -s * 0.6], [s * 0.4, -s * 0.45]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty_raw':
    case 'patty':
    case 'patty_burnt': {
      ctx.fillStyle = def.base;
      roundRect(ctx, -s, -s * 0.55, s * 2, s * 1.1, s * 0.4);
      ctx.fill();
      if (id === 'patty') {
        ctx.strokeStyle = def.dark;
        ctx.lineWidth = Math.max(1.5, s * 0.12);
        for (const dx of [-s * 0.5, 0, s * 0.5]) {
          ctx.beginPath();
          ctx.moveTo(dx, -s * 0.4);
          ctx.lineTo(dx, s * 0.4);
          ctx.stroke();
        }
      }
      if (id === 'patty_burnt') {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = Math.max(1.5, s * 0.1);
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.9);
        ctx.quadraticCurveTo(-s * 0.7, -s * 1.4, -s * 0.4, -s * 1.7);
        ctx.moveTo(s * 0.4, -s * 0.9);
        ctx.quadraticCurveTo(s * 0.6, -s * 1.4, s * 0.3, -s * 1.7);
        ctx.stroke();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = def.base;
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.6);
      ctx.lineTo(s, s * 0.6);
      ctx.lineTo(0, -s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.dark;
      for (const [dx, dy] of [[-s * 0.3, s * 0.2], [s * 0.25, s * 0.3], [0, -s * 0.2]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'tomato': {
      ctx.fillStyle = def.base;
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.dark;
      ctx.beginPath();
      ctx.arc(-s * 0.25, -s * 0.15, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = Math.max(2, s * 0.14);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(0, -s * 1.05);
      ctx.stroke();
      break;
    }
    case 'tomato_chopped': {
      ctx.fillStyle = def.base;
      for (const dx of [-s * 0.45, s * 0.45]) {
        ctx.beginPath();
        ctx.arc(dx, 0, s * 0.55, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ff8a80';
      ctx.fillRect(-s * 0.9, -s * 0.1, s * 1.8, s * 0.18);
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = def.base;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.45, s * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = def.dark;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lettuce_chopped': {
      ctx.strokeStyle = def.base;
      ctx.lineWidth = s * 0.32;
      ctx.lineCap = 'round';
      for (const dy of [-s * 0.55, 0, s * 0.55]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, dy);
        ctx.lineTo(s * 0.8, dy);
        ctx.stroke();
      }
      break;
    }
    case 'onion': {
      ctx.fillStyle = '#f3e5f5';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = def.base;
      ctx.lineWidth = Math.max(2, s * 0.16);
      for (const r of [0.7, 0.45, 0.22]) {
        ctx.beginPath();
        ctx.arc(0, 0, s * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'onion_chopped': {
      ctx.strokeStyle = def.base;
      ctx.lineWidth = Math.max(2, s * 0.14);
      for (const [dx, dy] of [[-s * 0.4, -s * 0.3], [s * 0.4, -s * 0.2], [0, s * 0.45]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, s * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawFloorAndWall(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, 210);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 204, CANVAS_W, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let x = 0; x < CANVAS_W; x += 90) {
    ctx.fillRect(x, 0, 2, 204);
  }
  for (let y = 210; y < CANVAS_H; y += 56) {
    for (let x = 0; x < CANVAS_W; x += 56) {
      const odd = ((x / 56 + y / 56) % 2 + 2) % 2 === 0;
      ctx.fillStyle = odd ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, 56, 56);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 210, CANVAS_W, 4);
}

function drawCounter(ctx) {
  const c = STATIONS.counter;
  ctx.fillStyle = COLORS.counterSide;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(c.x, c.y, c.w, 26);
  ctx.fillStyle = COLORS.counterEdge;
  ctx.fillRect(c.x, c.y + 24, c.w, 4);
  for (const bin of BINS) {
    const bx = bin.x - 70;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, bx + 4, 238, 132, 60, 10);
    ctx.fill();
    ctx.fillStyle = '#f3e2b8';
    roundRect(ctx, bx, 234, 132, 60, 10);
    ctx.fill();
    drawIngredient(ctx, bin.id, bin.x, 258, 17);
    text(ctx, INGREDIENTS[bin.id].name.toUpperCase(), bin.x, 286, 12, '#5a3a1a', 'center');
  }
}

function drawBoard(ctx, world) {
  const b = STATIONS.board;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, b.x + 4, b.y + 6, b.w, b.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#b98d4f';
  ctx.lineWidth = 3;
  roundRect(ctx, b.x + 10, b.y + 10, b.w - 20, b.h - 20, 8);
  ctx.stroke();
  text(ctx, 'CHOP', b.x + b.w / 2, b.y + 24, 14, '#8a6a35', 'center');
  if (world.board.item) {
    drawIngredient(ctx, world.board.item, b.x + b.w / 2, b.y + 78, 30);
    if (world.board.progress > 0) {
      const cx = b.x + b.w / 2;
      const cy = b.y + 78;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(cx, cy, 42, -Math.PI / 2, -Math.PI / 2 + world.board.progress * Math.PI * 2);
      ctx.stroke();
    }
    // The knife taps while chopping: it bobs above the board.
    if (world.chopAnim > 0) {
      const bob = Math.abs(Math.sin(world.chopAnim)) * 10;
      ctx.fillStyle = '#cfd8dc';
      ctx.save();
      ctx.translate(b.x + b.w / 2 + 44, b.y + 60 - bob);
      ctx.rotate(0.5);
      ctx.fillRect(-4, -16, 8, 32);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-4, 14, 8, 12);
      ctx.restore();
    }
  }
}

function drawStove(ctx, world) {
  const s = STATIONS.stove;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, s.x + 4, s.y + 6, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.stove;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  text(ctx, 'STOVE', s.x + s.w / 2, s.y + 22, 14, '#cfd8dc', 'center');
  const burnerCenters = [
    { x: s.x + 52, y: s.y + 82 },
    { x: s.x + 148, y: s.y + 82 },
  ];
  world.burners.forEach((burner, i) => {
    const c = burnerCenters[i];
    ctx.fillStyle = '#22222a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.metal;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 36, 0, Math.PI * 2);
    ctx.stroke();
    if (burner.item) {
      const cooking = burner.item === 'patty_raw';
      const done = burner.item === 'patty';
      const burnt = burner.item === 'patty_burnt';
      if (cooking) {
        // Flame licks under a cooking patty.
        ctx.fillStyle = `rgba(255,${140 + Math.floor(Math.random() * 60)},30,0.85)`;
        ctx.beginPath();
        ctx.arc(c.x, c.y + 8, 26, 0, Math.PI);
        ctx.fill();
      }
      drawIngredient(ctx, burner.item, c.x, c.y - 2, 24);
      const frac = burner.item === 'patty_raw' ? burner.progress / 7 : 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = done ? COLORS.ok : burnt ? COLORS.danger : COLORS.gold;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.min(1, frac) * Math.PI * 2);
      ctx.stroke();
      if (done) text(ctx, 'READY', c.x, c.y + 56, 12, COLORS.ok, 'center');
      if (burnt) text(ctx, 'BURNT!', c.x, c.y + 56, 12, COLORS.danger, 'center');
    }
  });
}

function drawPlateStation(ctx, world) {
  const st = STATIONS.plate;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, st.x + 4, st.y + 6, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterSide;
  roundRect(ctx, st.x, st.y, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, st.x, st.y, st.w, 26, 12);
  ctx.fill();
  text(ctx, 'PLATE', st.x + st.w / 2, st.y + 13, 13, '#5a3a1a', 'center');
  if (!world.player.carryingPlate) {
    const cx = st.x + st.w / 2;
    const cy = st.y + 74;
    ctx.fillStyle = '#fdfdfd';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 74, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 74, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    world.plate.items.forEach((item, i) => {
      drawIngredient(ctx, item, cx + (i - (world.plate.items.length - 1) / 2) * 34, cy - 4, 15);
    });
  }
}

function drawServeWindow(ctx) {
  const st = STATIONS.serve;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, st.x + 4, st.y + 6, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = '#7a4a21';
  roundRect(ctx, st.x, st.y, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  roundRect(ctx, st.x + 12, st.y + 12, st.w - 24, st.h - 50, 8);
  ctx.fill();
  ctx.fillStyle = '#ffecb3';
  ctx.fillRect(st.x + 12, st.y + 12, st.w - 24, 10);
  text(ctx, 'SERVE', st.x + st.w / 2, st.y + 34, 20, '#7a4a21', 'center');
  text(ctx, 'ring the bell, dish goes out', st.x + st.w / 2, st.y + 58, 12, '#7a4a21', 'center');
  // The service bell on the counter.
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.arc(st.x + st.w / 2, st.y + st.h - 18, 16, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(st.x + st.w / 2 - 16, st.y + st.h - 18, 32, 5);
}

function drawTrash(ctx) {
  const st = STATIONS.trash;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, st.x + 4, st.y + 6, st.w, st.h, 12);
  ctx.fill();
  ctx.fillStyle = '#78909c';
  roundRect(ctx, st.x + 30, st.y + 18, st.w - 60, st.h - 30, 10);
  ctx.fill();
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(st.x + 22, st.y + 10, st.w - 44, 12);
  text(ctx, 'BIN', st.x + st.w / 2, st.y + st.h - 16, 13, '#eceff1', 'center');
}

function drawTickets(ctx, orders, nowSeconds) {
  text(ctx, 'ORDER BOARD', 24, 66, 13, '#5a3a1a');
  for (let i = 0; i < MAX_TICKETS; i++) {
    const x = 24 + i * 228;
    const y = 72;
    const ticket = orders.tickets[i];
    if (!ticket) {
      ctx.strokeStyle = 'rgba(90,58,26,0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      roundRect(ctx, x, y, 216, 96, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for an order…', x + 108, y + 48, 13, 'rgba(90,58,26,0.55)', 'center', 'normal');
      continue;
    }
    const frac = Math.max(0, ticket.timeLeft / ticket.total);
    const urgent = ticket.timeLeft <= TICKET_WARN_SECONDS;
    const pulse = urgent ? 1 + Math.sin(nowSeconds * 8) * 0.04 : 1;
    ctx.save();
    ctx.translate(x + 108, y + 48);
    ctx.scale(pulse, pulse);
    ctx.translate(-108, -48);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    roundRect(ctx, x + 3, y + 4, 216, 96, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.ticket;
    roundRect(ctx, x, y, 216, 96, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? COLORS.danger : COLORS.ticketEdge;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, 216, 96, 10);
    ctx.stroke();
    text(ctx, ticket.recipe.name.toUpperCase(), x + 12, y + 18, 15, '#3a2417');
    const secs = Math.ceil(ticket.timeLeft);
    text(ctx, `${secs}s`, x + 204, y + 18, 15, urgent ? COLORS.danger : '#3a2417', 'right');
    // Countdown bar: the ticket's remaining life, readable at a glance.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    roundRect(ctx, x + 12, y + 32, 192, 8, 4);
    ctx.fill();
    ctx.fillStyle = urgent ? COLORS.danger : frac > 0.5 ? COLORS.ok : COLORS.gold;
    if (frac > 0) {
      roundRect(ctx, x + 12, y + 32, 192 * frac, 8, 4);
      ctx.fill();
    }
    ticket.recipe.needs.forEach((id, j) => {
      drawIngredient(ctx, id, x + 28 + j * 36, y + 66, 14);
    });
    text(ctx, `${ticket.recipe.needs.length} items`, x + 204, y + 66, 12, '#8a6a35', 'right', 'normal');
    ctx.restore();
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 26, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = p.moving ? Math.sin(performance.now() / 90) * 2 : 0;
  const cy = p.y + bob;
  // Body: white apron over a warm shirt.
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, p.x - 17, cy - 4, 34, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#fdfdfd';
  roundRect(ctx, p.x - 12, cy - 2, 24, 26, 8);
  ctx.fill();
  // Head and chef's hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(p.x, cy - 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x - 9, cy - 28, 8, 0, Math.PI * 2);
  ctx.arc(p.x, cy - 31, 9, 0, Math.PI * 2);
  ctx.arc(p.x + 9, cy - 28, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(p.x - 12, cy - 28, 24, 6);
  ctx.fillStyle = '#3a2417';
  ctx.beginPath();
  ctx.arc(p.x - 5 + p.face * 2, cy - 17, 1.8, 0, Math.PI * 2);
  ctx.arc(p.x + 5 + p.face * 2, cy - 17, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2417';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x + p.face * 2, cy - 11, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // What the chef carries: an ingredient above the hat, or the whole plate.
  if (p.carryingPlate) {
    const px = p.x;
    const py = cy - 52;
    ctx.fillStyle = '#fdfdfd';
    ctx.beginPath();
    ctx.ellipse(px, py, 30, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, py, 30, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    world.plate.items.forEach((item, i) => {
      drawIngredient(ctx, item, px + (i - (world.plate.items.length - 1) / 2) * 16, py - 6, 8);
    });
  } else if (p.held) {
    drawIngredient(ctx, p.held.id, p.x, cy - 50 + Math.sin(performance.now() / 300) * 2, 15);
  }

  // The prompt bubble: always says what E will do where the chef stands.
  if (world.prompt) {
    ctx.font = 'bold 14px Trebuchet MS, Verdana, sans-serif';
    const w = ctx.measureText(world.prompt).width + 20;
    const bx = Math.max(8, Math.min(CANVAS_W - w - 8, p.x - w / 2));
    const by = cy - 88;
    ctx.fillStyle = 'rgba(58,36,23,0.92)';
    roundRect(ctx, bx, by, w, 26, 13);
    ctx.fill();
    text(ctx, world.prompt, bx + w / 2, by + 13, 14, '#ffe9b8', 'center');
  }
}

function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawHUD(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_W, 56);
  text(ctx, 'SIMMER RUSH', 24, 29, 22, COLORS.hudText);
  const low = state.timeLeft <= 30 && state.screen === 'playing';
  const pulse = low ? 1 + Math.sin(performance.now() / 120) * 0.08 : 1;
  ctx.save();
  ctx.translate(CANVAS_W / 2, 29);
  ctx.scale(pulse, pulse);
  text(ctx, formatClock(state.timeLeft), 0, 0, 26, low ? '#ff6b6b' : COLORS.hudText, 'center');
  ctx.restore();
  text(ctx, 'SHIFT', CANVAS_W / 2, 12, 10, 'rgba(255,233,184,0.6)', 'center', 'normal');
  const right = `Score ${state.orders.score}    Combo x${state.orders.combo}    Served ${state.orders.served}`;
  text(ctx, right, CANVAS_W - 24, 29, 18, COLORS.hudText, 'right');
}

function drawPopups(ctx, state) {
  for (const popup of state.popups) {
    const alpha = Math.max(0, Math.min(1, popup.life / 0.6));
    ctx.globalAlpha = alpha;
    text(ctx, popup.text, popup.x, popup.y, 20, popup.color, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(30,15,5,0.42)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x + 5, y + 6, w, h, 18);
  ctx.fill();
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.ticketEdge;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawTitleScreen(ctx, state) {
  drawPanel(ctx, 290, 130, 700, 540);
  text(ctx, 'SIMMER RUSH', 640, 200, 56, '#e4572e', 'center');
  text(ctx, 'A three-minute dinner rush in a tiny kitchen', 640, 248, 19, '#5a3a1a', 'center', 'normal');
  const lines = [
    'WASD / arrows or click — move the chef',
    'E — grab, chop (hold E), cook, plate, serve',
    'Q — toss what you hold      P — pause',
    'Serve the exact dish before its ticket runs out.',
    'Fast serves earn tips. Serves in a row build a combo.',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 300 + i * 30, 17, '#3a2417', 'center', 'normal'));
  text(ctx, 'On the menu tonight:', 640, 478, 16, '#8a6a35', 'center');
  const menu = ['Sunny Stack', 'Garden Melt', 'Ember Stack', 'Green Garden', 'Sunrise Melt', 'Double Ember'];
  menu.forEach((name, i) => {
    const mx = 360 + (i % 3) * 190;
    const my = 512 + Math.floor(i / 3) * 30;
    text(ctx, `· ${name}`, mx, my, 15, '#3a2417', 'left', 'normal');
  });
  const blink = Math.sin(performance.now() / 350) > -0.2;
  if (blink) text(ctx, 'Press ENTER or click to start', 640, 622, 22, '#e4572e', 'center');
}

function drawPauseScreen(ctx) {
  drawPanel(ctx, 440, 300, 400, 160);
  text(ctx, 'PAUSED', 640, 352, 40, '#3a2417', 'center');
  text(ctx, 'Press P to get back to the pass', 640, 408, 17, '#5a3a1a', 'center', 'normal');
}

function drawEndScreen(ctx, state) {
  drawPanel(ctx, 390, 170, 500, 440);
  text(ctx, 'SHIFT OVER!', 640, 240, 44, '#e4572e', 'center');
  text(ctx, 'The kitchen is closed. Here is how the rush went:', 640, 286, 17, '#5a3a1a', 'center', 'normal');
  const rows = [
    ['Dishes served', String(state.orders.served)],
    ['Orders missed', String(state.orders.missed)],
    ['Tips earned', `$${state.orders.tips}`],
    ['Best combo', `x${state.orders.bestCombo}`],
    ['Final score', String(state.orders.score)],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 460, 336 + i * 38, 19, '#3a2417', 'left', 'normal');
    text(ctx, value, 820, 336 + i * 38, 19, '#e4572e', 'right');
  });
  const blink = Math.sin(performance.now() / 350) > -0.2;
  if (blink) text(ctx, 'Press ENTER to run another shift', 640, 566, 20, '#e4572e', 'center');
}

export function drawGame(ctx, state) {
  drawFloorAndWall(ctx);
  drawCounter(ctx);
  drawBoard(ctx, state.world);
  drawStove(ctx, state.world);
  drawPlateStation(ctx, state.world);
  drawServeWindow(ctx);
  drawTrash(ctx);
  drawTickets(ctx, state.orders, performance.now() / 1000);
  drawPlayer(ctx, state.world);
  drawHUD(ctx, state);
  drawPopups(ctx, state);
  if (state.screen === 'title') drawTitleScreen(ctx, state);
  if (state.screen === 'paused') drawPauseScreen(ctx);
  if (state.screen === 'over') drawEndScreen(ctx, state);
}
