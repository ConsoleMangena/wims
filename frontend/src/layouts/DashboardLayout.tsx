import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  HomeIcon,
  BugAntIcon,
  MapPinIcon,
  MapIcon,
  UserGroupIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const navItems = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/species', label: 'Species', Icon: BugAntIcon },
  { to: '/sightings', label: 'Sightings', Icon: MapPinIcon },
  { to: '/reserves', label: 'Reserves', Icon: MapIcon },
  { to: '/hunters', label: 'Hunters', Icon: UserGroupIcon },
  { to: '/licences', label: 'Licences', Icon: IdentificationIcon },
  { to: '/poaching', label: 'Poaching', Icon: ExclamationTriangleIcon },
  { to: '/quotas', label: 'Quotas', Icon: ClipboardDocumentListIcon },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false) // desktop only
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans">
      <div className="flex min-h-screen w-full">
        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-50 w-64 max-w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <span className="font-bold tracking-wide">WIMS</span>
                <button
                  aria-label="Close sidebar"
                  className="p-1 rounded hover:bg-slate-800"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="px-2 py-3">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        title={item.label}
                        className={({ isActive }) =>
                          cx(
                            'flex items-center gap-3 rounded px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white border-l-2 border-transparent',
                            isActive && 'bg-slate-800/60 text-white border-emerald-400'
                          )
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        <item.Icon className="h-5 w-5" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside
          className={
            cx(
              'hidden md:block bg-gradient-to-b from-slate-900 to-slate-950 text-white h-screen sticky top-0 transition-all duration-300 overflow-y-auto',
              collapsed ? 'w-16' : 'w-64'
            )
          }
        >
          <div className="hidden md:flex items-center justify-between p-4 border-b border-slate-800">
            <span className={cx('font-bold tracking-wide', collapsed && 'hidden')}>WIMS</span>
            <button
              aria-label="Toggle sidebar"
              className="p-1 rounded hover:bg-slate-800"
              onClick={() => setCollapsed((c) => !c)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <nav className="px-2 py-3">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    title={item.label}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-3 rounded px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white border-l-2 border-transparent',
                        isActive && 'bg-slate-800/60 text-white border-emerald-400'
                      )
                    }
                  >
                    <item.Icon className={cx('h-5 w-5', collapsed && 'mx-auto')} aria-hidden="true" />
                    <span className={cx('truncate', collapsed && 'hidden')}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="h-16 bg-white/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button
                aria-label="Open menu"
                className="md:hidden p-2 rounded hover:bg-slate-100"
                onClick={() => setMobileOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="font-semibold tracking-tight">Wildlife Management Dashboard</div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden lg:inline">{collapsed ? 'Sidebar collapsed' : 'Sidebar expanded'}</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title="Online" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
