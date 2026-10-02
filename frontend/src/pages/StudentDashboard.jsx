import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../components/Icons'
import StudentDashboardSidebar from '../components/StudentDashboardSidebar'
import StudentDashboardTopbar from '../components/StudentDashboardTopbar'
import StudentProjectCard from '../components/StudentProjectCard'
import { studentProjects } from '../data/studentProjects'

const summaryCards = [
  { label: 'Total Projects', icon: 'grid' },
  { label: 'My Projects', icon: 'paper' },
  { label: 'Saved Projects', icon: 'spark' },
]

export default function StudentDashboard() {
  const location = useLocation()
  const student = location.state?.student ?? {}
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const studentName = student.full_name?.trim()
  const studentId = student.student_id || 'Unavailable'
  const query = searchQuery.trim().toLowerCase()
  const filteredProjects = studentProjects.filter((project) =>
    project.title.toLowerCase().includes(query)
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StudentDashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        student={student}
      />

      <div className="min-h-screen lg:pl-64">
        <StudentDashboardTopbar
          onMenuClick={() => setSidebarOpen(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          student={student}
        />

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <section className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Student workspace
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Student Dashboard
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {studentName
                  ? `Welcome back, ${studentName}.`
                  : 'Welcome back to your ProjectHub workspace.'}
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm">
              <span className="text-slate-500">Student ID</span>
              <span className="font-bold text-slate-800">{studentId}</span>
            </div>
          </section>

          <section aria-label="Project summaries" className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
              <article
                className="flex min-h-36 items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                key={card.label}
              >
                <div>
                  <h2 className="text-sm font-bold text-slate-700">{card.label}</h2>
                  <p className="mt-4 font-display text-3xl font-bold text-slate-900">—</p>
                  <p className="mt-1 text-xs text-slate-400">Project data not available yet</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon name={card.icon} size={19} />
                </span>
              </article>
            ))}
          </section>

          <section id="explore">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Project library
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  Explore Projects
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Project descriptions and categories are placeholders.
              </p>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                {filteredProjects.map((project) => (
                  <StudentProjectCard
                    key={project.id}
                    project={project}
                    student={student}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
                No projects match “{searchQuery.trim()}”.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}