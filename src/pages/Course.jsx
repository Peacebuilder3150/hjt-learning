import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import * as api from '../lib/api.js'
import Layout from '../components/Layout.jsx'
import CourseSidebar from '../components/Sidebar.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import VideoCard from '../components/VideoCard.jsx'

export default function CoursePage() {
  const { courseId } = useParams()
  const { member } = useAuth()
  const [course, setCourse] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setCourse(null)
    api.getCourse(courseId, member.id).then(setCourse).catch((e) => setError(e.message))
  }, [courseId, member.id])

  const percent = course && course.videoCount ? Math.round((course.completedCount / course.videoCount) * 100) : 0

  return (
    <Layout sidebar={course && <CourseSidebar course={course} />}>
      <div className="mx-auto max-w-7xl">
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!course && !error && <p className="text-sm text-ink/40">読み込んでいます…</p>}
        {course && (
          <>
            <div className="card bg-linear-to-r from-plum-700 to-plum-500 p-6 !ring-0 sm:p-8">
              <p className="text-[11px] font-bold tracking-[0.25em] text-gold-300">COURSE</p>
              <h1 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">{course.title}</h1>
              {course.description && <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/70">{course.description}</p>}
              <div className="mt-5 max-w-md">
                <div className="flex items-end justify-between text-xs text-white/80">
                  <span>
                    進捗 {course.completedCount} / {course.videoCount} 本
                  </span>
                  <span className="font-display text-2xl font-bold text-white">
                    {percent}
                    <span className="text-sm font-medium">%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-gold-300 to-gold-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {course.themes.map((t) => (
              <section key={t.id} className="mt-10">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-lg font-semibold text-plum-800">{t.title}</h2>
                  <span className="h-px flex-1 bg-linear-to-r from-gold-300 to-transparent" />
                  <span className="text-xs text-ink/40">{t.videos.length}本</span>
                </div>
                {t.videos.length === 0 ? (
                  <p className="mt-4 text-xs text-ink/40">このテーマの動画は準備中です。</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                    {t.videos.map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                )}
              </section>
            ))}
            {course.themes.length === 0 && (
              <div className="card mt-10 px-6 py-12 text-center text-sm text-ink/50">コンテンツは準備中です。</div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
