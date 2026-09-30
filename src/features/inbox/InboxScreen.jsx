import { useEffect } from 'react';
import { Button, Chip, EmptyText } from '../../components/ui/index.js';
import { selectHasUnread } from '../../state/index.js';
import { useInbox, useWorkspace } from '../../state/hooks.js';
import styles from './InboxScreen.module.css';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

const EMPTY_COPY = 'Nothing here yet. You’ll see @mentions, assignments, status changes on your tasks and due-date reminders here.';

/**
 * US-12 — inbox_light.png. Only the empty state has a reference: item rows are not rendered until
 * their design exists (gap IN1), and "Notification settings" is inert (gap IN4).
 */
export function InboxScreen() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const filter = useInbox((s) => s.filter);
  const items = useInbox((s) => s.items);
  const loaded = useInbox((s) => s.req.status === 'success');
  const hasUnread = useInbox(selectHasUnread);
  const load = useInbox((s) => s.load);
  const setFilter = useInbox((s) => s.setFilter);
  const markAllRead = useInbox((s) => s.markAllRead);

  useEffect(() => {
    if (workspaceId) load();
  }, [workspaceId, load]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.lead}>
          <h1 className={styles.title}>Inbox</h1>
          <div role="group" aria-label="Filter" className={styles.chips}>
            {FILTERS.map((f) => (
              <Chip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>{f.label}</Chip>
            ))}
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" className={styles.action} disabled={!hasUnread} onClick={markAllRead}>Mark all as read</Button>
          <Button variant="secondary" className={styles.action}>Notification settings</Button>
        </div>
      </header>
      {loaded && items.length === 0 ? <EmptyText className={styles.empty}>{EMPTY_COPY}</EmptyText> : null}
    </div>
  );
}
