import { useEffect, useState } from 'react';
import { UserAvatar } from '../../components/domain/task.jsx';
import { Avatar, Button, Chip, Dot, Input, Select, Textarea, cx } from '../../components/ui/index.js';
import {
  PRIORITIES, PRIORITY_LABEL, STATUS_LABEL, STATUS_TOKEN, TASK_STATUSES,
  avatarToken, currentTimeZone, describeEvent, formatDateYear, formatDuration, formatInstantDateTime, initialOf,
} from '../../domain/index.js';
import { useClients, useTaskDetail, useWorkspace } from '../../state/hooks.js';
import styles from './TaskDrawer.module.css';

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }));
const PRIORITY_OPTIONS = PRIORITIES.map((value) => ({ value, label: PRIORITY_LABEL[value] }));

/** Label + control, as in card_click_state_light.png. */
function Field({ label, children, className }) {
  return (
    <label className={cx(styles.field, className)}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}

/** A date field: formatted text when read-only ("23 Sept 2026"), a native date input when editable (gap TD2). */
function DateField({ label, value, canEdit, onSave, placeholder }) {
  return (
    <Field label={label}>
      {canEdit ? (
        <Input type="date" className={styles.control} value={value ?? ''} onChange={(e) => onSave(e.target.value || null)} />
      ) : (
        <Input className={styles.control} value={value ? formatDateYear(value) : ''} placeholder={placeholder} disabled readOnly />
      )}
    </Field>
  );
}

function MemberChip({ member, selected, disabled, onToggle }) {
  const { user } = member;
  return (
    <Chip selected={selected} disabled={disabled} className={styles.memberChip} onClick={onToggle}>
      <Avatar size="xs" src={user.avatarUrl} alt="" initial={initialOf(user.name)} colour={`var(${avatarToken(user.id)})`} />
      {user.name}
    </Chip>
  );
}

function DetailsTab({ task, timeZone }) {
  const members = useWorkspace((s) => s.members);
  const clients = useClients((s) => s.items);
  const save = useTaskDetail((s) => s.save);
  const canEdit = task.permissions.canEdit;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');

  const assigned = new Set(task.assignees.map((u) => u.id));
  const toggleAssignee = (id) => {
    const next = assigned.has(id) ? [...assigned].filter((x) => x !== id) : [...assigned, id];
    save({ assigneeIds: next });
  };
  // Gap TD6: a single client select; the first linked client is shown, blank when none.
  const clientOptions = [{ value: '', label: '' }, ...clients.map((c) => ({ value: c.id, label: c.name }))];
  if (task.clients[0] && !clients.some((c) => c.id === task.clients[0].id)) {
    clientOptions.push({ value: task.clients[0].id, label: task.clients[0].name });
  }

  return (
    <div className={styles.details}>
      <p className={styles.created}>
        Created by <UserAvatar user={task.createdBy} size="xs" /> {task.createdBy.name} on {formatInstantDateTime(task.createdAt, timeZone)}
      </p>

      {!canEdit ? (
        <div className={styles.notice}>
          <p>Only the task&rsquo;s creator and owners can change it. You can still comment.</p>
          {/* Outcome not referenced yet (gap TD3). */}
          <Button variant="secondary" className={styles.noticeButton}>Ask to be assigned</Button>
        </div>
      ) : null}

      {canEdit ? (
        <Input
          aria-label="Title"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && save({ title: title.trim() })}
        />
      ) : (
        <h2 className={styles.title}>{task.title}</h2>
      )}

      <Textarea
        aria-label="Description"
        className={styles.description}
        value={description}
        readOnly={!canEdit}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => canEdit && description !== (task.description ?? '') && save({ description })}
      />

      <div className={styles.section}>
        <span className={styles.label}>Assignees</span>
        <div className={styles.chips} role="group" aria-label="Assignees">
          {members.map((m) => (
            <MemberChip key={m.user.id} member={m} selected={assigned.has(m.user.id)} disabled={!canEdit} onToggle={() => toggleAssignee(m.user.id)} />
          ))}
        </div>
      </div>

      <Field label="Status">
        <Select className={styles.control} value={task.status} disabled={!canEdit} options={STATUS_OPTIONS} onChange={(e) => save({ status: e.target.value })} />
      </Field>

      <div className={styles.pair}>
        <Field label="Priority">
          <Select className={styles.control} value={task.priority} disabled={!canEdit} options={PRIORITY_OPTIONS} onChange={(e) => save({ priority: e.target.value })} />
        </Field>
        <Field label="Client">
          <Select
            className={styles.control}
            value={task.clients[0]?.id ?? ''}
            disabled={!canEdit}
            options={clientOptions}
            onChange={(e) => save({ clientIds: e.target.value ? [e.target.value] : [] })}
          />
        </Field>
      </div>

      <div className={styles.pair}>
        <DateField label="Start date" value={task.startDate} canEdit={canEdit} onSave={(v) => save({ startDate: v })} />
        <DateField label="End date" value={task.endDate} canEdit={canEdit} onSave={(v) => save({ endDate: v })} />
      </div>

      <DateField label="Due date" value={task.dueDate} canEdit={canEdit} placeholder="Set due date" onSave={(v) => save({ dueDate: v })} />

      {/* Subtask list and comments below this label have no reference yet (gap TD1). */}
      <span className={styles.label}>Subtasks</span>
    </div>
  );
}

function stageDuration(stage, now) {
  return formatDuration((stage.exitedAt ?? now).getTime() - stage.enteredAt.getTime());
}

function HistoryTab({ task, timeZone }) {
  const history = useTaskDetail((s) => s.history);
  const loadHistory = useTaskDetail((s) => s.loadHistory);
  useEffect(() => { if (!history) loadHistory(); }, [history, loadHistory]);
  if (!history) return <h2 className={styles.title}>{task.title}</h2>;

  const now = new Date();
  const inStage = (stage) => (event) => event.createdAt >= stage.enteredAt && (!stage.exitedAt || event.createdAt < stage.exitedAt);

  return (
    <div className={styles.history}>
      <h2 className={styles.title}>{task.title}</h2>
      <span className={styles.label}>Stages</span>
      <ul className={styles.stagePills}>
        {history.stages.map((stage) => (
          <li key={`${stage.status}-${stage.enteredAt.getTime()}`} className={styles.stagePill}>
            <Dot colour={`var(${STATUS_TOKEN[stage.status]})`} />
            <span className={styles.stageName}>{STATUS_LABEL[stage.status]}</span>
            <span className={styles.stageMeta}>
              {stage.approximate ? '~' : ''}{stageDuration(stage, now)}{stage.exitedAt ? '' : ' · now'}
            </span>
          </li>
        ))}
      </ul>

      {history.stages.map((stage) => (
        <section key={`s-${stage.status}-${stage.enteredAt.getTime()}`} className={styles.stage} style={{ '--stage-colour': `var(${STATUS_TOKEN[stage.status]})` }}>
          <h3 className={styles.stageTitle}>{STATUS_LABEL[stage.status]}</h3>
          <p className={styles.stageRange}>
            {formatInstantDateTime(stage.enteredAt, timeZone)} → {stage.exitedAt ? formatInstantDateTime(stage.exitedAt, timeZone) : 'now'}
            {' · '}{stageDuration(stage, now)}{stage.exitedAt ? '' : ' so far'}
          </p>
          {stage.approximate ? (
            <p className={styles.stageNote}>
              Status changes before history tracking started weren&rsquo;t recorded, so this stage is approximate.
            </p>
          ) : null}
          <ul className={styles.events}>
            {history.events.filter(inStage(stage)).map((event) => {
              const action = describeEvent(event);
              if (!action) return null; // unreferenced event types (gap TD4)
              return (
                <li key={event.id} className={styles.event}>
                  <UserAvatar user={event.actor} />
                  <div>
                    <p className={styles.eventText}>{event.actor.name} {action}</p>
                    <p className={styles.eventTime}>{formatInstantDateTime(event.createdAt, timeZone)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * US-14/15 — task detail drawer (card_click_state_light.png, card_click_state_history_light.png).
 * @param {{ taskId: string, onClose: () => void }} props
 */
export function TaskDrawer({ taskId, onClose }) {
  const workspaceId = useWorkspace((s) => s.currentId);
  const task = useTaskDetail((s) => (s.taskId === taskId ? s.task : null));
  const open = useTaskDetail((s) => s.open);
  const close = useTaskDetail((s) => s.close);
  const [tab, setTab] = useState('details');
  const timeZone = currentTimeZone();

  useEffect(() => {
    if (workspaceId) open(taskId);
  }, [workspaceId, taskId, open]);
  useEffect(() => () => close(), [close]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={task?.title ?? 'Task'}>
        <header className={styles.header}>
          <Button variant="ghost" className={styles.close} onClick={onClose}>Close</Button>
          <div className={styles.tabs} role="group" aria-label="View">
            <Chip selected={tab === 'details'} className={styles.tab} onClick={() => setTab('details')}>Details</Chip>
            <Chip selected={tab === 'history'} className={styles.tab} onClick={() => setTab('history')}>History</Chip>
          </div>
        </header>
        {task ? (
          tab === 'details' ? <DetailsTab key={`${task.id}-${task.version}`} task={task} timeZone={timeZone} /> : <HistoryTab task={task} timeZone={timeZone} />
        ) : null}
      </aside>
    </>
  );
}
