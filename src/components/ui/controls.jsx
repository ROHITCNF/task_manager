import { forwardRef } from 'react';
import { cx } from './cx.js';
import { ChevronDownIcon } from './icons.jsx';
import styles from './controls.module.css';

/**
 * @param {{ variant?: 'primary'|'secondary'|'ghost', size?: 'default'|'sm', fullWidth?: boolean } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export const Button = forwardRef(function Button({ variant = 'primary', size = 'default', fullWidth = false, type = 'button', className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(styles.button, styles[variant], size === 'sm' && styles.sm, fullWidth && styles.fullWidth, className)}
      {...rest}
    />
  );
});

/** Icon-only button; `label` becomes the accessible name. */
export function IconButton({ label, className, type = 'button', children, ...rest }) {
  return (
    <button type={type} aria-label={label} className={cx(styles.iconButton, className)} {...rest}>
      {children}
    </button>
  );
}

/** @param {{ size?: 'default'|'sm' } & import('react').InputHTMLAttributes<HTMLInputElement>} props */
export const Input = forwardRef(function Input({ size = 'default', className, type = 'text', ...rest }, ref) {
  return <input ref={ref} type={type} className={cx(styles.field, styles.input, size === 'sm' && styles.fieldSm, className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(styles.field, styles.textarea, className)} {...rest} />;
});

/**
 * Native select with the reference chevron.
 * @param {{ options: { value: string, label: string }[], size?: 'default'|'sm', className?: string }
 *   & import('react').SelectHTMLAttributes<HTMLSelectElement>} props
 */
export function Select({ options, size = 'default', className, ...rest }) {
  return (
    <span className={cx(styles.selectRoot, className)}>
      <select className={cx(styles.field, styles.select, size === 'sm' && styles.fieldSm)} {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className={styles.chevron} />
    </span>
  );
}

/**
 * Segmented radio group (theme toggle).
 * @param {{ value: string, onChange: (value: string) => void, options: { value: string, label: string, icon?: import('react').ReactNode }[], label: string, className?: string }} props
 */
export function SegmentedControl({ value, onChange, options, label, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.segmented, className)}>
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            className={cx(styles.segment, checked && styles.segmentChecked)}
            onClick={() => onChange(o.value)}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
