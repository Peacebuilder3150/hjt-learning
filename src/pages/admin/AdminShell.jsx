import { Link, NavLink } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

const tabClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-plum-600 text-white shadow-sm' : 'text-plum-700 hover:bg-plum-50'
  }`

export default function AdminShell({ children }) {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-bold tracking-[0.25em] text-gold-600">ADMIN</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-plum-800 sm:text-4xl">管理画面</h1>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-plum-100 pb-3">
          <NavLink to="/admin" end className={tabClass}>
            コンテンツ管理
          </NavLink>
          <NavLink to="/admin/members" className={tabClass}>
            会員管理
          </NavLink>
          <Link to="/" className="ml-auto text-xs text-ink/45 hover:text-plum-600 hover:underline">
            ← 受講生画面へ戻る
          </Link>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </Layout>
  )
}
