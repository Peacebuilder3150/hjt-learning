import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import Brand from './Brand.jsx'

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="animate-pulse">
        <Brand large />
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { member, loading } = useAuth()
  if (loading) return <Splash />
  return member ? <Outlet /> : <Navigate to="/login" replace />
}

export function RequireAdmin() {
  const { member, loading } = useAuth()
  if (loading) return <Splash />
  return member && member.isAdmin ? <Outlet /> : <Navigate to="/" replace />
}
