/* Paper-fold pointer.
 *
 * The original site replaced the OS cursor with a small folded-paper glyph that
 * folds into a different shape as you move between an arrow, a link, a text
 * field and the "paper" idle state. The SVG frames come from cursor-frames.js
 * (extracted from the original bundle), so the shapes match exactly.
 *
 * Custom cursors only work where CSS `cursor: url(...)` is supported and the
 * device actually has a hovering pointer, so this bails out on touch devices,
 * when the visitor prefers reduced motion, and if any frame fails to decode.
 */
import { FRAMES, BASE, PRESSED, SHAPES, framePath } from "./cursor-frames.js";

const root = document.documentElement;
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");

// Elements that must keep their native cursor (scrollable canvases, inputs).
const NATIVE = "canvas, iframe, video, audio, select, textarea, [contenteditable], [disabled], [data-native-pointer]";

const MOVE_FRAME_MS = 26;
const IDLE_DELAY = 4200;

let enabled = false;
let ready = false;
let shape = null; // current logical shape: arrow | link | paper | text
let idle = false;
let pressed = null;
let foldTimer = null;
let idleTimer = null;
let lastPoint = null;

const setVar = (name, value) => {
  if (value === null) root.style.removeProperty(name);
  else root.style.setProperty(name, value);
};

const stopFold = () => {
  window.clearTimeout(foldTimer);
  foldTimer = null;
};

const clearIdle = () => {
  window.clearTimeout(idleTimer);
  idleTimer = null;
  if (idle) {
    idle = false;
    delete root.dataset.sitePointerIdle;
  }
  return idle;
};

// A `cursor` value is only valid when the url() ends in a keyword fallback;
// without it the declaration is dropped and the browser shows `auto`.
const KEYWORD = { arrow: "auto", link: "pointer", text: "text", paper: "grab" };

const frameCss = (index, keyword = "auto") => {
  const frame = FRAMES[index];
  if (!frame) return null;
  return `url("${frame.source}") ${frame.x} ${frame.y}, ${keyword}`;
};

/* Fold from `fromIndex` to `target` along the frame graph. */
function foldTo(target, fromIndex, immediate = false, keyword = "auto") {
  stopFold();
  const start = fromIndex == null ? BASE.arrow : fromIndex;
  if (!ready || motion.matches || start === target) {
    setVar("--site-cursor-fold-frame", null);
    return;
  }

  const chain = [start, ...framePath(start, target)];
  const stepMs = Math.min(immediate ? 16 : 24, 300 / Math.max(1, chain.length - 1));

  const step = (i) => {
    const css = frameCss(chain[i], keyword);
    if (css) setVar("--site-cursor-fold-frame", css);
    if (i >= chain.length - 1) {
      setVar("--site-cursor-fold-frame", null);
      foldTimer = null;
      return;
    }
    foldTimer = window.setTimeout(() => step(i + 1), stepMs);
  };
  step(0);
}

/* Which logical cursor shape an element asks for (via its computed `cursor`). */
function shapeFor(el) {
  if (!(el instanceof Element)) return null;
  if (el.closest(NATIVE)) return null;
  const cursor = window.getComputedStyle(el).cursor;
  if (!cursor || !cursor.includes("url(")) return null;
  if (/\btext$/.test(cursor)) return "text";
  if (/\bpointer$/.test(cursor)) return "link";
  if (/\bdefault$/.test(cursor)) return "arrow";
  return null;
}

function pointOf(event) {
  return { x: event.clientX, y: event.clientY };
}

function scheduleIdle(currentIndex) {
  window.clearTimeout(idleTimer);
  if (pressed || !shape || !lastPoint) return;
  idleTimer = window.setTimeout(() => {
    idleTimer = null;
    if (pressed) return;
    const hit = document.elementFromPoint(lastPoint.x, lastPoint.y);
    if (shapeFor(hit) !== shape) return;
    idle = true;
    root.dataset.sitePointerIdle = "true";
    foldTo(PRESSED.paper, currentIndex, false, "grab");
  }, IDLE_DELAY);
}

function onPointerOver(event) {
  if (!enabled || event.pointerType !== "mouse") return;
  const next = shapeFor(event.target) || "arrow";
  if (next === shape) return;
  const fromIndex = shape == null ? BASE.arrow : BASE[shape];
  shape = next;
  foldTo(BASE[shape], fromIndex, false, KEYWORD[shape] || "auto");
  scheduleIdle(BASE[shape]);
}

function onPointerMove(event) {
  if (!enabled || event.pointerType !== "mouse") return;
  const point = pointOf(event);
  const moved = !lastPoint || lastPoint.x !== point.x || lastPoint.y !== point.y;
  lastPoint = point;
  if (!moved) return;
  if (idle) {
    idle = false;
    delete root.dataset.sitePointerIdle;
    foldTo(BASE[shape || "arrow"], PRESSED.paper, false, KEYWORD[shape] || "auto");
  }
  scheduleIdle(BASE[shape || "arrow"]);
}

function onPointerDown(event) {
  if (!enabled || event.pointerType !== "mouse" || !shape) return;
  pressed = shape;
  root.dataset.sitePointerPressed = shape;
  if (PRESSED[shape] != null) foldTo(PRESSED[shape], BASE[shape], true, KEYWORD[shape] || "grab");
}

function onPointerUp() {
  if (!pressed) return;
  const was = pressed;
  pressed = null;
  delete root.dataset.sitePointerPressed;
  if (BASE[was] != null) foldTo(BASE[was], PRESSED[was] ?? BASE[was], false, KEYWORD[was] || "auto");
}

function teardown() {
  enabled = false;
  stopFold();
  window.clearTimeout(idleTimer);
  root.classList.remove("site-pointer-ready");
  delete root.dataset.sitePointerIdle;
  delete root.dataset.sitePointerPressed;
  setVar("--site-cursor-fold-frame", null);
}

/* Preload every frame; a single decode failure disables the custom cursor. */
function warmFrames() {
  const sources = [...new Set(FRAMES.map((f) => f.source))];
  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () =>
            (img.decode ? img.decode() : Promise.resolve()).then(
              () => resolve(true),
              () => resolve(false)
            );
          img.onerror = () => resolve(false);
          img.src = src;
        })
    )
  ).then((results) => results.every(Boolean));
}

function start() {
  if (enabled || !ready) return;
  enabled = true;
  root.classList.add("site-pointer-ready");
  shape = "arrow";
  setVar("--site-cursor-fold-frame", null);
  window.addEventListener("pointerover", onPointerOver, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
}

function sync() {
  if (finePointer.matches && !motion.matches) start();
  else teardown();
}

export function initPointer() {
  if (motion.matches || !finePointer.matches) {
    return;
  }
  warmFrames().then((ok) => {
    if (!ok) return;
    ready = true;
    sync();
  });

  finePointer.addEventListener?.("change", sync);
  motion.addEventListener?.("change", sync);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) teardown();
    else sync();
  });
  window.addEventListener("blur", teardown);
  window.addEventListener("focus", sync);
}

export { SHAPES };

// The page loads this as a module, so boot it as soon as it evaluates.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPointer, { once: true });
} else {
  initPointer();
}
