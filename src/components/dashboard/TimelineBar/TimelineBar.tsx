import { useLayoutEffect, useRef, useState } from 'react'
import type { Task } from '../../../types/Task.ts'
import type { Category } from '../../../types/Category.ts'
import { getTimelineTicks, layoutTimeline } from './timelineLayout.ts'
import TimelineTask from './TimelineTask.tsx'

type TimelineBarProps = {
  tasks: Task[]
  categories: Category[]
  now: Date
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TimelineBar({ tasks, categories, now, onEdit, onToggle, onDelete }: TimelineBarProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(surface)
    return () => observer.disconnect()
  }, [])

  const layout = layoutTimeline(tasks, now, width)
  const ticks = getTimelineTicks(now)
  const nowPosition = (now.getTime() - layout.day.start) / (layout.day.end - layout.day.start)

  return (
    <section data-timeline className="@container w-full min-w-0" aria-label="Today's task timeline">
      <div ref={surfaceRef} className="relative w-full min-w-0" style={{ height: layout.height }}>
        {width > 0 && (
          <>
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={layout.height} aria-hidden="true">
              {ticks.map(({ hour, position }) => (
                <line key={hour} x1={position * width} x2={position * width}
                  y1={4} y2={layout.height - 20}
                  className={`stroke-border stroke-1 ${hour % 3 === 0 ? '[stroke-opacity:0.5] [stroke-dasharray:2_5]' : '[stroke-opacity:0.18]'}`} />
              ))}
              {layout.lanePositions.map((y, lane) => (
                <line key={lane} x1={0} x2={width} y1={y} y2={y} className="stroke-surface-hover stroke-1" />
              ))}
              <line x1={nowPosition * width} x2={nowPosition * width} y1={0} y2={layout.height - 20}
                className="stroke-calendar-today stroke-1 [stroke-opacity:0.75] [stroke-dasharray:3_4]" />
              <circle cx={nowPosition * width} cy={3} r={2.5} fill="var(--theme-calendar-today)" />
            </svg>
            {layout.entries.map((entry) => (
              <TimelineTask key={entry.task.id} entry={entry} categories={categories} now={now} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 text-[10px] leading-4 text-foreground-secondary tabular-nums" aria-hidden="true">
          {ticks.filter(({ hour }) => hour % 3 === 0).map(({ hour, position }) => (
            <span key={hour} className={`absolute whitespace-nowrap ${hour % 6 !== 0 ? '@max-[560px]:hidden' : ''}`}
              style={{ left: `${position * 100}%`, transform: hour === 0 ? 'none' : hour === 24 ? 'translateX(-100%)' : 'translateX(-50%)' }}>
              {String(hour).padStart(2, '0')}:00
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
