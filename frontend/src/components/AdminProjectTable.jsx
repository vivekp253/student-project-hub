const moderationStyles = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-800',
  Rejected: 'bg-red-50 text-red-800',
  'Changes Requested': 'bg-orange-50 text-orange-800',
}

function formatSubmittedDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date)
}

export default function AdminProjectTable({ projects, onSelectProject }) {
  if (projects.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <h3 className="font-display text-lg font-bold text-slate-900">
          No matching submissions
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          No projects match the current search or moderation filter.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4" scope="col">Project</th>
              <th className="px-5 py-4" scope="col">Student owner</th>
              <th className="px-5 py-4" scope="col">Category</th>
              <th className="px-5 py-4" scope="col">Submitted</th>
              <th className="px-5 py-4" scope="col">Moderation</th>
              <th className="px-5 py-4 text-right" scope="col">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr className="align-top hover:bg-slate-50/70" key={project.id}>
                <td className="max-w-xs px-5 py-4">
                  <p className="break-words font-bold text-slate-900">
                    {project.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {project.description}
                  </p>
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {project.owner_id != null ? `Owner record #${project.owner_id}` : 'Not returned by API'}
                  <p className="mt-1 text-xs text-slate-400">
                    Name and Student ID are not included in the Admin project response.
                  </p>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {project.category || 'Not provided'}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {formatSubmittedDate(project.created_at)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-bold ${
                      moderationStyles[project.moderation_status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {project.moderation_status || 'Status unavailable'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    onClick={() => onSelectProject?.(project)}
                    type="button"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
