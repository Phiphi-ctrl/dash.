import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import { PieChart } from 'lucide-react'

function Stats() {
  return (
    <main className="flex h-full min-h-0 flex-1 flex-col p-10">
      <header className="flex flex-col gap-2">
        <LiveDateTime />
        <div className="flex gap-4 items-center">
          <PieChart className="size-12 text-muted"/>
          <h2 className="text-5xl font-bold">stats.</h2>
        </div>
      </header>
    </main>
  )
}

export default Stats
