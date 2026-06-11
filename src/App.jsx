import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { RequireAuth, RequireAdmin } from './components/Protected.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CoursePage from './pages/Course.jsx'
import Watch from './pages/Watch.jsx'
import AdminContent from './pages/admin/AdminContent.jsx'
import AdminMembers from './pages/admin/AdminMembers.jsx'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/watch/:videoId" element={<Watch />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminContent />} />
              <Route path="/admin/members" element={<AdminMembers />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
