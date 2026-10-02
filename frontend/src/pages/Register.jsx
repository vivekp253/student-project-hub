
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthVisual } from '../components/AuthVisual'
import { BrandMark, Icon } from '../components/Icons'

const initialForm = {
  fullName: '',
  studentId: '',
  collegeName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function FormField({
  id,
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-bold text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        type={type}
        value={value}
        required
      />
      <p
        className="min-h-3 text-xs text-red-600"
        id={`${id}-error`}
        role="alert"
      />
    </div>
  )
}

function PasswordField({
  id,
  label,
  name,
  onChange,
  placeholder,
  showPassword,
  onToggle,
  value,
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-bold text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={`${id}-error`}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          type={showPassword ? 'text' : 'password'}
          value={value}
          required
          minLength={8}
        />
        <button
          aria-label={
            showPassword
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={onToggle}
          type="button"
        >
          <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      <p
        className="min-h-3 text-xs text-red-600"
        id={`${id}-error`}
        role="alert"
      />
    </div>
  )
}

export default function Register() {

  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            full_name: form.fullName.trim(),
            student_id: form.studentId.trim(),
            college_name: form.collegeName.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          typeof data.detail === 'string'
            ? data.detail
            : 'Registration failed. Please try again.'
        )
        return
      }

      navigate('/login', {
        state: {
          message: 'Account created successfully! You can now log in.',
        },
      })
      setForm(initialForm)
      setTermsAccepted(false)
      setShowPassword(false)
      setShowConfirmPassword(false)
    } catch {
      setError(
        'Unable to connect to the server. Please try again.'
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
            Already have an account?{' '}
            <Link
              className="font-bold text-blue-600 hover:text-blue-700"
              to="/login"
            >
              Login here
            </Link>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center py-8 sm:py-10">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9 xl:p-10">
            <div className="mb-7">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Join the community
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Create Your Account
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Join Student Project Hub and start exploring projects.
              </p>
            </div>

            <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs font-semibold text-blue-700">
              <Icon name="book" size={17} />
              Student registration
              <span className="ml-auto text-slate-500">
                Admin accounts are managed separately.
              </span>
            </div>

            <form autoComplete="off" className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="register-full-name"
                  label="Full Name"
                  name="fullName"
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  value={form.fullName}
                />
                <FormField
                  id="register-student-id"
                  label="Student ID / Roll Number"
                  name="studentId"
                  onChange={handleChange}
                  placeholder="Enter your student ID"
                  value={form.studentId}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="register-college"
                  label="College Name"
                  name="collegeName"
                  onChange={handleChange}
                  placeholder="Enter your college name"
                  value={form.collegeName}
                />
                <FormField
                  id="register-email"
                  label="Email"
                  name="email"
                  onChange={handleChange}
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  id="register-password"
                  label="Password"
                  name="password"
                  onChange={handleChange}
                  onToggle={() => setShowPassword(!showPassword)}
                  placeholder="Create a password"
                  showPassword={showPassword}
                  value={form.password}
                />
                <PasswordField
                  id="register-confirm-password"
                  label="Confirm Password"
                  name="confirmPassword"
                  onChange={handleChange}
                  onToggle={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  placeholder="Confirm your password"
                  showPassword={showConfirmPassword}
                  value={form.confirmPassword}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-sm leading-6 text-slate-600">
                <input
                  checked={termsAccepted}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onChange={(event) =>
                    setTermsAccepted(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  I agree to the{' '}
                  <a
                    className="font-bold text-blue-600 hover:text-blue-700"
                    href="#terms"
                  >
                    Terms &amp; Conditions
                  </a>
                </span>
              </label>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-sm text-green-600" role="status">
                  {success}
                </p>
              )}

              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <Icon name="arrow" size={17} />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                className="font-bold text-blue-600 hover:text-blue-700"
                to="/login"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </section>

      <AuthVisual />
    </main>
  )
}
