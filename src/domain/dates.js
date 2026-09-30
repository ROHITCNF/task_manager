/**
 * en-GB date helpers. LocalDate = 'YYYY-MM-DD' string (no timezone).
 * Month abbreviations are hardcoded so output is identical across JS engines ("Sept", not "Sep").
 */

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_SHORT = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

const pad = (n) => String(n).padStart(2, '0');

/** @param {string} localDate @returns {{ year: number, month: number, day: number }} month is 1-based */
export function parseLocalDate(localDate) {
  const [year, month, day] = localDate.split('-').map(Number);
  return { year, month, day };
}

/** @returns {string} LocalDate */
export const toLocalDate = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

/** Current calendar date in an IANA timezone. */
export function todayLocal(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Hour of day (0–23) in an IANA timezone. */
export function hourIn(timeZone, now = new Date()) {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now);
  return Number(hour);
}

/** Browser/runtime timezone. */
export const currentTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const weekdayOf = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).getUTCDay();
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** '2026-09-23' → '23 Sept' */
export function formatShort(localDate) {
  const { month, day } = parseLocalDate(localDate);
  return `${day} ${MONTHS_SHORT[month - 1]}`;
}

/** '2026-09-29' → '29/09/2026' */
export function formatNumeric(localDate) {
  const { year, month, day } = parseLocalDate(localDate);
  return `${pad(day)}/${pad(month)}/${year}`;
}

/** '2026-09-30' → 'Wednesday 30 September' */
export function formatLong(localDate) {
  const { year, month, day } = parseLocalDate(localDate);
  return `${WEEKDAYS_LONG[weekdayOf(year, month, day)]} ${day} ${MONTHS_LONG[month - 1]}`;
}

/** (2026, 9) → 'September 2026' */
export const formatMonthYear = (year, month) => `${MONTHS_LONG[month - 1]} ${year}`;

/** '2026-09-23' → '23 Sept 2026' (task drawer dates, history values) */
export function formatDateYear(localDate) {
  const { year } = parseLocalDate(localDate);
  return `${formatShort(localDate)} ${year}`;
}

/** Date → '23 Sept, 19:56' in the given timezone. */
export function formatInstantDateTime(date, timeZone) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  return `${formatShort(todayLocal(timeZone, date))}, ${time}`;
}

/** Milliseconds → '6d 18h' (history stage durations). Under a day: '5h', under an hour: '12m'. */
export function formatDuration(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** An instant shown as a short date in the given timezone: Date → '23 Sept'. */
export const formatInstantShort = (date, timeZone) => formatShort(todayLocal(timeZone, date));

/** @returns {string} LocalDate shifted by n days */
export function addDays(localDate, n) {
  const { year, month, day } = parseLocalDate(localDate);
  const d = new Date(Date.UTC(year, month - 1, day + n));
  return toLocalDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** @param {{ year: number, month: number }} ym @returns {{ year: number, month: number }} */
export function addMonths({ year, month }, n) {
  const index = year * 12 + (month - 1) + n;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** First and last LocalDate of a month. */
export const monthRange = (year, month) => ({
  from: toLocalDate(year, month, 1),
  to: toLocalDate(year, month, daysInMonth(year, month)),
});

/**
 * Sunday-first month grid: weeks × 7 cells, null for days outside the month.
 * @returns {(string|null)[][]}
 */
export function monthGrid(year, month) {
  const cells = Array(weekdayOf(year, month, 1)).fill(null);
  for (let day = 1; day <= daysInMonth(year, month); day += 1) cells.push(toLocalDate(year, month, day));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
