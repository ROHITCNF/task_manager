import { PRIORITY_LABEL, PRIORITY_TOKEN } from '../../domain/priority.js';
import { formatInstantShort, formatNumeric, formatShort } from '../../domain/dates.js';
import { isOverdue, pluralise } from '../../domain/rules.js';
import { avatarToken, initialOf } from '../../domain/avatar.js';
import { Avatar, AvatarGroup, CheckSquareIcon, Pill, Select, cx } from '../ui/index.js';
import { STATUS_LABEL, TASK_STATUSES } from '../../domain/status.js';
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

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }));

/** Stops a click inside the card's own controls from opening the drawer. */
const stop = (e) => e.stopPropagation();

/**
 * Board card (taskboard_light.png): title, meta row (priority, dates, due, checklist, comments, clients),
 * author line, assignee avatars. Hover/focus reveals a status select (card-hover_light.png), disabled
 * unless the viewer can edit the task.
 * @param {{ task: import('../../domain/models.js').Task, today: string, timeZone: string,
 *   onOpen?: (task: object) => void, onStatusChange?: (task: object, status: string) => void }} props
 */
export function TaskCard({ task, today, timeZone, onOpen, onStatusChange }) {
  const canEdit = Boolean(task.permissions?.canEdit);
  return (
    <article className={cx(styles.card, onOpen && styles.clickable)} aria-label={task.title} onClick={onOpen ? () => onOpen(task) : undefined}>
      <h3 className={styles.title}>
        {onOpen ? <button type="button" className={styles.titleButton} onClick={(e) => { stop(e); onOpen(task); }}>{task.title}</button> : task.title}
      </h3>
      <div className={styles.metaRow}>
        <PriorityPill priority={task.priority} />
        <DateRange start={task.startDate} end={task.endDate} />
        <DueDate task={task} today={today} />
        <ChecklistCount checklist={task.checklist} />
        <CommentCount count={task.commentCount} />
        {task.clients.map((client) => <ClientPill key={client.id} client={client} />)}
      </div>
      <p className={styles.author}>by {task.createdBy.name} · {formatInstantShort(task.createdAt, timeZone)}</p>
      <div className={styles.footer}>
        <AvatarGroup>
          {task.assignees.length
            ? task.assignees.map((user) => <UserAvatar key={user.id} user={user} />)
            : <UserAvatar user={null} />}
        </AvatarGroup>
        {onStatusChange ? (
          <span className={styles.statusSelect} onClick={stop}>
            <Select
              aria-label={`Status of ${task.title}`}
              size="sm"
              value={task.status}
              disabled={!canEdit}
              onChange={(e) => onStatusChange(task, e.target.value)}
              options={STATUS_OPTIONS}
            />
          </span>
        ) : null}
      </div>
    </article>
  );
}
