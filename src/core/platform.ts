import type Phaser from 'phaser';
import { ExitGuard, gameBack } from './back';
import { setBackground } from './lifecycle';

interface CapacitorWindow { Capacitor?: { isNativePlatform?: () => boolean } }

export const isNative = (): boolean => (window as unknown as CapacitorWindow).Capacitor?.isNativePlatform?.() === true;

function toast(text: string): void {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText =
    'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:15;' +
    'padding:10px 18px;border-radius:14px;background:#2b2230;color:#f6e7cf;font:600 20px system-ui,sans-serif;pointer-events:none';
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1800);
}

/**
 * Native-only wiring (Android APK): the hardware Back button goes to the scenes first, then history (legacy Room),
 * then a double-press exit; app state drives the same background pause as the browser's visibilitychange.
 * The plugin is imported lazily, so the web build never loads it.
 */
export function installNative(game: Phaser.Game): void {
  if (!isNative()) return;
  const guard = new ExitGuard();
  void import('@capacitor/app').then(({ App }) => {
    void App.addListener('backButton', ({ canGoBack }) => {
      if (gameBack(game) === 'handled') return;
      if (canGoBack) {
        window.history.back();
        return;
      }
      if (guard.press(Date.now()) === 'exit') void App.exitApp();
      else toast('Press Back again to exit');
    });
    void App.addListener('appStateChange', ({ isActive }) => setBackground(game, !isActive));
  });
}
