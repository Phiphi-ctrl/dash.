import assert from 'node:assert/strict'
import test from 'node:test'
import { filterTaskList, formatTaskDueDay, groupTasksByDueDay } from './taskListViews.ts'

const now = new Date(2026, 8, 7, 12)
const at = (hour) => new Date(2026, 8, 7, hour).toISOString()
const task = (id, start, end, completed = false) => ({
  id, startAt: at(start), endAt: at(end), completed,
})
const ids = (tasks, view, date = now) => filterTaskList(tasks, view, date).map((task) => task.id)

test('upcoming preserves later-today tasks regardless of completion', () => {
  const tasks = [
    task('yesterday', -12, -11), task('active', 11, 13),
    task('starts-now', 12, 13), task('later', 13, 14),
    task('later-done', 14, 15, true), task('tomorrow', 25, 26),
  ]
  assert.deepEqual(ids(tasks, 'upcoming'), ['later', 'later-done'])
})

test('completed and overdue use end time and include older and overnight tasks', () => {
  const tasks = [
    task('old-done', -12, -11, true), task('old-overdue', -12, -11),
    task('done', 8, 9, true), task('overdue', 8, 9),
    task('overnight', -1, 1), task('active', 11, 13),
    task('active-done', 11, 13, true), task('future-done', 13, 14, true),
  ]
  assert.deepEqual(ids(tasks, 'completed'), ['old-done', 'done'])
  assert.deepEqual(ids(tasks, 'overdue'), ['old-overdue', 'overdue', 'overnight'])
})

test('tasks enter a past view only after their exact end time', () => {
  const tasks = [task('pending', 11, 12), task('done', 11, 12, true)]
  assert.deepEqual(ids(tasks, 'completed'), [])
  assert.deepEqual(ids(tasks, 'overdue'), [])
  const justAfter = new Date(now.getTime() + 1)
  assert.deepEqual(ids(tasks, 'completed', justAfter), ['done'])
  assert.deepEqual(ids(tasks, 'overdue', justAfter), ['pending'])
})

test('toggling a past task transfers it between overdue and completed', () => {
  const pending = task('toggle', 8, 9)
  assert.deepEqual(ids([pending], 'overdue'), ['toggle'])
  assert.deepEqual(ids([pending], 'completed'), [])
  const completed = { ...pending, completed: true }
  assert.deepEqual(ids([completed], 'overdue'), [])
  assert.deepEqual(ids([completed], 'completed'), ['toggle'])
})

test('invalid time boundaries are excluded and empty lists work', () => {
  for (const view of ['upcoming', 'completed', 'overdue']) {
    assert.deepEqual(ids([], view), [])
    assert.deepEqual(ids([{ id: 'invalid', startAt: 'invalid', endAt: 'invalid', completed: view === 'completed' }], view), [])
  }
})

test('filtering preserves input order and does not mutate tasks', () => {
  const tasks = [task('second', 10, 11, true), task('first', 8, 9, true)]
  const original = structuredClone(tasks)
  assert.deepEqual(ids(tasks, 'completed'), ['second', 'first'])
  assert.deepEqual(tasks, original)
  assert.equal(filterTaskList(tasks, 'completed', now)[0], tasks[0])
})

test('groups by the local due day, including tasks spanning midnight', () => {
  const tasks = [
    task('overnight', -1, 1), task('yesterday', -12, -11),
    task('today', 8, 9), task('tomorrow', 23, 25),
  ]
  const groups = groupTasksByDueDay(tasks)
  assert.deepEqual(groups.map(({ date, tasks }) => ({ day: date.getDate(), ids: tasks.map(task => task.id) })), [
    { day: 6, ids: ['yesterday'] },
    { day: 7, ids: ['overnight', 'today'] },
    { day: 8, ids: ['tomorrow'] },
  ])
  assert.ok(groups.every(group => group.date.getHours() === 0))
})

test('merges non-adjacent due days without mutating input order or tasks', () => {
  const tasks = [task('long', -24, 10), task('older', -12, -11), task('short', 8, 9)]
  const original = structuredClone(tasks)
  const groups = groupTasksByDueDay(tasks)
  assert.deepEqual(groups.map(group => group.tasks.map(task => task.id)), [['older'], ['long', 'short']])
  assert.deepEqual(tasks, original)
  assert.equal(groups[1].tasks[0], tasks[0])
})

test('groups local dates correctly at month/year and daylight-saving boundaries', () => {
  for (const date of [new Date(2027, 0, 1), new Date(2026, 2, 29), new Date(2026, 9, 25)]) {
    const before = new Date(date)
    before.setDate(before.getDate() - 1)
    before.setHours(23, 59)
    const after = new Date(date)
    after.setHours(0, 1)
    const sameDay = new Date(date)
    sameDay.setHours(23, 59)
    const groups = groupTasksByDueDay([
      { id: 'late', endAt: sameDay.toISOString() },
      { id: 'early', endAt: after.toISOString() },
      { id: 'before', endAt: before.toISOString() },
    ])
    assert.equal(groups.length, 2)
    assert.equal(groups[0].date.getDate(), before.getDate())
    assert.equal(groups[1].date.getDate(), date.getDate())
    assert.deepEqual(groups[1].tasks.map(task => task.id), ['late', 'early'])
  }
})

test('relative due-day labels follow local calendar dates across year and DST changes', () => {
  for (const date of [now, new Date(2027, 0, 1, 0, 30), new Date(2026, 2, 30, 0, 30), new Date(2026, 9, 26, 0, 30)]) {
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 1)
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)
    assert.equal(formatTaskDueDay(date, date), 'Today')
    assert.equal(formatTaskDueDay(yesterday, date), 'Yesterday')
    assert.equal(formatTaskDueDay(tomorrow, date), 'Tomorrow')
  }
})

test('older date labels include weekdays and include the year when it differs', () => {
  const older = new Date(2025, 8, 7)
  assert.equal(formatTaskDueDay(older, now), new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).format(older))
  const sameYear = new Date(2026, 8, 4)
  assert.equal(formatTaskDueDay(sameYear, now), new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(sameYear))
})

test('empty or invalid due dates do not produce invalid day headings', () => {
  assert.deepEqual(groupTasksByDueDay([]), [])
  assert.deepEqual(groupTasksByDueDay([{ id: 'invalid', endAt: 'invalid' }]), [])
})
