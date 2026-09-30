import { useEffect, useRef } from 'react';
import { Button, Card, Dot } from '../../components/ui/index.js';
import { pluralise } from '../../domain/index.js';
import { useClients, useWorkspace } from '../../state/hooks.js';
import styles from './ClientsScreen.module.css';

function ClientRow({ client }) {
  return (
    <Card as="li" padding="none" className={styles.row} aria-label={client.name}>
      <Dot colour={client.colour} size="md" />
      <span className={styles.name}>{client.name}</span>
      <span className={styles.counts}>
        <span>{pluralise(client.taskCount, 'task')}</span>
        <span>{pluralise(client.docCount, 'doc')}</span>
      </span>
    </Card>
  );
}

/** US-07 — clients_light.png. Rows and "+ Add client" are inert until their screens have references (gaps S7, S8). */
export function ClientsScreen() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const items = useClients((s) => s.items);
  const hasMore = useClients((s) => Boolean(s.nextCursor));
  const load = useClients((s) => s.load);
  const loadMore = useClients((s) => s.loadMore);
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
        <h1 className={styles.title}>Clients</h1>
        <Button className={styles.add}>+ Add client</Button>
      </header>
      <ul className={styles.list}>
        {items.map((client) => <ClientRow key={client.id} client={client} />)}
      </ul>
      {hasMore ? <div ref={sentinelRef} className={styles.sentinel} /> : null}
    </div>
  );
}
