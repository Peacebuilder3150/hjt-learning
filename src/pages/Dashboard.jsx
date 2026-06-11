import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import * as api from '../lib/api.js'
import Layout from '../components/Layout.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

export default function Dashboard() {
  const { member } = useAuth()
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMyCourses(member.id).then(setCourses).catch((e) => setError(e.message))
  }, [member.id])

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-bold tracking-[0.25em] text-gold-600">MY COURSES</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-plum-800 sm:text-3xl">マイコース</h1>
        <p className="mt-2 text-sm text-ink/60">{member.name}さま、ようこそ。今日も学習を進めましょう。</p>

        {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {courses === null ? (
          <p className="mt-10 text-sm text-ink/40">読み込んでいます…</p>
        ) : courses.length === 0 ? (
          <div className="card mt-10 px-6 py-12 text-center text-sm text-ink/50">
            受講中のコースがまだありません。運営者にお問い合わせください。
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => {
              const percent = c.videoCount ? Math.round((c.completedCount / c.videoCount) * 100) : 0
              return (
                <Link key={c.id} to={`/course/${c.id}`} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-plum-50 px-3 py-1 text-[10px] font-bold tracking-widest text-plum-600">
                      COURSE
                    </span>
                    {percent === 100 && (
                      <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold text-white">修了 🎉</span>
                    )}
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-plum-800 group-hover:text-plum-600">
                    {c.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/55">{c.description}</p>
                  <div className="mt-auto pt-6">
                    <div className="flex items-end justify-between text-xs text-ink/50">
                      <span>
                        {c.completedCount} / {c.videoCount} 本を視聴
                      </span>
                      <span className="font-display text-xl font-bold text-plum-700">
                        {percent}
                        <span className="text-xs font-medium">%</span>
                      </span>
                    </div>
                    <ProgressBar percent={percent} className="mt-2" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
