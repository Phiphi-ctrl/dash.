import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="flex min-h-screen text-white">
      <Sidebar />
      <Dashboard />
    </div>
  )
}

export default App
