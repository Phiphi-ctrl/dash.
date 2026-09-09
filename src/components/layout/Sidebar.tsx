import {
  LayoutDashboard,
  UserRound,
  Settings,
  ChartPie,
  LineStyle,
  Notebook, Calendar, AudioLines,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { DashLogoLight } from "../branding"

function Sidebar() {

  const location = useLocation()

  const mobileNavItems = [
    { to: '/', icon: LineStyle },
    { to: '/calendar', icon: Calendar },
    { to: '/categories', icon: LayoutDashboard },
    { to: '/notes', icon: Notebook },
    { to: '/settings', icon: Settings },
  ]

  const activeIndex = Math.max(
    mobileNavItems.findIndex((item) =>
      item.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.to)
    ),
    0
  )

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
    <>
      <aside
        className="
        hidden
        lg:flex
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
            <DashLogoLight className="size-10" />
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
            Workspaces
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
            to=""
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
            to=""
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

      <nav
        className="
          fixed
          bottom-0
          left-1/2
          z-50

          grid
          h-16
          w-[calc(100%)]
          max-w-md
          -translate-x-1/2
          grid-cols-5

          bg-canvas
          backdrop-blur-xl
          shadow-xl
          rounded-t-4xl
          border
          border-white/2
          !rounded-b-0
          p-1.5

          lg:hidden
        "
      >
        {/* Sliding active background */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-1.5
            top-1.5
            left-1.5

            w-[calc((100%-0.75rem)/5)]
            rounded-4xl
            bg-surface-hover/60

            transition-transform
            duration-300
            ease-out
          "
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {mobileNavItems.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="
              relative
              z-10
              flex
              items-center
              justify-center
              text-foreground
              transition-colors
              duration-200

              [&.active]:text-foreground
            "
          >
            <Icon className="size-5" />
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Sidebar
