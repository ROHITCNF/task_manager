import { NavLink } from 'react-router';
import {
  Button, ChevronDownIcon, Dot, HalfCircleIcon, MoonIcon, SegmentedControl, SunIcon, cx,
} from '../../components/ui/index.js';
import { selectCurrentWorkspace } from '../../state/index.js';
import { useSession, useUi, useWorkspace } from '../../state/hooks.js';
import styles from './Sidebar.module.css';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/inbox', label: 'Inbox' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/docs', label: 'Docs' },
  { to: '/clients', label: 'Clients' },
  { to: '/quick-capture', label: 'Quick Capture' },
  { to: '/settings', label: 'Settings' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System', icon: <HalfCircleIcon /> },
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
];

/** Workspace name + switcher chevron (inert: gap S9), user email, Sign out. */
function WorkspaceHeader() {
  const workspace = useWorkspace(selectCurrentWorkspace);
  const email = useSession((s) => s.user?.email ?? '');
  const signOut = useSession((s) => s.signOut);

  return (
    <header className={styles.header}>
      <Dot colour="var(--color-primary-bg)" className={styles.workspaceDot} />
      <div className={styles.identity}>
        <button type="button" className={styles.workspaceName} aria-label={`Workspace ${workspace?.name ?? ''}`}>
          <span>{workspace?.name ?? ''}</span>
          <ChevronDownIcon className={styles.chevron} />
        </button>
        <span className={styles.email} title={email}>{email}</span>
      </div>
      <Button variant="ghost" className={styles.signOut} onClick={signOut}>Sign out</Button>
    </header>
  );
}

function MainNav() {
  return (
    <nav aria-label="Main">
      <ul className={styles.navList}>
        {NAV.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => cx(styles.navItem, isActive && styles.navItemActive)}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Dark has no palette yet (gap T1): selecting it only toggles the preference and the .dark class. */
function ThemeToggle() {
  const value = useUi((s) => s.themePreference);
  const setTheme = useUi((s) => s.setTheme);
  return <SegmentedControl label="Theme" value={value} onChange={setTheme} options={THEME_OPTIONS} className={styles.theme} />;
}

/** US-02 — the sidebar seen on every app screen. */
export function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <WorkspaceHeader />
      <MainNav />
      <ThemeToggle />
    </div>
  );
}
