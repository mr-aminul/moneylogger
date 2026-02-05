import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  format,
  differenceInCalendarDays,
} from 'date-fns'

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

/**
 * Get start and end dates for the current period containing the given date.
 * Weekly: Sun–Sat (weekStartsOn: 0). Use 1 for Mon–Sun if preferred.
 */
export function getPeriodRange(period, date = new Date()) {
  const d = new Date(date)
  switch (period) {
    case 'weekly':
      return {
        start: startOfWeek(d, { weekStartsOn: 0 }),
        end: endOfWeek(d, { weekStartsOn: 0 }),
      }
    case 'yearly':
      return {
        start: startOfYear(d),
        end: endOfYear(d),
      }
    case 'monthly':
    default:
      return {
        start: startOfMonth(d),
        end: endOfMonth(d),
      }
  }
}

/** Human-readable label for the current period (e.g. "Jan 27 – Feb 2, 2025" or "January 2025"). */
export function formatPeriodLabel(period, date = new Date()) {
  const { start, end } = getPeriodRange(period, date)
  switch (period) {
    case 'weekly':
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    case 'yearly':
      return format(start, 'yyyy')
    case 'monthly':
    default:
      return format(start, 'MMMM yyyy')
  }
}

export function isDateInPeriod(date, period, referenceDate = new Date()) {
  const { start, end } = getPeriodRange(period, referenceDate)
  return isWithinInterval(new Date(date), { start, end })
}

/**
 * Total number of days in the current period (e.g. 28–31 for monthly).
 */
export function getDaysInPeriod(period, date = new Date()) {
  const { start, end } = getPeriodRange(period, date)
  return differenceInCalendarDays(end, start) + 1
}

/**
 * Days remaining in the period including today (e.g. "25 days left" on Feb 4 in Feb).
 * Used to compute daily allowance: remainingBudget / daysRemaining.
 */
export function getDaysRemainingInPeriod(period, date = new Date()) {
  const { end } = getPeriodRange(period, date)
  const d = new Date(date)
  const days = differenceInCalendarDays(end, d) + 1
  return Math.max(0, days)
}

export { PERIODS }
