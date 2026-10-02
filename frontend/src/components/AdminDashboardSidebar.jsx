import { Link, useNavigate } from 'react-router-dom'
import { BrandMark, Icon } from './Icons'
import { logoutStudent } from '../services/api'

export default function AdminDashboardSidebar({ isOpen, onClose, admin = {} }) {
  const navigate = useNavigate()

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
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-[76px] items-center border-b border-slate-100 px-6">
          <Link aria-label="ProjectHub home" className="flex items-center gap-2.5" to="/">
            <BrandMark className="h-9 w-9" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-950">
              Project<span className="text-blue-600">Hub</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Admin dashboard" className="flex-1 space-y-1 px-3 py-6">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Administration
          </p>
          <Link
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700"
            onClick={onClose}
            state={{ admin }}
            to="/admin/dashboard"
          >
            <Icon name="grid" size={18} />
            Dashboard
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-700"
            onClick={onClose}
            state={{ admin }}
            to="/admin/dashboard#project-reviews"
          >
            <Icon name="paper" size={18} />
            Project Reviews
          </Link>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
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
