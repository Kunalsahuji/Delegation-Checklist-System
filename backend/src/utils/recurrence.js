/**
 * THE RECURRENCE ENGINE
 *
 * Civil Dates at UTC midnight prevent timezone boundary distortion.
 * Time of day is evaluated in IST (UTC+05:30) offset.
 */

const BUSINESS_TZ_OFFSET_MINUTES = 330; // +05:30 IST
const DAY_MS = 86400000;
const MAX_OCCURRENCES_PER_EXPANSION = 366;
const MAX_SCAN_DAYS = 366 * 50;

const CHECKLIST_FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'lastWeekdayOfMonth',
];

const toCivilDate = (value) => {
  const x = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(x.getTime())) throw new Error('Invalid date');
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
};

const civilKey = (date) => toCivilDate(date).toISOString().slice(0, 10);

const civilToday = (now = new Date()) =>
  toCivilDate(new Date(now.getTime() + BUSINESS_TZ_OFFSET_MINUTES * 60000));

const daysInMonth = (year, monthIndex) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const clampDayOfMonth = (year, monthIndex, day) =>
  new Date(Date.UTC(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex))));

const lastWeekdayOfMonth = (year, monthIndex, weekday) => {
  const last = new Date(Date.UTC(year, monthIndex, daysInMonth(year, monthIndex)));
  const back = (last.getUTCDay() - weekday + 7) % 7;
  return new Date(last.getTime() - back * DAY_MS);
};

const startOfWeek = (date) => {
  const c = toCivilDate(date);
  const sinceMonday = (c.getUTCDay() + 6) % 7;
  return new Date(c.getTime() - sinceMonday * DAY_MS);
};

const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);
const maxDate = (a, b) => (a >= b ? a : b);
const minDate = (a, b) => (a <= b ? a : b);

const expandOccurrences = ({
  frequency,
  anchorDate,
  from,
  to,
  startOn = null,
  endOn = null,
  skipSundays = false,
  skipHolidays = false,
  holidays = new Set(),
}) => {
  if (!CHECKLIST_FREQUENCIES.includes(frequency)) {
    throw new Error(`Unknown checklist frequency: ${frequency}`);
  }
  const anchor = toCivilDate(anchorDate);
  const lower = maxDate(toCivilDate(from), startOn ? toCivilDate(startOn) : anchor);
  const upper = endOn ? minDate(toCivilDate(to), toCivilDate(endOn)) : toCivilDate(to);
  if (lower > upper) return [];

  const out = [];
  const full = () => out.length >= MAX_OCCURRENCES_PER_EXPANSION;

  if (frequency === 'daily') {
    let scanned = 0;
    for (
      let cur = lower;
      cur <= upper && !full() && scanned < MAX_SCAN_DAYS;
      cur = addDays(cur, 1)
    ) {
      scanned += 1;
      if (skipSundays && cur.getUTCDay() === 0) continue;
      if (skipHolidays && holidays.has(civilKey(cur))) continue;
      out.push(cur);
    }
    return out;
  }

  if (frequency === 'weekly') {
    const ahead = (anchor.getUTCDay() - lower.getUTCDay() + 7) % 7;
    for (let cur = addDays(lower, ahead); cur <= upper && !full(); cur = addDays(cur, 7)) {
      out.push(cur);
    }
    return out;
  }

  const anchorMonths = anchor.getUTCFullYear() * 12 + anchor.getUTCMonth();
  const anchorDay = anchor.getUTCDate();
  const anchorWeekday = anchor.getUTCDay();
  const step = frequency === 'quarterly' ? 3 : 1;

  const firstMonths = lower.getUTCFullYear() * 12 + lower.getUTCMonth();
  const lastMonths = upper.getUTCFullYear() * 12 + upper.getUTCMonth();
  for (let m = firstMonths; m <= lastMonths && !full(); m += 1) {
    if (((m - anchorMonths) % step + step) % step !== 0) continue;
    const year = Math.floor(m / 12);
    const monthIndex = m - year * 12;
    const candidate =
      frequency === 'lastWeekdayOfMonth'
        ? lastWeekdayOfMonth(year, monthIndex, anchorWeekday)
        : clampDayOfMonth(year, monthIndex, anchorDay);
    if (candidate >= lower && candidate <= upper) out.push(candidate);
  }
  return out;
};

const nextOccurrences = ({ frequency, anchorDate, after, count = 5, ...options }) => {
  const want = Math.min(Math.max(1, count), MAX_OCCURRENCES_PER_EXPANSION);
  const endOn = options.endOn ? toCivilDate(options.endOn) : null;
  const out = [];
  let from = addDays(toCivilDate(after), 1);
  for (let guard = 0; guard < 40 && out.length < want; guard += 1) {
    if (endOn && from > endOn) break;
    const to = addDays(from, 399);
    const batch = expandOccurrences({ frequency, anchorDate, ...options, from, to });
    for (const x of batch) {
      if (out.length < want) out.push(x);
    }
    from = addDays(to, 1);
  }
  return out;
};

const plannedInstant = (civilDate, dueTime = '18:00') => {
  const c = toCivilDate(civilDate);
  const [hh, mm] = String(dueTime).split(':').map(Number);
  const minutes = (Number.isFinite(hh) ? hh : 18) * 60 + (Number.isFinite(mm) ? mm : 0);
  return new Date(c.getTime() + (minutes - BUSINESS_TZ_OFFSET_MINUTES) * 60000);
};

const isOverdueOccurrence = (occurrence, now = new Date()) =>
  Boolean(
    occurrence &&
      occurrence.status === 'pending' &&
      occurrence.plannedAt &&
      new Date(occurrence.plannedAt) < now
  );

const occurrenceState = (occurrence, now = new Date()) => {
  if (!occurrence) return 'pending';
  if (occurrence.status === 'done') return 'done';
  if (occurrence.status === 'skipped') return 'skipped';
  return isOverdueOccurrence(occurrence, now) ? 'overdue' : 'pending';
};

module.exports = {
  CHECKLIST_FREQUENCIES,
  BUSINESS_TZ_OFFSET_MINUTES,
  toCivilDate,
  civilKey,
  civilToday,
  clampDayOfMonth,
  lastWeekdayOfMonth,
  startOfWeek,
  addDays,
  expandOccurrences,
  nextOccurrences,
  plannedInstant,
  isOverdueOccurrence,
  occurrenceState,
};
