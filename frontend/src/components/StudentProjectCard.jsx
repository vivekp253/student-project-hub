import { Link } from 'react-router-dom'
import { Icon } from './Icons'

export default function StudentProjectCard({
  actionsBusy = false,
  editable = false,
  isDeleting = false,
  onDelete,
  project,
  student,
}) {
  return (
    <article className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${project.iconStyle}`}>
          <Icon name={project.icon} size={21} />
        </span>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {project.category}
        </span>
      </div>

      <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
        {project.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {project.description}
      </p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {editable && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Link
              aria-disabled={actionsBusy}
              className={`inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                actionsBusy ? 'pointer-events-none opacity-50' : ''
              }`}
              onClick={(event) => {
                if (actionsBusy) event.preventDefault()
              }}
              state={{ student, project }}
              tabIndex={actionsBusy ? -1 : undefined}
              to="/student/projects/upload"
            >
              Edit
            </Link>
            <button
              className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actionsBusy}
              onClick={() => onDelete?.(project)}
              type="button"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-400">Project record</span>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            state={{ project, student }}
            to={`/projects/${project.id}`}
          >
            View Details
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}