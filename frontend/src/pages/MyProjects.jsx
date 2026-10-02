import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icons'
import StudentDashboardSidebar from '../components/StudentDashboardSidebar'
import StudentDashboardTopbar from '../components/StudentDashboardTopbar'
import StudentProjectCard from '../components/StudentProjectCard'
import {
  clearAccessToken,
  deleteProject,
  getStudentProjects,
} from '../services/api'

function toProjectCard(project) {
  return {
    ...project,
    id: String(project.id),
    category: project.category || 'Not available yet',
    overview: project.description,
    icon: 'paper',
    iconStyle: 'bg-blue-50 text-blue-600',
  }
}

export default function MyProjects() {
  const location = useLocation()
  const student = location.state?.student ?? {}
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [actionMessage, setActionMessage] = useState(
    location.state?.successMessage ?? ''
  )
  const [actionError, setActionError] = useState('')
  const [deletingProjectId, setDeletingProjectId] = useState(null)

  useEffect(() => {
    let isCurrent = true

    getStudentProjects()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('The projects response was not valid.')
        }
        if (isCurrent) setProjects(data.map(toProjectCard))
      })
      .catch((error) => {
        if (!isCurrent) return
        if (error.status === 401) {
          clearAccessToken()
          setNeedsLogin(true)
          setLoadError('Your login session is missing or has expired.')
        } else {
          setLoadError(error.message || 'Projects could not be loaded.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  function retryLoadingProjects() {
    setLoadError('')
    setNeedsLogin(false)
    setIsLoading(true)
    setReloadKey((currentKey) => currentKey + 1)
  }

  async function handleDeleteProject(project) {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) {
      return
    }

    setDeletingProjectId(project.id)
    setActionError('')
    setActionMessage('')

    try {
      await deleteProject(project.id)
      setProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== project.id)
      )
      setActionMessage(`“${project.title}” was deleted successfully.`)
    } catch (error) {
      if (error.status === 401) {
        clearAccessToken()
        setNeedsLogin(true)
        setActionError('Your login session has expired. Please log in again.')
      } else {
        setActionError(error.message || 'Project could not be deleted.')
      }
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StudentDashboardSidebar
        activePage="my-projects"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        student={student}
      />

      <div className="min-h-screen lg:pl-64">
        <StudentDashboardTopbar
          onMenuClick={() => setSidebarOpen(true)}
          showSearch={false}
          student={student}
        />

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Student workspace
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                My Projects
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Projects you upload will be listed here.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                state={{ student }}
                to="/student/projects/upload"
              >
                <Icon name="upload" size={17} />
                Upload Project
              </Link>
            </div>
          </header>

          {actionMessage && (
            <p
              className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
              role="status"
            >
              {actionMessage}
            </p>
          )}

          {actionError && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm leading-6 text-red-800" role="alert">
                {actionError}
              </p>
              {needsLogin && (
                <Link
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                  state={{ message: 'Please log in to manage your projects.' }}
                  to="/login"
                >
                  Log in
                </Link>
              )}
            </div>
          )}

          <section aria-labelledby="my-project-list-title">
            <div className="mb-4">
              <h2
                className="font-display text-xl font-bold text-slate-900"
                id="my-project-list-title"
              >
                Your project list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Projects associated with your account will appear here.
              </p>
            </div>

            {isLoading ? (
              <p
                className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500"
                role="status"
              >
                Loading your projects...
              </p>
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                <p className="text-sm leading-6 text-red-800" role="alert">
                  {loadError}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {needsLogin && (
                    <Link
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                      state={{ message: 'Please log in to view your projects.' }}
                      to="/login"
                    >
                      Log in
                    </Link>
                  )}
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    onClick={retryLoadingProjects}
                    type="button"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <StudentProjectCard
                    actionsBusy={deletingProjectId !== null}
                    editable
                    isDeleting={deletingProjectId === project.id}
                    key={project.id}
                    onDelete={handleDeleteProject}
                    project={project}
                    student={student}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon name="paper" size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                  No projects uploaded yet
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Your submitted projects will appear here once you add them.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}