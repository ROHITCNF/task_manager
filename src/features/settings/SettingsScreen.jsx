import { useEffect, useState } from 'react';
import { UserAvatar } from '../../components/domain/task.jsx';
import { Button, Input } from '../../components/ui/index.js';
import { selectCurrentWorkspace } from '../../state/index.js';
import { useWorkspace } from '../../state/hooks.js';
import styles from './SettingsScreen.module.css';

/** US-09 — create a workspace (button disabled while the name is blank). */
function CreateWorkspaceForm() {
  const [name, setName] = useState('');
  const create = useWorkspace((s) => s.create);
  const pending = useWorkspace((s) => s.createReq.status === 'loading');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || pending) return;
    if (await create(name)) setName('');
  };

  return (
    <section className={styles.section} aria-labelledby="create-ws">
      <h2 id="create-ws" className={styles.heading}>Create a new workspace</h2>
      <p className={styles.helper}>You&rsquo;ll be its owner. Switch between your workspaces from the name at the top left.</p>
      <form className={styles.row} onSubmit={onSubmit}>
        <Input aria-label="Workspace name" placeholder="Workspace name" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={!name.trim()}>Create workspace</Button>
      </form>
    </section>
  );
}

/** US-10 — join by invite code. The button stays enabled (as in the reference); blank codes send nothing. */
function JoinWorkspaceForm() {
  const [code, setCode] = useState('');
  const join = useWorkspace((s) => s.join);
  const pending = useWorkspace((s) => s.joinReq.status === 'loading');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || pending) return;
    if (await join(code)) setCode('');
  };

  return (
    <section className={styles.section} aria-labelledby="join-ws">
      <h2 id="join-ws" className={styles.heading}>Join another workspace</h2>
      <p className={styles.helper}>
        Got an invite code from another team? Join it without leaving this one — you can switch between workspaces from the sidebar.
      </p>
      <form className={styles.row} onSubmit={onSubmit}>
        <Input aria-label="Invite code" placeholder="Invite code" className={styles.input} value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" variant="secondary">Join workspace</Button>
      </form>
    </section>
  );
}

/** US-11 — members, owner first then join order (server order). */
function MemberList() {
  const workspaceId = useWorkspace((s) => s.currentId);
  const members = useWorkspace((s) => s.members);
  const loadMembers = useWorkspace((s) => s.loadMembers);

  useEffect(() => {
    if (workspaceId) loadMembers();
  }, [workspaceId, loadMembers]);

  return (
    <section className={styles.section} aria-labelledby="members">
      <h2 id="members" className={styles.heading}>Members</h2>
      <ul className={styles.members}>
        {members.map((m) => (
          <li key={m.user.id} className={styles.member}>
            <UserAvatar user={m.user} size="md" />
            <div className={styles.memberText}>
              <span className={styles.memberName}>{m.user.name}</span>
              <span className={styles.role}>{m.role}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** settings_light.png */
export function SettingsScreen() {
  const workspace = useWorkspace(selectCurrentWorkspace);
  return (
    <div className={styles.column}>
      <h1 className={styles.title}>Workspace settings</h1>
      <p className={styles.subtitle}>{workspace?.name ?? ''}</p>
      <CreateWorkspaceForm />
      <JoinWorkspaceForm />
      <MemberList />
    </div>
  );
}
