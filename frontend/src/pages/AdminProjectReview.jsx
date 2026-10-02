import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAdminProject, reviewAdminProject } from '../services/api'

export default function AdminProjectReview() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const reviewable = useMemo(
    () => ['Pending', 'Changes Requested'].includes(project?.moderation_status),
    [project]
  )

  const loadProject = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getAdminProject(projectId)
      setProject(data)
      setFeedback(data.review_feedback || '')
    } catch (requestError) {
      setError(
        requestError.message || 'The project review details could not be loaded.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProject()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadProject])

  async function handleDecision(action) {
    if (!project) return

    const trimmedFeedback = feedback.trim()
    if (action !== 'approve' && !trimmedFeedback) {
      setError('Feedback is required for rejection and change requests.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const updatedProject = await reviewAdminProject(
        project.id,
        action,
        trimmedFeedback
      )
      setProject(updatedProject)
      setFeedback(updatedProject.review_feedback || '')
      await loadProject()
      setSuccessMessage(
        action === 'approve'
          ? 'Project approved successfully.'
          : action === 'reject'
            ? 'Project rejected successfully.'
            : 'Change request recorded successfully.'
      )
    } catch (requestError) {
      setError(
        requestError.message || 'The review action could not be completed.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-sm text-slate-500">
        Loading project review…
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm leading-6 text-red-800">{error}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              onClick={() => navigate('/admin/dashboard')}
              type="button"
            >
              Back to dashboard
            </button>
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={loadProject}
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <header className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Review submission
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {project?.title || 'Project Review'}
            </h1>
          </div>
          <Link
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            to="/admin/dashboard"
          >
            ← Back to dashboard
          </Link>
        </header>

        {successMessage ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {project?.category || 'Category not provided'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {project?.moderation_status || 'Status unavailable'}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                  Description
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {project?.description || 'No project description was provided.'}
                </p>
              </div>

              <div>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                  Abstract
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {project?.abstract || 'No abstract was provided.'}
                </p>
              </div>

              <div>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                  Technologies
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {project?.technologies || 'No technologies were provided.'}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
              Submission details
            </h2>

            <dl className="mt-5 space-y-4 text-sm text-slate-700">
              <div>
                <dt className="font-semibold text-slate-500">Owner ID</dt>
                <dd className="mt-1 font-medium">#{project?.owner_id ?? 'Unavailable'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Project status</dt>
                <dd className="mt-1 font-medium">{project?.status || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Submitted</dt>
                <dd className="mt-1 font-medium">
                  {project?.created_at
                    ? new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(project.created_at))
                    : 'Date unavailable'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Latest feedback</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-600">
                  {project?.review_feedback || 'No feedback has been recorded yet.'}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-bold text-slate-700" htmlFor="review-feedback">
                Review feedback
              </label>
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                id="review-feedback"
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Provide feedback for the student or leave it blank for approval."
                value={feedback}
              />
            </div>

            <div className="mt-6 space-y-3">
              <button
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || !reviewable}
                onClick={() => handleDecision('approve')}
                type="button"
              >
                {isSubmitting ? 'Approving…' : 'Approve project'}
              </button>

              <button
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || !reviewable}
                onClick={() => handleDecision('reject')}
                type="button"
              >
                {isSubmitting ? 'Rejecting…' : 'Reject project'}
              </button>

              <button
                className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || !reviewable}
                onClick={() => handleDecision('request-changes')}
                type="button"
              >
                {isSubmitting ? 'Requesting changes…' : 'Request changes'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
