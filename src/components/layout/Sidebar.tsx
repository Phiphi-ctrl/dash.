import NavButton from './NavButton.tsx'

function Sidebar() {
  return (
    <aside className="z-10 w-64 border-r border-app-border bg-app-background p-10">
      <h1 className="mb-10 text-2xl font-bold">dash.</h1>

      <nav className="flex flex-col gap-2">
        <NavButton label={'Dashboard'} />
        <NavButton label={'Planner'} />
        <NavButton label={'Groceries'} />
      </nav>
    </aside>
  )
}

export default Sidebar
