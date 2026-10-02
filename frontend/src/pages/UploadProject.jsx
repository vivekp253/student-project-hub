import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icons'
import StudentDashboardSidebar from '../components/StudentDashboardSidebar'
import StudentDashboardTopbar from '../components/StudentDashboardTopbar'
import {
  clearAccessToken,
  createProject,
  updateProject,
} from '../services/api'

const inputClassName =
  'mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'

const labelClassName = 'block text-sm font-semibold text-slate-700'

export default function UploadProject() {
  const location = useLocation()
  const navigate = useNavigate()
  const student = location.state?.student ?? {}
  const project = location.state?.project
  const isEditing = project?.id !== undefined && project?.id !== null
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()

    if (!title || !description) {
      setFormError('Project title and short description are required.')
      return
    }

    setSubmitting(true)
    try {
      const projectData = {
        title,
        category: String(formData.get('category') ?? '').trim() || null,
        description,
        abstract: String(formData.get('abstract') ?? '').trim() || null,
        technologies:
          String(formData.get('technologies') ?? '').trim() || null,
        status: String(formData.get('status') ?? '').trim() || null,
      }
      const savedProject = isEditing
        ? await updateProject(project.id, projectData)
        : await createProject(projectData)

      navigate('/student/projects', {
        state: {
          student,
          successMessage: isEditing
            ? `“${savedProject.title}” was updated successfully.`
            : `“${savedProject.title}” was saved successfully.`,
        },
      })
    } catch (requestError) {
      if (requestError.status === 401) {
        clearAccessToken()
        setFormError(
          'Your login session is missing or has expired. Please log in again.'
        )
      } else {
        setFormError(requestError.message || 'Project submission failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <StudentDashboardSidebar
        activePage="upload"
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

        <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition-colors hover:text-blue-800"
            state={{ student }}
            to="/student/projects"
          >
            <Icon className="rotate-180" name="arrow" size={16} />
            Back to My Projects
          </Link>

          <header className="mb-7 mt-6 border-b border-slate-200 pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Student workspace
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {isEditing ? 'Edit Project' : 'Upload Project'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Add your project information and submit it to your account.
            </p>
          </header>

          <form
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            onSubmit={handleSubmit}
            onChange={() => setFormError('')}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={`${labelClassName} sm:col-span-2`}>
                Project Title <span className="text-red-600">*</span>
                <input
                  autoComplete="off"
                  className={inputClassName}
                  name="title"
                  defaultValue={project?.title ?? ''}
                  placeholder="Enter your project title"
                  required
                  type="text"
                />
              </label>

              <label className={labelClassName}>
                Project Category
                <select
                  className={inputClassName}
                  defaultValue={project?.category ?? ''}
                  name="category"
                >
                  <option disabled value="">
                    Select a category
                  </option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className={labelClassName}>
                Project Status
                <select
                  className={inputClassName}
                  defaultValue={project?.status ?? ''}
                  name="status"
                >
                  <option disabled value="">
                    Select a status
                  </option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </label>

              <label className={`${labelClassName} sm:col-span-2`}>
                Short Description <span className="text-red-600">*</span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  name="description"
                  defaultValue={project?.description ?? ''}
                  placeholder="Provide a short description of your project"
                  required
                  rows={4}
                />
              </label>

              <label className={`${labelClassName} sm:col-span-2`}>
                Project Abstract
                <textarea
                  className="mt-2 min-h-36 w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  name="abstract"
                  defaultValue={project?.abstract ?? ''}
                  placeholder="Enter the project abstract, if available"
                  rows={5}
                />
              </label>

              <label className={`${labelClassName} sm:col-span-2`}>
                Technologies Used
                <input
                  className={inputClassName}
                  name="technologies"
                  defaultValue={project?.technologies ?? ''}
                  placeholder="Enter technologies used, if available"
                  type="text"
                />
              </label>
            </div>

            {formError && (
              <p
                className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
                role="alert"
              >
                {formError}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                state={{ student }}
                to="/student/projects"
              >
                Cancel
              </Link>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting
                  ? isEditing
                    ? 'Saving...'
                    : 'Submitting...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Submit Project'}
                {!submitting && <Icon name="arrow" size={16} />}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}