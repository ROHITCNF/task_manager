import { BarMeter, Card, EmptyText } from '../ui/index.js';
import styles from './dashboard.module.css';

/** Home stat card: label, big number, caption (home_light.png). */
export function StatCard({ label, value, caption }) {
  return (
    <Card as="article" className={styles.stat}>
      <h3 className={styles.statLabel}>{label}</h3>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statCaption}>{caption}</p>
    </Card>
  );
}

/** Titled panel; shows `empty` text when there are no children. */
export function PanelCard({ title, empty, children }) {
  return (
    <Card as="section" padding="lg" aria-label={title}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {children ?? <EmptyText className={styles.panelEmpty}>{empty}</EmptyText>}
    </Card>
  );
}

/**
 * Horizontal bar chart card. Each bar's natural length is `ratio` of the track; the count follows the
 * bar, and the bar shrinks when bar + count would overflow (this is how the reference renders 19/19/18).
 * @param {{ title: string, rows: { key: string, label: string, count: number, ratio: number }[], footer?: string|null }} props
 */
export function BarChartCard({ title, rows, footer }) {
  return (
    <Card as="section" padding="lg" aria-label={title} className={styles.chart}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <ul className={styles.rows}>
        {rows.map((row) => (
          <li key={row.key} className={styles.row}>
            <span className={styles.rowLabel}>{row.label}</span>
            <span className={styles.track} style={{ '--ratio': row.ratio }}>
              <BarMeter ratio={row.ratio} className={styles.bar} />
              <span className={styles.count}>{row.count}</span>
            </span>
          </li>
        ))}
      </ul>
      {footer ? <p className={styles.footer}>{footer}</p> : null}
    </Card>
  );
}
