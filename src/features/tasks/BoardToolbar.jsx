import { Button, Input, Select } from '../../components/ui/index.js';
import { useTasks } from '../../state/hooks.js';
import styles from './BoardToolbar.module.css';

/**
 * Tasks header: title, "+ New task" (inert until its form has a reference, gap S4), search and filters.
 * Filter options and search wiring are story US-05.
 */
export function BoardToolbar({ assigneeOptions = [], labelOptions = [], clientOptions = [], search, onSearch }) {
  const filters = useTasks((s) => s.filters);
  const setFilter = useTasks((s) => s.setFilter);

  return (
    <header className={styles.toolbar}>
      <div className={styles.lead}>
        <h1 className={styles.title}>Tasks</h1>
        <Button className={styles.newTask}>+ New task</Button>
      </div>
      <div className={styles.filters}>
        <Input
          size="sm"
          type="search"
          aria-label="Search tasks"
          placeholder="Search tasks…"
          className={styles.search}
          value={search ?? filters.q}
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <Select
          aria-label="Assignee"
          className={styles.assignee}
          value={filters.assigneeId ?? ''}
          onChange={(e) => setFilter('assigneeId', e.target.value || null)}
          options={[{ value: '', label: 'Everyone' }, ...assigneeOptions]}
        />
        <Select
          aria-label="Label"
          className={styles.label}
          value={filters.labelId ?? ''}
          onChange={(e) => setFilter('labelId', e.target.value || null)}
          options={[{ value: '', label: 'All labels' }, ...labelOptions]}
        />
        <Select
          aria-label="Client"
          className={styles.client}
          value={filters.clientId ?? ''}
          onChange={(e) => setFilter('clientId', e.target.value || null)}
          options={[{ value: '', label: 'All clients' }, ...clientOptions]}
        />
      </div>
    </header>
  );
}
