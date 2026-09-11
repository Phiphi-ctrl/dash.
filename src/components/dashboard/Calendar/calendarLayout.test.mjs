import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTaskSegments, getCalendarDays, getDateFromTimeSlot,
  layoutTaskSegments, shiftCalendarDate,
} from './calendarLayout.ts'

const today = new Date(2026, 8, 8, 12, 37)
const dateParts = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
const task = (id, startHour, endHour, day = 8) => ({
  id, title: id, completed: false, priority: 'medium', emoji: null,
  categoryId: null, completedAt: '', createdAt: today.toISOString(),
  startAt: new Date(2026, 8, day, 0, startHour * 60).toISOString(),
  endAt: new Date(2026, 8, day, 0, endHour * 60).toISOString(),
})
const layout = (tasks, anchor = today, view = 'day') => {
  const days = getCalendarDays(anchor, view)
  return layoutTaskSegments(buildTaskSegments(tasks, days), days.length)
}

test('day uses the anchor at local midnight and week runs Monday through Sunday', () => {
  assert.deepEqual(getCalendarDays(today, 'day').map(dateParts), [[2026, 9, 8, 0, 0]])
  assert.deepEqual(getCalendarDays(today, 'week').map(dateParts),
    Array.from({ length: 7 }, (_, index) => [2026, 9, 7 + index, 0, 0]))
  assert.deepEqual(getCalendarDays(new Date(2026, 8, 13, 23), 'week').map(dateParts),
    getCalendarDays(today, 'week').map(dateParts))
  assert.deepEqual(dateParts(today), [2026, 9, 8, 12, 37])
})

test('navigation advances one day or seven days and switching views keeps the anchor', () => {
  assert.deepEqual(dateParts(shiftCalendarDate(today, 'day', 1)), [2026, 9, 9, 0, 0])
  assert.deepEqual(dateParts(shiftCalendarDate(today, 'day', -1)), [2026, 9, 7, 0, 0])
  const nextWeek = shiftCalendarDate(today, 'week', 1)
  assert.deepEqual(dateParts(nextWeek), [2026, 9, 15, 0, 0])
  assert.deepEqual(getCalendarDays(nextWeek, 'day').map(dateParts), [[2026, 9, 15, 0, 0]])
  assert.deepEqual(dateParts(getCalendarDays(nextWeek, 'week')[0]), [2026, 9, 14, 0, 0])
  assert.deepEqual(dateParts(shiftCalendarDate(nextWeek, 'week', -1)), [2026, 9, 8, 0, 0])
})

test('navigation handles month, year, and leap-day boundaries', () => {
  assert.deepEqual(dateParts(shiftCalendarDate(new Date(2026, 11, 31), 'day', 1)), [2027, 1, 1, 0, 0])
  assert.deepEqual(dateParts(shiftCalendarDate(new Date(2027, 0, 1), 'day', -1)), [2026, 12, 31, 0, 0])
  assert.deepEqual(dateParts(shiftCalendarDate(new Date(2028, 1, 28), 'day', 1)), [2028, 2, 29, 0, 0])
  assert.deepEqual(dateParts(shiftCalendarDate(new Date(2026, 8, 30), 'week', 1)), [2026, 10, 7, 0, 0])
  assert.deepEqual(dateParts(getCalendarDays(new Date(2027, 0, 1), 'week')[0]), [2026, 12, 28, 0, 0])
})

test('visible days and navigation stay at local midnight across daylight-saving changes', () => {
  for (const [month, day] of [[2, 8], [2, 29], [9, 25], [10, 1]]) {
    const anchor = new Date(2026, month, day)
    assert.deepEqual(dateParts(shiftCalendarDate(anchor, 'day', 1)), [2026, month + 1, day + 1, 0, 0])
    const week = getCalendarDays(anchor, 'week')
    assert.equal(week.length, 7)
    for (let index = 0; index < week.length; index++) {
      assert.equal(week[index].getDay(), (index + 1) % 7)
      assert.equal(week[index].getHours(), 0)
    }
    assert.deepEqual(dateParts(shiftCalendarDate(shiftCalendarDate(anchor, 'week', 1), 'week', -1)), dateParts(anchor))
  }
})

test('time slots preserve local quarter hours, including midnight at the end of a day', () => {
  assert.deepEqual(dateParts(getDateFromTimeSlot(today, 37)), [2026, 9, 8, 9, 15])
  assert.deepEqual(dateParts(getDateFromTimeSlot(today, 95)), [2026, 9, 8, 23, 45])
  assert.deepEqual(dateParts(getDateFromTimeSlot(today, 96)), [2026, 9, 9, 0, 0])
})

test('day excludes other dates and clips overnight tasks to the visible date', () => {
  const segments = layout([
    task('yesterday', -3, 0), task('tomorrow', 24, 25),
    task('early', -1, 2), task('late', 23, 25), task('all-day', -24, 48),
  ])
  assert.deepEqual(segments.map(({ task: entry }) => entry.id).sort(), ['all-day', 'early', 'late'])
  const byId = Object.fromEntries(segments.map((segment) => [segment.task.id, segment]))
  assert.deepEqual([byId.early.startSlot, byId.early.endSlot], [0, 8])
  assert.deepEqual([byId.late.startSlot, byId.late.endSlot], [92, 96])
  assert.deepEqual([byId['all-day'].startSlot, byId['all-day'].endSlot], [0, 96])
  assert.ok(segments.every((segment) => segment.dayIndex === 0))
})

test('week segments split overnight tasks and exclude a task starting at next Monday', () => {
  const segments = buildTaskSegments([
    task('overnight', 23, 25, 7), task('sunday', 23, 25, 13), task('next-week', 0, 1, 14),
  ], getCalendarDays(today, 'week'))
  assert.deepEqual(segments.map(({ task: entry, dayIndex, startSlot, endSlot }) => [entry.id, dayIndex, startSlot, endSlot]), [
    ['overnight', 0, 92, 96], ['overnight', 1, 0, 4], ['sunday', 6, 92, 96],
  ])
})

test('day layout matches the same day in week view, including all collision lanes', () => {
  const tasks = [task('long', 9, 12), task('one', 9.5, 10), task('two', 10, 11), task('next', 12, 13), task('other-day', 9, 12, 9)]
  const day = layout(tasks)
  const week = layout(tasks, today, 'week').filter((segment) => segment.dayIndex === 1)
  assert.deepEqual(day, week.map((segment) => ({ ...segment, dayIndex: 0 })))
  assert.deepEqual(day.map(({ task: entry, laneIndex, laneCount }) => [entry.id, laneIndex, laneCount]), [
    ['long', 0, 2], ['one', 1, 2], ['two', 1, 2], ['next', 0, 1],
  ])
})

test('collision lanes remain independent per day and handle three simultaneous tasks', () => {
  const tasks = [task('a', 8, 13), task('b', 9, 12), task('c', 10, 11), task('d', 11, 12), task('tomorrow', 10, 11, 9)]
  const segments = layout(tasks, today, 'week')
  assert.equal(segments.find((segment) => segment.task.id === 'tomorrow').laneCount, 1)
  assert.equal(segments.find((segment) => segment.task.id === 'c').laneCount, 3)
  for (const a of segments) {
    for (const b of segments) {
      if (a === b || a.dayIndex !== b.dayIndex || a.laneIndex !== b.laneIndex) continue
      assert.ok(a.endSlot <= b.startSlot || b.endSlot <= a.startSlot)
    }
  }
})

test('empty calendars remain empty and layout does not mutate tasks, days, or segments', () => {
  assert.deepEqual(layout([]), [])
  assert.deepEqual(layout([], today, 'week'), [])
  const tasks = [task('later', 12, 13), task('earlier', 8, 9)]
  const originalTasks = structuredClone(tasks)
  const days = getCalendarDays(today, 'week')
  const originalDays = structuredClone(days)
  const segments = buildTaskSegments(tasks, days)
  const originalSegments = structuredClone(segments)
  layoutTaskSegments(segments, days.length)
  assert.deepEqual(tasks, originalTasks)
  assert.deepEqual(days, originalDays)
  assert.deepEqual(segments, originalSegments)
})
