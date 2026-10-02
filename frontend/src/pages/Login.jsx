
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthVisual } from '../components/AuthVisual'
import { BrandMark, Icon } from '../components/Icons'
import { loginStudent, storeAccessToken } from '../services/api'

const roleOptions = [
  { label: 'Student', icon: 'book', description: 'Explore and share projects' },
  { label: 'Admin', icon: 'shield', description: 'Review project submissions' },
]

function RoleOption({ option, selected, onSelect }) {
  const isSelected = selected === option.label

  return (
    <button
      aria-pressed={isSelected}
      className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        isSelected
          ? 'border-blue-500 bg-blue-50/70 text-blue-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'
      }`}
      onClick={() => onSelect(option.label)}
      type="button"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Icon name={option.icon} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{option.label}</span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {option.description}
        </span>
      </span>
      <span
        className={`ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          isSelected ? 'border-blue-600' : 'border-slate-300'
        }`}
      >
        {isSelected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
      </span>
    </button>
  )
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const [role, setRole] = useState('Student')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.message ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!identifier.trim() || !password) {
      setError('Please enter your email or student ID and password.')
      return
    }

    setLoading(true)

    try {
      const data = await loginStudent({
        identifier: identifier.trim(),
        password,
        remember_me: rememberMe,
      })

      if (!data?.access_token) {
        setError('The login response did not include an access token.')
        return
      }
      if (data.account_type !== 'student' && data.account_type !== 'admin') {
        setError('The login response did not include a valid account type.')
        return
      }

      storeAccessToken(data.access_token)
      if (data.account_type === 'admin') {
        navigate('/admin/dashboard', {
          state: {
            admin: {
              id: data.id,
              full_name: data.full_name,
              account_type: data.account_type,
            },
          },
        })
      } else {
        navigate('/student/dashboard', {
          state: {
            student: {
              id: data.id,
              student_id: data.student_id,
              full_name: data.full_name,
            },
          },
        })
      }
    } catch (requestError) {
      setError(
        requestError.status === 401
          ? 'Invalid email or Student ID, or password.'
          : requestError.message || 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
      <section className="order-1 flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Link
            className="flex items-center gap-2.5 lg:hidden"
            to="/"
            aria-label="ProjectHub home"
          >
            <BrandMark className="h-9 w-9" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-950">
              Project<span className="text-blue-600">Hub</span>
            </span>
          </Link>
          <p className="ml-auto text-sm text-slate-500">
            New to ProjectHub?{' '}
            <Link
              className="font-bold text-blue-600 hover:text-blue-700"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 items-center py-8 sm:py-10">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9 xl:p-10">
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Welcome back
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Login to Your Account
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Sign in to explore projects and continue your learning journey.
              </p>
            </div>

            <div className="mb-7">
              <p
                className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700"
                id="role-label"
              >
                Continue as
              </p>
              <div
                aria-labelledby="role-label"
                className="flex gap-3"
                role="group"
              >
                {roleOptions.map((option) => (
                  <RoleOption
                    key={option.label}
                    onSelect={setRole}
                    option={option}
                    selected={role}
                  />
                ))}
              </div>
            </div>

            <form autoComplete="off" className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-bold text-slate-700"
                  htmlFor="login-identity"
                >
                  Email or Student ID
                </label>
                <input
                  aria-describedby="identity-error"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  id="login-identity"
                  name="identity"
                  placeholder="Enter your email or student ID"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />
                <p
                  className="min-h-4 text-xs text-red-600"
                  id="identity-error"
                  role="alert"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    className="text-sm font-bold text-slate-700"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <a
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    href="#forgot-password"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    aria-describedby="password-error"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    id="login-password"
                    name="password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
                <p
                  className="min-h-4 text-xs text-red-600"
                  id="password-error"
                  role="alert"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  checked={rememberMe}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onChange={(event) => setRememberMe(event.target.checked)}
                  type="checkbox"
                />
                Remember me
              </label>

              {error && (
                <p
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                  role="status"
                >
                  {success}
                </p>
              )}

              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? 'Logging in...' : 'Login'}
                {!loading && <Icon name="arrow" size={17} />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                className="font-bold text-blue-600 hover:text-blue-700"
                to="/register"
              >
                Create an account
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400">
              <Icon className="text-emerald-500" name="shield" size={15} />
              Your project knowledge is protected with secure access.
            </div>
          </div>
        </div>
      </section>
      <AuthVisual />
    </main>
  )
}
