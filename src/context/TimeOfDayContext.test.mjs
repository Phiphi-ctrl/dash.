import assert from 'node:assert/strict'
import test from 'node:test'
import { getTimeOfDay } from './TimeOfDayContext.ts'

test('changes palettes at the original local-time boundaries', () => {
  for (const [hour, minute, second, label] of [
    [0, 0, 0, 'Night'], [4, 59, 59, 'Night'], [5, 0, 0, 'Morning'],
    [11, 59, 59, 'Morning'], [12, 0, 0, 'Afternoon'],
    [16, 59, 59, 'Afternoon'], [17, 0, 0, 'Evening'],
    [21, 59, 59, 'Evening'], [22, 0, 0, 'Night'], [23, 59, 59, 'Night'],
  ]) {
    assert.equal(getTimeOfDay(new Date(2026, 8, 8, hour, minute, second)).label, label)
  }
})

test('preserves all greeting gradients, progress SVG stops, IDs, and glow colors', () => {
  const expected = [
    [9, 'Morning', 'from-amber-300 via-orange-400 to-rose-400', '#fb923c', ['#fcd34d', '#fb923c', '#fb7185']],
    [14, 'Afternoon', 'from-sky-400 via-cyan-400 to-blue-500', '#22d3ee', ['#38bdf8', '#22d3ee', '#3b82f6']],
    [19, 'Evening', 'from-orange-500 via-rose-500 to-purple-500', '#f43f5e', ['#f97316', '#f43f5e', '#a855f7']],
    [23, 'Night', 'from-indigo-400 via-violet-500 to-purple-600', '#8b5cf6', ['#818cf8', '#8b5cf6', '#9333ea']],
  ]
  for (const [hour, label, classes, glowColor, colors] of expected) {
    assert.deepEqual(getTimeOfDay(new Date(2026, 8, 8, hour)), {
      label,
      gradient: `bg-linear-to-r ${classes}`,
      dayProgressGradient: {
        id: `dashboard-day-progress-${label.toLowerCase()}`,
        glowColor,
        stops: colors.map((color, index) => ({ offset: `${index * 50}%`, color })),
      },
    })
  }
})

test('uses the current local clock regardless of the calendar date or daylight-saving season', () => {
  for (const [year, month, day] of [[2026, 0, 1], [2026, 2, 29], [2026, 9, 25], [2027, 11, 31]]) {
    assert.equal(getTimeOfDay(new Date(year, month, day, 5)).label, 'Morning')
    assert.equal(getTimeOfDay(new Date(year, month, day, 12)).label, 'Afternoon')
    assert.equal(getTimeOfDay(new Date(year, month, day, 17)).label, 'Evening')
    assert.equal(getTimeOfDay(new Date(year, month, day, 22)).label, 'Night')
  }
})

test('does not mutate the input date or allow one result to change a later result', () => {
  const date = new Date(2026, 8, 8, 12, 30, 45)
  const before = date.getTime()
  const theme = getTimeOfDay(date)
  theme.dayProgressGradient.stops[0].color = '#000000'
  assert.equal(date.getTime(), before)
  assert.equal(getTimeOfDay(date).dayProgressGradient.stops[0].color, '#38bdf8')
})
