import Dashboard from './pages/Dashboard'
import Sidebar from './components/layout/Sidebar.tsx'

function App() {
  return (
    <div className="flex h-full text-white overflow-hidden">
      <Sidebar />
      <div className="min-w-0 min-h-0 flex-1 overflow-y-auto">
        <Dashboard />
      </div>
    </div>
  )
}

export default App
