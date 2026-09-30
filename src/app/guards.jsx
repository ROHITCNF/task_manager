import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../state/hooks.js';

/** Authenticated routes: redirect to /login when signed out (docs/lld/routing.md §2). */
export function RequireAuth() {
  const phase = useSession((s) => s.phase);
  const location = useLocation();
  if (phase === 'unknown') return null;
  if (phase === 'signedOut') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Public-only routes (login): redirect home when already signed in. Return-to is gap L5. */
export function PublicOnly() {
  const phase = useSession((s) => s.phase);
  if (phase === 'unknown') return null;
  if (phase === 'signedIn') return <Navigate to="/" replace />;
  return <Outlet />;
}
