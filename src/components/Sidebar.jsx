import { Link } from 'react-router-dom'

// 左メニュー: テーマ → 動画タイトルを開閉式で表示
export default function CourseSidebar({ course, currentVideoId, onNavigate }) {
  if (!course) return null
  return (
    <nav className="p-4">
      <p className="px-2 text-[10px] font-bold tracking-[0.2em] text-gold-600">COURSE</p>
      <Link
        to={`/course/${course.id}`}
        onClick={onNavigate}
        className="mt-1 block rounded-lg px-2 py-2 font-display text-base font-bold leading-snug text-plum-800 hover:bg-plum-50"
      >
        {course.title}
      </Link>
      <div className="mt-3 space-y-1">
        {course.themes.map((t) => (
          <details key={t.id} open={!currentVideoId || t.videos.some((v) => v.id === currentVideoId)} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-bold text-plum-800 hover:bg-plum-50">
              <span className="leading-snug">{t.title}</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 shrink-0 text-plum-300 transition-transform group-open:rotate-180"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <ul className="mb-2 ml-3 mt-1 space-y-0.5 border-l border-plum-100 pl-2">
              {t.videos.map((v) => (
                <li key={v.id}>
                  <Link
                    to={`/watch/${v.id}`}
                    onClick={onNavigate}
                    className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs leading-snug transition ${
                      v.id === currentVideoId
                        ? 'bg-plum-600 font-semibold text-white'
                        : 'text-ink/70 hover:bg-plum-50 hover:text-plum-700'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                        v.completed
                          ? 'bg-gold-500 text-white'
                          : v.id === currentVideoId
                            ? 'bg-white/30 text-white'
                            : 'bg-plum-100 text-plum-300'
                      }`}
                    >
                      ✓
                    </span>
                    {v.title}
                  </Link>
                </li>
              ))}
              {t.videos.length === 0 && <li className="px-2 py-1 text-xs text-ink/40">動画はまだありません</li>}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  )
}
