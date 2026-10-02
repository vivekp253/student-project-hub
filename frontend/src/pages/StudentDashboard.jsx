import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icons'
import StudentDashboardSidebar from '../components/StudentDashboardSidebar'
import StudentDashboardTopbar from '../components/StudentDashboardTopbar'
import StudentProjectCard from '../components/StudentProjectCard'
import { clearAccessToken, getStudentProjects } from '../services/api'

const summaryCards = [
  { label: 'Total Projects', icon: 'grid', accent: 'blue', count: (projects) => projects.length },
  {
    label: 'In Progress',
    icon: 'paper',
    accent: 'sky',
    count: (projects) => projects.filter((project) => project.status === 'In Progress').length,
  },
  {
    label: 'Pending Review',
    icon: 'spark',
    accent: 'amber',
    count: (projects) => projects.filter((project) => project.moderation_status === 'Pending').length,
  },
]

function toProjectCard(project) {
  return {
    ...project,
    id: String(project.id),
    category: project.category || 'Uncategorized',
    overview: project.description,
    icon: 'paper',
    iconStyle: 'bg-blue-50 text-blue-700',
  }
}

export default function StudentDashboard() {
  const location = useLocation()
  const student = location.state?.student ?? {}
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const studentName = student.full_name?.trim()
  const query = searchQuery.trim().toLowerCase()

  useEffect(() => {
    let isCurrent = true

    getStudentProjects()
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The projects response was not valid.')
        if (isCurrent) setProjects(data.map(toProjectCard))
      })
      .catch((error) => {
        if (!isCurrent) return
        if (error.status === 401) clearAccessToken()
        setNeedsLogin(error.status === 401)
        setLoadError(
          error.status === 401
            ? 'Your login session is missing or has expired.'
            : error.message || 'Your projects could not be loaded.'
        )
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  const summaryValues = useMemo(
    () => summaryCards.map((card) => ({ ...card, value: card.count(projects) })),
    [projects]
  )
  const filteredProjects = useMemo(
    () => projects.filter((project) =>
      [project.title, project.category, project.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ),
    [projects, query]
  )

  function retryLoadingProjects() {
    setLoadError('')
    setNeedsLogin(false)
    setIsLoading(true)
    setReloadKey((currentKey) => currentKey + 1)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StudentDashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        student={student}
      />

      <div className="min-h-screen lg:pl-64">
        <StudentDashboardTopbar
          isMenuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          student={student}
        />

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
          <section className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Student workspace
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-950 sm:text-4xl">
                Student Dashboard
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {studentName
                  ? `Welcome back, ${studentName}.`
                  : 'Welcome back to your ProjectHub workspace.'}
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              state={{ student }}
              to="/student/projects/upload"
            >
              <Icon name="upload" size={17} />
              Upload Project
            </Link>
          </section>

          <section aria-label="Project summaries" className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryValues.map((card) => (
              <article
                className="flex min-h-32 items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                key={card.label}
              >
                <div>
                  <h2 className="text-sm font-semibold text-slate-600">{card.label}</h2>
                  <p className="mt-4 font-display text-3xl font-bold tabular-nums text-slate-950">
                    {isLoading ? '—' : card.value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  card.accent === 'amber'
                    ? 'bg-amber-50 text-amber-700'
                    : card.accent === 'sky'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-blue-50 text-blue-700'
                }`}>
                  <Icon name={card.icon} size={19} />
                </span>
              </article>
            ))}
          </section>

          <section id="explore">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  Your workspace
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  My Projects
                </h2>
              </div>
              <p className="text-sm text-slate-500" aria-live="polite">
                {isLoading ? 'Loading your projects…' : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
              </p>
            </div>

            {loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                <p className="text-sm leading-6 text-red-800" role="alert">{loadError}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {needsLogin && (
                    <Link
                      className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                      state={{ message: 'Please log in to view your projects.' }}
                      to="/login"
                    >
                      Log in
                    </Link>
                  )}
                  <button
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    onClick={retryLoadingProjects}
                    type="button"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading projects" role="status">
                {[0, 1].map((item) => (
                  <div className="min-h-60 animate-pulse rounded-xl border border-slate-200 bg-white p-5" key={item}>
                    <div className="h-10 w-10 rounded-lg bg-slate-100" />
                    <div className="mt-5 h-5 w-2/3 rounded bg-slate-100" />
                    <div className="mt-3 h-4 rounded bg-slate-100" />
                    <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2" aria-label="Your projects">
                {filteredProjects.map((project) => (
                  <StudentProjectCard
                    key={project.id}
                    project={project}
                    student={student}
                  />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-600">
                No projects match “{searchQuery.trim()}”. Try another search.
              </p>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon name="paper" size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900">No projects yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Upload your first project to keep your work organized and track its review status.
                </p>
                <Link
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  state={{ student }}
                  to="/student/projects/upload"
                >
                  <Icon name="upload" size={16} />
                  Upload Project
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}