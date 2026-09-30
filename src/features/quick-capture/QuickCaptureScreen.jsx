import { useState } from 'react';
import { Button, Select, Textarea } from '../../components/ui/index.js';
import { useQuickCapture } from '../../state/hooks.js';
import styles from './QuickCaptureScreen.module.css';

const PLACEHOLDER = 'Paste meeting notes or a list, one item per line…\n- Follow up with design on mockups\n- Send contract to legal';

/** Only the option visible in the reference; other sources are gap Q1. */
const SOURCE_OPTIONS = [{ value: 'meeting', label: 'From a meeting' }];

/**
 * US-08 — quick-capture_light.png. "Split into tasks" calls the split endpoint; the draft review
 * step that would show the result has no reference yet (gap S6).
 */
export function QuickCaptureScreen() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('meeting');
  const split = useQuickCapture((s) => s.split);
  const pending = useQuickCapture((s) => s.req.status === 'loading');
  const empty = text.trim() === '';

  return (
    <div className={styles.column}>
      <h1 className={styles.title}>Quick Capture</h1>
      <p className={styles.description}>
        Paste meeting notes or a list of to-dos below. Each line becomes a draft task you can edit before creating.
      </p>
      <Textarea
        aria-label="Notes"
        className={styles.textarea}
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className={styles.actions}>
        <Select aria-label="Source" className={styles.source} value={source} onChange={(e) => setSource(e.target.value)} options={SOURCE_OPTIONS} />
        <Button disabled={empty} onClick={() => !pending && split(text, source)}>Split into tasks</Button>
      </div>
    </div>
  );
}
