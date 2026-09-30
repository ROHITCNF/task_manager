import { cx } from './cx.js';
import styles from './display.module.css';

/**
 * Bordered surface.
 * @param {{ as?: string, padding?: 'none'|'md'|'lg', elevated?: boolean, className?: string, children?: import('react').ReactNode }} props
 */
export function Card({ as: Tag = 'div', padding = 'md', elevated = false, className, ...rest }) {
  return <Tag className={cx(styles.card, styles[`pad-${padding}`], elevated && styles.elevated, className)} {...rest} />;
}

/**
 * Coloured dot. `colour` is any CSS colour value, normally `var(--token)` or a client colour.
 * @param {{ colour: string, size?: 'sm'|'md', className?: string }} props
 */
export function Dot({ colour, size = 'sm', className }) {
  return <span aria-hidden="true" className={cx(styles.dot, styles[`dot-${size}`], className)} style={{ '--dot-colour': colour }} />;
}

/**
 * Pill with a leading dot. `outline` = neutral border (priority); `tinted` = tinted with `colour` (client).
 * @param {{ tone?: 'outline'|'tinted', colour: string, className?: string, children: import('react').ReactNode }} props
 */
export function Pill({ tone = 'outline', colour, className, children }) {
  return (
    <span className={cx(styles.pill, styles[tone], className)} style={{ '--pill-colour': colour }}>
      <Dot colour={colour} />
      {children}
    </span>
  );
}

/**
 * Round avatar: photo, initial on a colour, or "?" when unassigned.
 * @param {{ src?: string|null, alt?: string, initial?: string, colour?: string, size?: 'sm'|'md', unassigned?: boolean, className?: string }} props
 */
export function Avatar({ src, alt = '', initial, colour, size = 'sm', unassigned = false, className }) {
  const cls = cx(styles.avatar, styles[`avatar-${size}`], unassigned && styles.unassigned, className);
  if (unassigned) return <span className={cls} role="img" aria-label="Unassigned">?</span>;
  if (src) return <img className={cls} src={src} alt={alt} />;
  return <span className={cls} role="img" aria-label={alt} style={{ '--avatar-bg': colour }}>{initial}</span>;
}

/** Overlapping row of avatars. */
export function AvatarGroup({ className, children }) {
  return <span className={cx(styles.avatarGroup, className)}>{children}</span>;
}

/**
 * Horizontal bar whose length is `ratio` (0–1) of the available width. Renders nothing at 0.
 * @param {{ ratio: number, className?: string }} props
 */
export function BarMeter({ ratio, className }) {
  if (!(ratio > 0)) return null;
  return <span aria-hidden="true" className={cx(styles.bar, className)} style={{ '--ratio': Math.min(ratio, 1) }} />;
}

/** Scroll container with the reference's thin scrollbars. */
export function ScrollArea({ axis = 'y', className, ...rest }) {
  return <div className={cx(styles.scroll, styles[`scroll-${axis}`], className)} {...rest} />;
}

/** Single muted line used for empty states that exist in the references. */
export function EmptyText({ className, children }) {
  return <p className={cx(styles.empty, className)}>{children}</p>;
}
