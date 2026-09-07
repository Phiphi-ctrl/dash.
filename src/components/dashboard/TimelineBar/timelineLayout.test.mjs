import assert from 'node:assert/strict'
import test from 'node:test'
import { getTimelineDay, getTimelineTicks, layoutTimeline, TIMELINE_BAR_HEIGHT } from './timelineLayout.ts'

const date = new Date(2026, 8, 6, 12)
function task(id, startHour, endHour, title = id) {
  const at = (hour) => new Date(2026, 8, 6, 0, hour * 60).toISOString()
  return { id, title, startAt: at(startHour), endAt: at(endHour), emoji: null, completed: false }
}

test('maps the day to the full width and clips overnight tasks', () => {
  const layout = layoutTimeline([task('early', -2, 2), task('late', 23, 26), task('all-day', -24, 48)], date, 1200)
  const early = layout.entries.find((entry) => entry.task.id === 'early')
  const late = layout.entries.find((entry) => entry.task.id === 'late')
  const allDay = layout.entries.find((entry) => entry.task.id === 'all-day')
  assert.equal(early.left, 0)
  assert.equal(early.width, 100)
  assert.equal(late.left, 1150)
  assert.equal(late.width, 50)
  assert.equal(allDay.width, 1200)
})

test('excludes other days, empty intervals, and invalid dates', () => {
  const layout = layoutTimeline([
    task('yesterday', -3, 0), task('tomorrow', 24, 25), task('empty', 8, 8),
    task('reversed', 10, 9), { ...task('invalid', 8, 9), startAt: 'invalid' },
  ], date, 1200)
  assert.equal(layout.entries.length, 0)
  assert.equal(layout.lanePositions.length, 1)
  assert.ok(layout.height > 0)
})

test('reuses a lane for back-to-back tasks and separates overlaps', () => {
  const layout = layoutTimeline([
    task('long', 9, 12), task('one', 9.5, 10), task('two', 10, 11), task('next', 12, 13),
  ], date, 1200)
  const byId = Object.fromEntries(layout.entries.map((entry) => [entry.task.id, entry]))
  assert.equal(byId.long.lane, 0)
  assert.equal(byId.one.lane, 1)
  assert.equal(byId.two.lane, 1)
  assert.equal(byId.next.lane, 0)
  assert.equal(layout.lanePositions.length, 2)
})

test('uses three rows for triple collisions without overlapping bars in a row', () => {
  const layout = layoutTimeline([task('a', 8, 13), task('b', 9, 12), task('c', 10, 11), task('d', 11, 12)], date, 1200)
  assert.equal(Math.max(...layout.entries.map((entry) => entry.lane)), 2)
  for (const a of layout.entries) {
    for (const b of layout.entries) {
      if (a === b || a.lane !== b.lane) continue
      assert.ok(a.end <= b.start || b.end <= a.start)
    }
  }
})

test('keeps short task intervals exact and row height compact at narrow widths', () => {
  const tasks = Array.from({ length: 20 }, (_, index) => task(`${index}`, 9 + index / 12, 9 + (index + 1) / 12, `Detailed task ${index}`))
  for (const width of [224, 640, 1200]) {
    const { entries, height } = layoutTimeline(tasks, date, width)
    for (const a of entries) {
      assert.ok(a.left >= 0 && a.left + a.width <= width)
      assert.ok(a.barY - TIMELINE_BAR_HEIGHT / 2 >= 0 && a.barY + TIMELINE_BAR_HEIGHT / 2 < height)
      for (const b of entries) {
        if (a === b) continue
        assert.ok(a.end <= b.start || b.end <= a.start || a.lane !== b.lane)
      }
    }
    assert.equal(height, layoutTimeline([tasks[0]], date, width).height)
  }
})

test('does not mutate task order or task data', () => {
  const tasks = [task('later', 12, 13), task('earlier', 8, 9)]
  const original = structuredClone(tasks)
  layoutTimeline(tasks, date, 1200)
  assert.deepEqual(tasks, original)
})

test('keeps chronological task order after resizing', () => {
  const tasks = [task('late', 23, 24, 'An evening task with a longer label'), task('early', 18, 19), task('middle', 20, 21)]
  for (const width of [224, 640, 1200]) {
    assert.deepEqual(layoutTimeline(tasks, date, width).entries.map((entry) => entry.task.id), ['early', 'middle', 'late'])
  }
})

test('fades only completed tasks whose actual scheduled end has passed', () => {
  const layout = layoutTimeline([
    { ...task('past-done', 8, 9), completed: true },
    task('past-pending', 8, 9),
    { ...task('current-done', 11, 13), completed: true },
    { ...task('future-done', 14, 15), completed: true },
    { ...task('ends-now', 11, 12), completed: true },
    { ...task('overnight', 23, 26), completed: true },
  ], date, 1200)
  const states = Object.fromEntries(layout.entries.map((entry) => [entry.task.id, entry.pastCompleted]))
  assert.deepEqual(states, {
    'past-done': true, 'past-pending': false, 'current-done': false,
    'ends-now': true, 'future-done': false, overnight: false,
  })
})

test('axis starts at 00:00 and ends at 24:00 on local daylight-saving transition dates', () => {
  for (const localDate of [date, new Date(2026, 2, 29, 12), new Date(2026, 9, 25, 12)]) {
    const ticks = getTimelineTicks(localDate)
    const day = getTimelineDay(localDate)
    assert.equal(ticks[0].hour, 0)
    assert.equal(ticks[0].position, 0)
    assert.equal(ticks.at(-1).hour, 24)
    assert.equal(ticks.at(-1).position, 1)
    assert.equal(new Date(day.end).getHours(), 0)
    assert.ok(ticks.every((tick, index) => index === 0 || tick.position > ticks[index - 1].position))
  }
})
