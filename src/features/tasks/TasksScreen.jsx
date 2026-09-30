import { useEffect, useMemo, useState } from 'react';
import { useClients, useTasks, useWorkspace } from '../../state/hooks.js';
import { BoardToolbar } from './BoardToolbar.jsx';
import { TaskBoard } from './TaskBoard.jsx';
import styles from './TasksScreen.module.css';

export const SEARCH_DEBOUNCE_MS = 300;

/** Loads filter options and debounces search (US-05), over the board (US-04). */
export function TasksScreen() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const members = useWorkspace((s) => s.members);
  const loadMembers = useWorkspace((s) => s.loadMembers);
  const clients = useClients((s) => s.items);
  const loadClients = useClients((s) => s.load);
  const labels = useTasks((s) => s.labels);
  const loadLabels = useTasks((s) => s.loadLabels);
  const query = useTasks((s) => s.filters.q);
  const setFilter = useTasks((s) => s.setFilter);
  const [search, setSearch] = useState(query);

  useEffect(() => {
    if (!workspaceId) return;
    loadMembers();
    loadClients();
    loadLabels();
  }, [workspaceId, loadMembers, loadClients, loadLabels]);

  useEffect(() => {
    if (search === query) return undefined;
    const timer = setTimeout(() => setFilter('q', search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, query, setFilter]);

  const assigneeOptions = useMemo(() => members.map((m) => ({ value: m.user.id, label: m.user.name })), [members]);
  const labelOptions = useMemo(() => labels.map((l) => ({ value: l.id, label: l.name })), [labels]);
  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.id, label: c.name })), [clients]);

  return (
    <div className={styles.screen}>
      <BoardToolbar
        assigneeOptions={assigneeOptions}
        labelOptions={labelOptions}
        clientOptions={clientOptions}
        search={search}
        onSearch={setSearch}
      />
      <TaskBoard />
    </div>
  );
}
