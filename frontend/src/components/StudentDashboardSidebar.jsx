import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BrandMark, Icon } from './Icons'
import { logoutStudent } from '../services/api'

export default function StudentDashboardSidebar({
  activePage = 'dashboard',
  isOpen,
  onClose,
  student = {},
}) {
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = useState(() =>
    window.matchMedia('(min-width: 1024px)').matches
  )
  const navigationState =
    Object.keys(student).length > 0 ? { student } : undefined

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event) => setIsDesktop(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  async function handleLogout(event) {
    event.preventDefault()
    onClose?.()
    try {
      await logoutStudent()
    } catch {
      // Navigate locally even if the backend cannot be reached during logout.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close dashboard navigation"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        id="student-dashboard-sidebar"
        aria-label="Student dashboard navigation"
        inert={!isOpen && !isDesktop}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-[76px] items-center border-b border-slate-100 px-6">
          <Link
            aria-label="ProjectHub home"
            className="flex items-center gap-2.5"
            onClick={onClose}
            to="/"
          >
            <BrandMark className="h-9 w-9" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-950">
              Project<span className="text-blue-600">Hub</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Student dashboard" className="flex-1 space-y-1 px-3 py-6">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <Link
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              activePage === 'dashboard'
                ? 'bg-blue-50 font-bold text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
            }`}
            onClick={onClose}
            state={navigationState}
            to="/student/dashboard"
          >
            <Icon name="grid" size={18} />
            Dashboard
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            onClick={onClose}
            state={navigationState}
            to="/student/dashboard#explore"
          >
            <Icon name="search" size={18} />
            Explore Projects
          </Link>

          <Link
            aria-current={activePage === 'my-projects' ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              activePage === 'my-projects'
                ? 'bg-blue-50 font-bold text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
            }`}
            onClick={onClose}
            state={navigationState}
            to="/student/projects"
          >
            <Icon name="paper" size={18} />
            My Projects
          </Link>

          <Link
            aria-current={activePage === 'upload' ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              activePage === 'upload'
                ? 'bg-blue-50 font-bold text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
            }`}
            onClick={onClose}
            state={navigationState}
            to="/student/projects/upload"
          >
            <Icon name="upload" size={18} />
            Upload Project
          </Link>

          <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Account
          </p>
          <div
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400"
            title="My Profile is coming soon"
          >
            <Icon name="users" size={18} />
            <span>My Profile</span>
            <span className="ml-auto text-[10px] font-medium">Soon</span>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            onClick={handleLogout}
            to="/login"
          >
            <Icon className="rotate-180" name="arrow" size={18} />
            Logout
          </Link>
        </div>
      </aside>
    </>
  )
}