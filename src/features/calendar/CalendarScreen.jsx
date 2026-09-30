import { useEffect } from 'react';
import { Button, ChevronLeftIcon, ChevronRightIcon, Dot, IconButton, cx } from '../../components/ui/index.js';
import { PRIORITY_TOKEN, WEEKDAYS_SHORT, currentTimeZone, formatMonthYear, todayLocal } from '../../domain/index.js';
import { selectCalendarWeeks } from '../../state/index.js';
import { useCalendar, useWorkspace } from '../../state/hooks.js';
import styles from './CalendarScreen.module.css';

function CalendarEntry({ task }) {
  return (
    <li className={styles.entry} title={task.title}>
      <Dot colour={`var(${PRIORITY_TOKEN[task.priority]})`} />
      <span className={styles.entryTitle}>{task.title}</span>
    </li>
  );
}

function DayCell({ cell }) {
  if (!cell.date) return <div className={styles.blank} aria-hidden="true" />;
  return (
    <div className={styles.cell} aria-label={cell.date}>
      <span className={cx(styles.dayNumber, cell.isToday && styles.today)} aria-current={cell.isToday ? 'date' : undefined}>
        {cell.day}
      </span>
      {cell.entries.length ? (
        <ul className={styles.entries}>
          {cell.entries.map((task) => <CalendarEntry key={task.id} task={task} />)}
        </ul>
      ) : null}
      {/* "+N more" expansion has no reference yet (gap C2): display only. */}
      {cell.more ? <span className={styles.more}>+{cell.more} more</span> : null}
    </div>
  );
}

/** US-06 — calendar_light.png with the approved equal 7-column grid (gap C1). */
export function CalendarScreen() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const { month, load, prev, next, goToday } = useCalendar((s) => s);
  const noDueDate = useCalendar((s) => s.noDueDate);
  const today = todayLocal(currentTimeZone());
  const weeks = useCalendar((s) => selectCalendarWeeks(s.month, s.byDate, today));

  useEffect(() => {
    if (workspaceId) load();
  }, [workspaceId, load]);

  return (
    <div className={styles.screen}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>Calendar</h1>
        <div className={styles.monthNav}>
          <IconButton label="Previous month" onClick={prev}><ChevronLeftIcon /></IconButton>
          <span className={styles.monthLabel} aria-live="polite">{formatMonthYear(month.year, month.month)}</span>
          <IconButton label="Next month" onClick={next}><ChevronRightIcon /></IconButton>
          <Button variant="secondary" size="sm" className={styles.todayButton} onClick={goToday}>Today</Button>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.calendar}>
          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAYS_SHORT.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className={styles.grid} style={{ '--weeks': weeks.length }}>
            {weeks.flat().map((cell, i) => <DayCell key={cell.date ?? `blank-${i}`} cell={cell} />)}
          </div>
        </div>

        <aside className={styles.noDue} aria-label="No due date">
          <h2 className={styles.noDueTitle}>No due date</h2>
          <ul className={styles.noDueList}>
            {noDueDate.map((task) => <li key={task.id} className={styles.noDueItem} title={task.title}>{task.title}</li>)}
          </ul>
        </aside>
      </div>
    </div>
  );
}
