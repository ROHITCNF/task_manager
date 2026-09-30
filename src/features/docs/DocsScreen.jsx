import { useEffect, useRef } from 'react';
import { Button } from '../../components/ui/index.js';
import { useDocs, useWorkspace } from '../../state/hooks.js';
import styles from './DocsScreen.module.css';

/**
 * US-16 — docs_light.png. "Upload document", "+ New doc" and the rows are inert until the upload flow,
 * the create flow and the doc view have references (gaps DC1–DC3).
 */
export function DocsScreen() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const items = useDocs((s) => s.items);
  const hasMore = useDocs((s) => Boolean(s.nextCursor));
  const load = useDocs((s) => s.load);
  const loadMore = useDocs((s) => s.loadMore);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (workspaceId) load();
  }, [workspaceId, load]);

  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === 'undefined' || !sentinelRef.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    }, { rootMargin: '200px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Docs</h1>
        <div className={styles.actions}>
          <Button variant="secondary">Upload document</Button>
          <Button>+ New doc</Button>
        </div>
      </header>
      <ul className={styles.list} aria-label="Documents">
        {items.map((doc) => <li key={doc.id} className={styles.row}>{doc.title}</li>)}
      </ul>
      {hasMore ? <div ref={sentinelRef} className={styles.sentinel} /> : null}
    </div>
  );
}
