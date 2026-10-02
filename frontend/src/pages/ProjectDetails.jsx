import { Link, useLocation, useParams } from 'react-router-dom'
import { BrandMark, Icon } from '../components/Icons'
import { getStudentProject } from '../data/studentProjects'

function DetailsSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  )
}

export default function ProjectDetails() {
  const { projectId } = useParams()
  const location = useLocation()
  const stateProject = location.state?.project
  const project =
    stateProject?.id === projectId ? stateProject : getStudentProject(projectId)
  const student = location.state?.student ?? {}
  const backState = Object.keys(student).length > 0 ? { student } : undefined

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
            state={backState}
            to="/student/dashboard"
          >
            <Icon className="rotate-180" name="arrow" size={16} />
            Back to Dashboard
          </Link>
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center sm:p-12">
            <h1 className="font-display text-2xl font-bold text-slate-950">
              Project not found
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              This project isn’t available in the ProjectHub directory.
            </p>
          </section>
        </div>
      </main>
    )
  }

  const sections = [
    { title: 'Overview', content: project.overview },
    { title: 'Abstract', content: project.abstract },
    { title: 'Technologies used', content: project.technologies },
    { title: 'Objectives', content: project.objectives },
    { title: 'Implementation details', content: project.implementationDetails },
    { title: 'Research paper', content: project.researchPaper },
    { title: 'Source code', content: project.sourceCode },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link aria-label="ProjectHub home" className="flex items-center gap-2.5" to="/">
            <BrandMark className="h-9 w-9" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-950">
              Project<span className="text-blue-600">Hub</span>
            </span>
          </Link>
          <span className="hidden text-sm font-semibold text-slate-500 sm:block">
            Project library
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition-colors hover:text-blue-800"
          state={backState}
          to="/student/dashboard"
        >
          <Icon className="rotate-180" name="arrow" size={16} />
          Back to Dashboard
        </Link>

        <section className="mt-7 border-b border-slate-200 pb-7">
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${project.iconStyle}`}>
              <Icon name={project.icon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                Project details
              </p>
              <h1 className="mt-2 break-words font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {project.title}
              </h1>
              <p className="mt-3 text-sm text-slate-500">
                {project.category}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <DetailsSection key={section.title} title={section.title}>
              {section.content || 'Not available yet'}
            </DetailsSection>
          ))}
        </div>
      </main>
    </div>
  )
}