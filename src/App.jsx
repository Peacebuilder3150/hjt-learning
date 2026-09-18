import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import { RequireAuth, RequireAdmin } from './components/Protected.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CoursePage from './pages/Course.jsx'
import Watch from './pages/Watch.jsx'
import Account from './pages/Account.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminContent from './pages/admin/AdminContent.jsx'
import AdminMembers from './pages/admin/AdminMembers.jsx'

function AppRoutes() {
  const { recovery } = useAuth()

  // 再設定メールのリンクから開いたときは、まず新しいパスワードを決めてもらう
  if (recovery) return <ResetPassword />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/course/:courseId" element={<CoursePage />} />
        <Route path="/watch/:videoId" element={<Watch />} />
        <Route path="/account" element={<Account />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminContent />} />
          <Route path="/admin/members" element={<AdminMembers />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
