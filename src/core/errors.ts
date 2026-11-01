import type Phaser from 'phaser';
import { SCENE } from '../shared/types';

const MAX_LOG = 20;
const LOOP_WINDOW_MS = 3000;
const LOOP_LIMIT = 3;
const TOAST_MS = 4000;
const TOAST_TEXT = 'Something went wrong, back to the menu';

export type ErrorAction = 'ignore' | 'fatal' | 'menu';

export interface ErrorEntry { at: number; message: string }

const log: ErrorEntry[] = [];
let totalCount = 0;
let booted = false;
let fatalShown = false;
let game: Phaser.Game | null = null;
let toast: HTMLDivElement | null = null;
let toastTimer = 0;
const recent: number[] = [];

/** Pure policy: before Boot finishes every error is fatal; afterwards it returns to Menu, unless errors loop. */
export function decideErrorAction(message: string, isBooted: boolean, recentAt: readonly number[], now: number): ErrorAction {
  if (message.includes('ResizeObserver')) return 'ignore';
  if (!isBooted) return 'fatal';
  let n = 0;
  for (const t of recentAt) if (now - t < LOOP_WINDOW_MS) n++;
  return n >= LOOP_LIMIT ? 'fatal' : 'menu';
}

export function errorCount(): number {
  return totalCount;
}

export function errorLog(): readonly ErrorEntry[] {
  return log;
}

export function markBooted(): void {
  booted = true;
}

export function isBooted(): boolean {
  return booted;
}

/** Test hook: clears all state. */
export function resetErrors(): void {
  log.length = 0;
  recent.length = 0;
  totalCount = 0;
  booted = false;
  fatalShown = false;
}

/** Plain-HTML fallback (shown at most once) so a crash never leaves a blank screen. */
export function showFatal(message: string): void {
  if (fatalShown) return;
  fatalShown = true;
  document.getElementById('splash')?.remove();
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText =
    'position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;' +
    'padding:24px;box-sizing:border-box;background:#2b2230;color:#f6e7cf;text-align:center;font:18px system-ui,"Segoe UI",Roboto,sans-serif';
  const title = document.createElement('h2');
  title.textContent = 'Scatterly hit a snag';
  title.style.margin = '0';
  const text = document.createElement('p');
  text.textContent = message.slice(0, 200);
  text.style.cssText = 'margin:0;max-width:640px;opacity:.8';
  const btn = document.createElement('button');
  btn.textContent = 'Reload';
  btn.style.cssText = 'min-height:56px;padding:0 36px;border:0;border-radius:14px;background:#e0955a;color:#2b2230;font:700 20px inherit;cursor:pointer';
  btn.onclick = () => window.location.reload();
  box.append(title, text, btn);
  document.body.appendChild(box);
}

/** Non-blocking message: never intercepts taps, auto-hides. One element, reused. */
export function showToast(text: string): void {
  if (!toast) {
    toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.style.cssText =
      'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:15;' +
      'padding:10px 20px;border-radius:12px;background:rgba(43,34,48,.94);color:#f6e7cf;font:600 16px system-ui,sans-serif;pointer-events:none';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.style.display = 'block';
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (toast) toast.style.display = 'none';
  }, TOAST_MS);
}

function recoverToMenu(g: Phaser.Game): void {
  try {
    g.loop.wake(true);
    for (const s of g.scene.getScenes(true)) g.scene.stop(s.scene.key);
    g.scene.start(SCENE.Menu);
    showToast(TOAST_TEXT);
  } catch (err) {
    showFatal(err instanceof Error ? err.message : String(err));
  }
}

/** Entry point for window.onerror and unhandledrejection. Never throws. */
export function handleError(message: string): void {
  try {
    const now = performance.now();
    totalCount++;
    log.push({ at: now, message: message.slice(0, 200) });
    if (log.length > MAX_LOG) log.shift();
    const action = decideErrorAction(message, booted, recent, now);
    if (action === 'ignore') {
      totalCount--;
      log.pop();
      return;
    }
    recent.push(now);
    if (recent.length > LOOP_LIMIT * 2) recent.shift();
    if (action === 'fatal' || !game) showFatal(message);
    else recoverToMenu(game);
  } catch {
    showFatal(message);
  }
}

function describe(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return typeof reason === 'string' ? reason : 'Unhandled promise rejection';
}

/** Install global handlers once, as early as possible (before the game exists). */
export function installErrorHandlers(): void {
  window.onerror = (message, _src, _line, _col, error): void => {
    handleError(error?.message ?? String(message));
  };
  window.addEventListener('unhandledrejection', (e) => handleError(describe(e.reason)));
}

export function attachGame(g: Phaser.Game): void {
  game = g;
}
