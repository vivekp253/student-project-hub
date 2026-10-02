import { Link } from 'react-router-dom'
import { Icon } from './Icons'

function getStatusStyle(status, kind) {
  if (kind === 'moderation') {
    return {
      Pending: 'border-amber-200 bg-amber-50 text-amber-800',
      Approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      Rejected: 'border-red-200 bg-red-50 text-red-800',
      'Changes Requested': 'border-orange-200 bg-orange-50 text-orange-800',
    }[status] || 'border-slate-200 bg-slate-50 text-slate-700'
  }

  return {
    Completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    'In Progress': 'border-blue-200 bg-blue-50 text-blue-800',
  }[status] || 'border-slate-200 bg-slate-50 text-slate-700'
}

export default function StudentProjectCard({
  actionsBusy = false,
  editable = false,
  isDeleting = false,
  onDelete,
  project,
  student,
}) {
  const projectStatus = project.status || 'Not specified'
  const moderationStatus = project.moderation_status || 'Pending'

  return (
    <article className="group flex min-h-60 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${project.iconStyle || 'bg-blue-50 text-blue-700'}`}>
          <Icon name={project.icon} size={21} />
        </span>
        <span className="max-w-[65%] truncate rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {project.category || 'Uncategorized'}
        </span>
      </div>

      <h3 className="mt-4 break-words font-display text-lg font-bold leading-6 text-slate-950">
        {project.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
        {project.description || 'No project description has been provided.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Project status" role="group">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(projectStatus, 'project')}`}>
          <span className="text-[10px] font-bold uppercase tracking-wide">Work</span>
          {projectStatus}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(moderationStatus, 'moderation')}`}>
          <span className="text-[10px] font-bold uppercase tracking-wide">Review</span>
          {moderationStatus}
        </span>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        {editable && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Link
              aria-disabled={actionsBusy}
              className={`inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
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
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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