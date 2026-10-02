import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, getAdminProjects } from '../services/api'

export default function ProtectedAdminRoute({ children }) {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function checkAccess() {
      const token = getAccessToken()
      if (!token) {
        if (isCurrent) {
          setIsAuthorized(false)
          setIsChecking(false)
        }
        return
      }

      try {
        await getAdminProjects()
        if (isCurrent) {
          setIsAuthorized(true)
        }
      } catch {
        if (isCurrent) {
          setIsAuthorized(false)
        }
      } finally {
        if (isCurrent) {
          setIsChecking(false)
        }
      }
    }

    checkAccess()

    return () => {
      isCurrent = false
    }
  }, [location.pathname])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-sm font-medium text-slate-500">
        Checking admin access…
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <Navigate
        replace
        state={{ message: 'Sign in with an Admin account to continue.' }}
        to="/login"
      />
    )
  }

  return children
}
