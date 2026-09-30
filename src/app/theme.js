/**
 * Applies the theme preference to <html> (docs/lld/components.md §4).
 * Mirrors the pre-paint script in index.html. 'system' follows prefers-color-scheme live.
 */
let unsubscribe = null;

/**
 * @param {'system'|'light'|'dark'} pref
 * @param {{ root?: HTMLElement, matchMedia?: (q: string) => MediaQueryList }} [env]
 */
export function applyTheme(pref, env = {}) {
  const root = env.root ?? globalThis.document?.documentElement;
  const matchMedia = env.matchMedia ?? globalThis.matchMedia?.bind(globalThis);
  if (!root) return;

  unsubscribe?.();
  unsubscribe = null;

  if (pref === 'system' && matchMedia) {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => root.classList.toggle('dark', query.matches);
    sync();
    query.addEventListener?.('change', sync);
    unsubscribe = () => query.removeEventListener?.('change', sync);
    return;
  }
  root.classList.toggle('dark', pref === 'dark');
}
