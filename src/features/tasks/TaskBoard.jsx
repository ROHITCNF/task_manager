import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { TaskCard } from '../../components/domain/task.jsx';
import { Button, ScrollArea } from '../../components/ui/index.js';
import { STATUS_LABEL, TASK_STATUSES, currentTimeZone, todayLocal } from '../../domain/index.js';
import { selectColumnTasks } from '../../state/index.js';
import { useTasks, useWorkspace } from '../../state/hooks.js';
import styles from './TaskBoard.module.css';

/** Calls `onVisible` when the sentinel scrolls into view inside `root` (next-page loading). */
function useEndOfList(rootRef, onVisible, enabled) {
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined' || !sentinelRef.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onVisible();
    }, { root: rootRef.current, rootMargin: '200px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [rootRef, onVisible, enabled]);
  return sentinelRef;
}

function BoardColumn({ status, today, timeZone, onOpen, onStatusChange }) {
  const tasks = useTasks(selectColumnTasks(status));
  const count = useTasks((s) => s.counts[status]);
  const hasMore = useTasks((s) => Boolean(s.columns[status].nextCursor));
  const loadMore = useTasks((s) => s.loadMore);
  const listRef = useRef(null);
  const sentinelRef = useEndOfList(listRef, () => loadMore(status), hasMore);

  return (
    <section className={styles.column} aria-label={STATUS_LABEL[status]}>
      <header className={styles.columnHeader}>
        <h2 className={styles.columnTitle}>{STATUS_LABEL[status]}</h2>
        <span className={styles.columnCount}>{count}</span>
      </header>
      <ScrollArea ref={listRef} axis="y" className={styles.list}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} today={today} timeZone={timeZone} onOpen={onOpen} onStatusChange={onStatusChange} />
        ))}
        {hasMore ? <div ref={sentinelRef} className={styles.sentinel} /> : null}
      </ScrollArea>
      <footer className={styles.columnFooter}>
        {/* Inline add has no reference yet (gap B5): rendered as in the reference, inert. */}
        <Button variant="ghost" className={styles.addTask}>+ Add task</Button>
      </footer>
    </section>
  );
}

/** US-04 — the status columns of taskboard_light.png. */
export function TaskBoard() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const loadBoard = useTasks((s) => s.loadBoard);
  const changeStatus = useTasks((s) => s.changeStatus);
  const navigate = useNavigate();
  const onOpen = useCallback((task) => navigate(`/tasks/${task.id}`), [navigate]);
  const timeZone = currentTimeZone();
  const today = todayLocal(timeZone);

  useEffect(() => {
    if (workspaceId) loadBoard();
  }, [workspaceId, loadBoard]);

  return (
    <ScrollArea axis="x" className={styles.board}>
      <div className={styles.columns}>
        {TASK_STATUSES.map((status) => <BoardColumn key={status} status={status} today={today} timeZone={timeZone} onOpen={onOpen} onStatusChange={changeStatus} />)}
      </div>
    </ScrollArea>
  );
}
