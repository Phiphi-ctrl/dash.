import { useEffect, useState } from 'react'
import { Dot } from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function LiveDateTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <p className="flex items-center text-sm text-muted py-4 gap-2">
      {dateFormatter.format(now)} <Dot size={14}/> {timeFormatter.format(now)}
    </p>
  )
}

export default LiveDateTime