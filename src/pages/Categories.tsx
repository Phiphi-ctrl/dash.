import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import { LayoutDashboard } from 'lucide-react'

function Categories() {
  return (
    <main className="flex flex-1 flex-col p-10">
      <header className="flex flex-col gap-2">
        <LiveDateTime />
        <div className="flex gap-4 items-center">
          <LayoutDashboard className="size-12 text-muted"/>
          <h2 className="text-5xl font-bold">categories.</h2>
        </div>
      </header>
    </main>
  )
}

export default Categories