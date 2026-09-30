import { useEffect } from 'react';
import { BarChartCard, PanelCard, StatCard } from '../../components/domain/dashboard.jsx';
import { currentTimeZone, firstName, formatLong, greetingFor, hourIn, pluralise, todayLocal } from '../../domain/index.js';
import { selectPersonBars, selectStatusBars } from '../../state/index.js';
import { useDashboard, useSession, useWorkspace } from '../../state/hooks.js';
import styles from './HomeDashboard.module.css';

const STAT_CARDS = [
  ['myOpenTasks', 'My open tasks', 'Assigned to you'],
  ['overdue', 'Overdue', 'Past their due date'],
  ['dueThisWeek', 'Due this week', 'In the next 7 days'],
  ['awaitingReview', 'Awaiting your review', 'Change requests'],
  ['unreadInbox', 'Unread in inbox', 'Mentions, assignments, updates'],
];

function Greeting() {
  const name = useSession((s) => s.user?.name ?? '');
  const tz = currentTimeZone();
  const now = new Date();
  return (
    <header className={styles.greeting}>
      <h1 className={styles.title}>{greetingFor(hourIn(tz, now))}, {firstName(name)}</h1>
      <p className={styles.subtitle}>{formatLong(todayLocal(tz, now))} · here&rsquo;s where things stand.</p>
    </header>
  );
}

/** US-03 — home_light.png. Renders once data has loaded (no loading state is referenced, gap G1). */
export function HomeDashboard() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const load = useDashboard((s) => s.load);
  const dashboard = useDashboard((s) => s.dashboard);
  const statusBars = useDashboard((s) => selectStatusBars(s.byStatus));
  const personBars = useDashboard((s) => selectPersonBars(s.byAssignee));
  const unassigned = useDashboard((s) => s.byAssignee?.unassignedCount ?? 0);

  useEffect(() => {
    if (workspaceId) load();
  }, [workspaceId, load]);

  return (
    <div className={styles.page}>
      <Greeting />
      {dashboard ? (
        <>
          <div className={styles.stats}>
            {STAT_CARDS.map(([key, label, caption]) => (
              <StatCard key={key} label={label} value={dashboard.stats[key]} caption={caption} />
            ))}
          </div>

          <div className={styles.pair}>
            {/* Populated panel states have no reference yet (gaps H1, H2). */}
            <PanelCard title="Due soon — assigned to you" empty="Nothing overdue or due this week." />
            <PanelCard title="Waiting for your review" empty="No change requests on tasks you manage." />
          </div>

          <div className={styles.pair}>
            <BarChartCard title="All tasks by status" rows={statusBars} />
            <BarChartCard
              title="Open tasks per person"
              rows={personBars}
              footer={unassigned > 0 ? `Plus ${pluralise(unassigned, 'open task')} with nobody assigned.` : null}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
