import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AdminProjectTable from '../components/AdminProjectTable'
import AdminSummaryCard from '../components/AdminSummaryCard'
import AdminDashboardSidebar from '../components/AdminDashboardSidebar'
import AdminDashboardTopbar from '../components/AdminDashboardTopbar'
import { Icon } from '../components/Icons'
import { getAdminProjects } from '../services/api'

const moderationCounts = [
  { label: 'Total Projects', status: null, icon: 'grid', accent: 'blue' },
  { label: 'Pending', status: 'Pending', icon: 'paper', accent: 'amber' },
  { label: 'Approved', status: 'Approved', icon: 'check', accent: 'emerald' },
  { label: 'Rejected', status: 'Rejected', icon: 'shield', accent: 'red' },
  {
    label: 'Changes Requested',
    status: 'Changes Requested',
    icon: 'spark',
    accent: 'orange',
  },
]

const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Changes Requested']

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const admin = location.state?.admin ?? {}
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    let isCurrent = true

    async function loadProjects() {
      try {
        const data = await getAdminProjects()
        if (!Array.isArray(data)) {
          throw new Error('The Admin projects response was not valid.')
        }
        if (isCurrent) {
          setProjects(data)
          setLoadError('')
        }
      } catch (error) {
        if (!isCurrent) return
        setAccessDenied(error.status === 403)
        setLoadError(
          error.status === 403
            ? 'This account is not authorized to view Admin submissions.'
            : error.message || 'Project submissions could not be loaded.'
        )
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isCurrent = false
    }
  }, [])

  const summaryCounts = useMemo(() => ({
    total: projects.length,
    Pending: projects.filter((project) => project.moderation_status === 'Pending').length,
    Approved: projects.filter((project) => project.moderation_status === 'Approved').length,
    Rejected: projects.filter((project) => project.moderation_status === 'Rejected').length,
    'Changes Requested': projects.filter(
      (project) => project.moderation_status === 'Changes Requested'
    ).length,
  }), [projects])

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'All' || project.moderation_status === statusFilter
      const matchesText = !query || [project.title, project.category, project.owner_id]
        .filter((value) => value != null)
        .some((value) => String(value).toLowerCase().includes(query))

      return matchesStatus && matchesText
    })
  }, [projects, searchQuery, statusFilter])

  function retryLoading() {
    setLoadError('')
    setAccessDenied(false)
    setIsLoading(true)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminDashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        admin={admin}
      />

      <div className="min-h-screen lg:pl-64">
        <AdminDashboardTopbar
          admin={admin}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-8 border-b border-slate-200 pb-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Administration
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Review project submissions and monitor their moderation status.
            </p>
          </header>

          <section
            aria-label="Project moderation summary"
            className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            {moderationCounts.map((item) => (
              <AdminSummaryCard
                accent={item.accent}
                icon={item.icon}
                key={item.label}
                label={item.label}
                value={item.status ? summaryCounts[item.status] ?? 0 : summaryCounts.total}
              />
            ))}
          </section>

          <section
            className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            id="project-reviews"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                Moderation queue
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                Project Reviews
              </h2>
            </div>

            <div className="flex w-full items-center gap-3 sm:max-w-xs">
              <label className="flex-1 text-sm font-medium text-slate-600" htmlFor="status-filter">
                Status
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  id="status-filter"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  value={statusFilter}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
              <p className="text-sm leading-6 text-red-800" role="alert">
                {loadError}
              </p>
              {accessDenied ? (
                <Link
                  className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                  state={{ message: 'Sign in with an Admin account to continue.' }}
                  to="/login"
                >
                  Return to login
                </Link>
              ) : (
                <button
                  className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  onClick={retryLoading}
                  type="button"
                >
                  Try again
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div
              className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500"
              role="status"
            >
              Loading project submissions...
            </div>
          ) : (
            <>
              <p className="mb-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <Icon className="mt-0.5 shrink-0 text-blue-600" name="users" size={15} />
                The Admin projects API returns the student owner record ID, but not the student name or Student ID.
              </p>
              <AdminProjectTable
                onSelectProject={(project) => navigate(`/admin/projects/${project.id}`)}
                projects={filteredProjects}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
