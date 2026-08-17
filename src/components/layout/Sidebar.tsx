import {
  LayoutDashboard,
  Minus,
  UserRound,
  Settings,
  ChartPie,
  LineStyle,
  Notebook, Calendar, AudioLines,
} from 'lucide-react'
import { NavLink } from 'react-router'

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
      glass-sidebar
      transition-[width]
      duration-300
      ease-out
      hover:w-64
      "
    >

      {/*logo*/}
      <div className="flex h-16 items-center px-4 text-foreground">
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
        <NavLink
          to="/"
          end
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
            <LineStyle className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Board
          </span>
        </NavLink>
        <NavLink
          to="/calendar"
          end
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
        </NavLink>
        <NavLink
          to="/categories"
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
            Categories
          </span>
        </NavLink>
        <NavLink
          to="/stats"
          end
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
        </NavLink>
        <NavLink
          to="/notes"
          end
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
            <Notebook className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Notes
          </span>
        </NavLink>
        <NavLink
          end
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
            <AudioLines className="size-5" />
          </div>

          <span
            className={spanStyle}
          >
            Audio
          </span>
        </NavLink>
      </div>

      {/*Bottom Navigation*/}
      <div className="mt-auto flex flex-col">
        <NavLink
          end
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
        </NavLink>

        <NavLink
          to="/settings"
          end
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
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
