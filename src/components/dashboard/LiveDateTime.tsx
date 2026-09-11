import { useEffect, useState } from 'react'
import { dateTimeFormatterSec } from '../../utils/Datetime.ts'

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
      {dateTimeFormatterSec.format(now)}
    </p>
  )
}

export default LiveDateTime