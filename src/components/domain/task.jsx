import { PRIORITY_LABEL, PRIORITY_TOKEN } from '../../domain/priority.js';
import { formatInstantShort, formatNumeric, formatShort } from '../../domain/dates.js';
import { isOverdue, pluralise } from '../../domain/rules.js';
import { avatarToken, initialOf } from '../../domain/avatar.js';
import { Avatar, AvatarGroup, CheckSquareIcon, Pill, cx } from '../ui/index.js';
import styles from './task.module.css';

/** Outline pill with the priority dot: Urgent / High / Medium / Low / No priority. */
export function PriorityPill({ priority }) {
  return <Pill tone="outline" colour={`var(${PRIORITY_TOKEN[priority]})`}>{PRIORITY_LABEL[priority]}</Pill>;
}

/** Pill tinted with the client's own colour. */
export function ClientPill({ client }) {
  return <Pill tone="tinted" colour={client.colour}>{client.name}</Pill>;
}

/** "23 Sept – 28 Sept"; nothing when both dates are missing. */
export function DateRange({ start, end }) {
  if (!start && !end) return null;
  const text = start && end ? `${formatShort(start)} – ${formatShort(end)}` : formatShort(start ?? end);
  return <span className={styles.meta}>{text}</span>;
}

/** "Due 29/09/2026" — red when the task is overdue (docs gaps.md R2). */
export function DueDate({ task, today }) {
  if (!task.dueDate) return null;
  return (
    <span className={cx(styles.meta, isOverdue(task, today) && styles.overdue)}>
      Due {formatNumeric(task.dueDate)}
    </span>
  );
}

/** "☑ 0/1"; nothing when the task has no checklist. */
export function ChecklistCount({ checklist }) {
  if (!checklist?.total) return null;
  return (
    <span className={cx(styles.meta, styles.checklist)} aria-label={`Checklist ${checklist.done} of ${checklist.total}`}>
      <CheckSquareIcon />
      {checklist.done}/{checklist.total}
    </span>
  );
}

/** "1 comment" / "N comments"; nothing at zero. */
export function CommentCount({ count }) {
  if (!count) return null;
  return <span className={styles.meta}>{pluralise(count, 'comment')}</span>;
}

/** Photo, initial on the hashed palette colour, or "?" when user is null. */
export function UserAvatar({ user, size = 'sm' }) {
  if (!user) return <Avatar size={size} unassigned />;
  return (
    <Avatar
      size={size}
      src={user.avatarUrl}
      alt={user.name}
      initial={initialOf(user.name)}
      colour={`var(${avatarToken(user.id)})`}
    />
  );
}

/**
 * Board card (taskboard_light.png): title, meta row (priority, dates, due, checklist, comments, clients),
 * author line, assignee avatars.
 * @param {{ task: import('../../domain/models.js').Task, today: string, timeZone: string }} props
 */
export function TaskCard({ task, today, timeZone }) {
  return (
    <article className={styles.card} aria-label={task.title}>
      <h3 className={styles.title}>{task.title}</h3>
      <div className={styles.metaRow}>
        <PriorityPill priority={task.priority} />
        <DateRange start={task.startDate} end={task.endDate} />
        <DueDate task={task} today={today} />
        <ChecklistCount checklist={task.checklist} />
        <CommentCount count={task.commentCount} />
        {task.clients.map((client) => <ClientPill key={client.id} client={client} />)}
      </div>
      <p className={styles.author}>by {task.createdBy.name} · {formatInstantShort(task.createdAt, timeZone)}</p>
      <AvatarGroup className={styles.assignees}>
        {task.assignees.length
          ? task.assignees.map((user) => <UserAvatar key={user.id} user={user} />)
          : <UserAvatar user={null} />}
      </AvatarGroup>
    </article>
  );
}
