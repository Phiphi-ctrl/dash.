import {
  LayoutDashboard,
  Minus,
  Calendar,
  UserRound,
  Settings,
  ChartPie,
  House,
  LibraryBig
} from 'lucide-react'

function Sidebar() {

  const spanStyle = `
  ml-3 
  whitespace-nowrap 
  opacity-0 
  transition-[opacity,transform] 
  duration-300 
  delay-0 
  group-hover/sidebar:delay-100
  group-hover/sidebar:translate-x-0 
  group-hover/sidebar:opacity-100
  `

  return (
    <aside
      className="
      flex
      flex-col
      group/sidebar
      pl-4
      pr-4
      pb-8
      pt-8
      z-10
      w-24
      shrink-0
      overflow-hidden
      rounded-3xl
      border-r
      border-border
      bg-canvas
      transition-[width]
      duration-300
      ease-out
      hover:w-64
      "
    >

      {/*logo*/}
      <div className="flex h-16 items-center px-4">
        <div className="flex size-8 shrink-0 items-center justify-center">
          <Minus className="size-10" />
        </div>

        <span
          className={`
          text-2xl 
          font-bold 
          before:bg-gradient-to-r from-white to-blue-400
          ${spanStyle}
          `}
        >
        dash.
        </span>
      </div>

      {/*Main Navigation*/}
      <div className="mt-15 flex flex-col gap-4">
        <button
          type="button"
          className="
          flex
          h-11
          w-full
          items-center
          rounded-lg
          px-4
          text-foreground-secondary
          transition-colors
          hover:bg-surface-hover
          hover:text-foreground
          "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <House className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Home
          </span>
        </button>
        <button
          type="button"
          className="
          flex
          h-11
          w-full
          items-center
          rounded-lg
          px-4
          text-foreground-secondary
          transition-colors
          hover:bg-surface-hover
          hover:text-foreground
          "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <LayoutDashboard className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Dashboard
          </span>
        </button>

        <button
          type="button"
          className="
          flex
          h-11
          w-full
          items-center
          rounded-lg
          px-4
          text-foreground-secondary
          transition-colors
          hover:bg-surface-hover
          hover:text-foreground
          "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <Calendar className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Calendar
          </span>
        </button>
        <button
          type="button"
          className="
          flex
          h-11
          w-full
          items-center
          rounded-lg
          px-4
          text-foreground-secondary
          transition-colors
          hover:bg-surface-hover
          hover:text-foreground
          "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <ChartPie className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Stats
          </span>
        </button>
        <button
          type="button"
          className="
          flex
          h-11
          w-full
          items-center
          rounded-lg
          px-4
          text-foreground-secondary
          transition-colors
          hover:bg-surface-hover
          hover:text-foreground
          "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <LibraryBig className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Notes
          </span>
        </button>
      </div>

      {/*Bottom Navigation*/}
      <div className="mt-auto flex flex-col">
        <button
          type="button"
          className="
        flex
        h-11
        w-full
        items-center
        rounded-lg
        px-4
        text-foreground-secondary
        transition-colors
        hover:bg-surface-hover
        hover:text-foreground
        "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <UserRound className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Profile
          </span>
        </button>

        <button
          type="button"
          className="
        flex
        h-11
        w-full
        items-center
        rounded-lg
        px-4
        text-foreground-secondary
        transition-colors
        hover:bg-surface-hover
        hover:text-foreground
        "
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            <Settings className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Settings
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
