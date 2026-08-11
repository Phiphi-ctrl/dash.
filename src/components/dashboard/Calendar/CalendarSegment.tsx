import type { Task } from '../../../types/Task.ts'
import { getHourRange } from '../../../utils/Datetime.ts'
import type { DragState } from './CalendarElement.tsx'
import type { Ref } from 'react'


type CalendarTaskSegment = {
  task: Task
  dayIndex: number
  startSlot: number
  endSlot: number
}

type PositionedCalendarTaskSegment = CalendarTaskSegment & {
  laneIndex: number
  laneCount: number
}

type CalendarSegmentsProps = {
  positionedTaskSegments: PositionedCalendarTaskSegment[]
  dragState: DragState
  draggedLayoutRef: Ref<HTMLDivElement> | null
  draggedCardRef: Ref<HTMLDivElement> | null
  draggedSurfaceRef: Ref<HTMLDivElement> | null
  onEdit: (task: Task) => void
  setDragState: (state: DragState) => void
}

function CalendarSegments ({ positionedTaskSegments, dragState, draggedLayoutRef, draggedCardRef, draggedSurfaceRef, onEdit, setDragState }: CalendarSegmentsProps) {
  return (
    <div>

    </div>
  )
}

export default CalendarSegments