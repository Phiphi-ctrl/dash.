function Dashboard() {
  return (
    <main className="flex-1 bg-neutral-900 p-8">
      <header className="mb-8">
        <p className="text-sm text-neutral-400">Saturday, 25 July</p>

        <h2 className="text-3xl font-semibold">Dashboard</h2>
      </header>

      <section className="max-w-2xl rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h3 className="mb-4 text-xl font-semibold">Today's plan</h3>

        <p className="text-neutral-400">Nothing planned yet.</p>
      </section>
    </main>
  )
}

export default Dashboard
