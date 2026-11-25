// input.js — keyboard and mouse for Simmer Rush: WASD or arrows to walk,
// click-to-move, E or Space to interact (hold E to chop), Q to toss what is
// held, P or Escape to pause, Enter to start. Edge presses are queued and
// consumed once per frame, so a tap never fires twice.
export function createInput(canvas) {
  const keys = new Set();
  const pressedKeys = new Set();
  const input = {
    keys,
    clicked: false,
    clickTarget: null,
    consumePressed(code) {
      const hit = pressedKeys.has(code);
      pressedKeys.delete(code);
      return hit;
    },
    consumeClick() {
      const hit = input.clicked;
      input.clicked = false;
      return hit;
    },
    clearPressed() {
      pressedKeys.clear();
    },
    interactHeld() {
      return keys.has('KeyE') || keys.has('Space');
    },
    // Keys held for movement also cancel any click-to-move target, so the
    // keyboard always wins over a stale mouse destination.
    axis() {
      let dx = 0;
      let dy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }
      return { dx, dy };
    },
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressedKeys.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicked = true;
    input.clickTarget = {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  });
  return input;
}
