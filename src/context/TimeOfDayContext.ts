import { createContext, useContext } from 'react'

type TimeOfDayGradientStop = {
  offset: string
  color: string
}

type TimeOfDayProgressGradient = {
  id: string
  glowColor: string
  stops: TimeOfDayGradientStop[]
}

export type TimeOfDayTheme = {
  label: string
  gradient: string
  dayProgressGradient: TimeOfDayProgressGradient
}

type TimeOfDayContextValue = {
  now: Date
  theme: TimeOfDayTheme
}

export const TimeOfDayContext = createContext<TimeOfDayContextValue | null>(null)

export function useTimeOfDay(): TimeOfDayContextValue {
  const value = useContext(TimeOfDayContext)
  if (value === null) {
    throw new Error('useTimeOfDay must be used within the App time-of-day provider')
  }
  return value
}

export function getTimeOfDay(now: Date): TimeOfDayTheme {
  const hour = now.getHours()

  if (hour >= 5 && hour < 12) {
    return {
      label: "Morning",
      gradient:
        "bg-linear-to-r from-amber-300 via-orange-400 to-rose-400",
      dayProgressGradient: {
        id: 'dashboard-day-progress-morning',
        glowColor: '#fb923c',
        stops: [
          { offset: '0%', color: '#fcd34d' },
          { offset: '50%', color: '#fb923c' },
          { offset: '100%', color: '#fb7185' },
        ],
      },
    }
  }

  if (hour >= 12 && hour < 17) {
    return {
      label: "Afternoon",
      gradient:
        "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-500",
      dayProgressGradient: {
        id: 'dashboard-day-progress-afternoon',
        glowColor: '#22d3ee',
        stops: [
          { offset: '0%', color: '#38bdf8' },
          { offset: '50%', color: '#22d3ee' },
          { offset: '100%', color: '#3b82f6' },
        ],
      },
    }
  }

  if (hour >= 17 && hour < 22) {
    return {
      label: "Evening",
      gradient:
        "bg-linear-to-r from-orange-500 via-rose-500 to-purple-500",
      dayProgressGradient: {
        id: 'dashboard-day-progress-evening',
        glowColor: '#f43f5e',
        stops: [
          { offset: '0%', color: '#f97316' },
          { offset: '50%', color: '#f43f5e' },
          { offset: '100%', color: '#a855f7' },
        ],
      },
    }
  }

  return {
    label: "Night",
    gradient:
      "bg-linear-to-r from-indigo-400 via-violet-500 to-purple-600",
    dayProgressGradient: {
      id: 'dashboard-day-progress-night',
      glowColor: '#8b5cf6',
      stops: [
        { offset: '0%', color: '#818cf8' },
        { offset: '50%', color: '#8b5cf6' },
        { offset: '100%', color: '#9333ea' },
      ],
    },
  }
}
