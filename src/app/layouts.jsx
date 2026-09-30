import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { useSession, useWorkspace } from '../state/hooks.js';
import styles from './layouts.module.css';

/** Frame for signed-out pages (Login). No app shell. */
export function PublicLayout() {
  return (
    <div className={styles.public}>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  );
}

/**
 * Frame for signed-in pages: sidebar column + main. Loads the user's workspaces once.
 * The sidebar content is story US-02.
 */
export function AppShell({ sidebar = null }) {
  const phase = useSession((s) => s.phase);
  const load = useWorkspace((s) => s.load);
  const loaded = useWorkspace((s) => s.req.status !== 'idle');

  useEffect(() => {
    if (phase === 'signedIn' && !loaded) load();
  }, [phase, loaded, load]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.main}>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
