import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import * as api from '../lib/api.js'
import { parseYouTubeId, loadYouTubeApi } from '../lib/youtube.js'
import Layout from '../components/Layout.jsx'
import CourseSidebar from '../components/Sidebar.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

export default function Watch() {
  const { videoId } = useParams()
  const { member } = useAuth()
  const [course, setCourse] = useState(null)
  const [error, setError] = useState('')
  const [watched, setWatched] = useState(0) // 実際に視聴した秒数
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)
  const playerBoxRef = useRef(null)

  useEffect(() => {
    setCourse(null)
    setError('')
    api
      .getVideoLocation(videoId)
      .then((loc) => api.getCourse(loc.courseId, member.id))
      .then(setCourse)
      .catch((e) => setError(e.message))
  }, [videoId, member.id])

  // テーマをまたいだ全動画の並び(次の動画への移動に使う)
  const flat = useMemo(
    () => (course ? course.themes.flatMap((t) => t.videos.map((v) => ({ ...v, themeTitle: t.title }))) : []),
    [course]
  )
  const video = flat.find((v) => v.id === videoId)
  const next = video ? flat[flat.indexOf(video) + 1] : null
  const ytId = video ? parseYouTubeId(video.youtubeUrl) : null

  // YouTubeプレーヤーを設置し、「実際に再生していた秒数」を1秒ごとに数える
  useEffect(() => {
    if (!ytId || !playerBoxRef.current) return
    let cancelled = false
    let player = null
    let interval = null
    const storeKey = `hjt-watched-${member.id}-${videoId}`
    let seconds = Number(localStorage.getItem(storeKey) || 0)
    setWatched(seconds)
    setDuration(0)

    const inner = document.createElement('div')
    playerBoxRef.current.appendChild(inner)

    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      player = new YT.Player(inner, {
        width: '100%',
        height: '100%',
        videoId: ytId,
        playerVars: { rel: 0 },
        events: {
          onReady: (e) => {
            if (!cancelled) setDuration(e.target.getDuration() || 0)
          },
        },
      })
      interval = setInterval(() => {
        try {
          const d = player.getDuration ? player.getDuration() : 0
          if (d) setDuration(d)
          if (player.getPlayerState && player.getPlayerState() === 1) {
            seconds += 1
            localStorage.setItem(storeKey, String(seconds))
            setWatched(seconds)
          }
        } catch {
          /* プレーヤー準備中は何もしない */
        }
      }, 1000)
    })

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
      try {
        if (player) player.destroy()
      } catch {
        /* すでに破棄済みなら無視 */
      }
      if (playerBoxRef.current) playerBoxRef.current.innerHTML = ''
    }
  }, [ytId, videoId, member.id])

  // 動画の9割以上を実際に視聴したら「視聴完了」ボタンが押せる
  const required = duration > 0 ? Math.max(5, Math.floor(duration * 0.9)) : Infinity
  const canComplete = video && !video.completed && watched >= required
  const watchPercent = duration > 0 ? Math.min(100, (watched / required) * 100) : 0

  const complete = async () => {
    setSaving(true)
    try {
      await api.markCompleted(member.id, videoId)
      setCourse((c) => ({
        ...c,
        completedCount: c.completedCount + 1,
        themes: c.themes.map((t) => ({
          ...t,
          videos: t.videos.map((v) => (v.id === videoId ? { ...v, completed: true } : v)),
        })),
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout sidebar={course && <CourseSidebar course={course} currentVideoId={videoId} />}>
      <div className="mx-auto max-w-4xl">
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!course && !error && <p className="text-sm text-ink/40">読み込んでいます…</p>}
        {course && !video && <p className="text-sm text-ink/50">この動画は見つかりませんでした。</p>}
        {course && video && (
          <>
            <p className="text-xs text-ink/45">
              <Link to={`/course/${course.id}`} className="hover:text-plum-600 hover:underline">
                {course.title}
              </Link>
              <span className="mx-1.5">/</span>
              {video.themeTitle}
            </p>
            <h1 className="mt-1.5 font-display text-xl font-semibold leading-snug text-plum-800 sm:text-2xl">
              {video.title}
            </h1>

            <div className="mt-5 overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-plum-100">
              {ytId ? (
                <div ref={playerBoxRef} className="aspect-video w-full [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full" />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-white/60">
                  動画のリンクが正しくありません
                </div>
              )}
            </div>

            <div className="card mt-6 p-5 sm:p-6">
              {video.completed ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gold-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs text-white">✓</span>
                    この動画は視聴完了しています
                  </p>
                  {next && (
                    <Link to={`/watch/${next.id}`} className="btn-primary">
                      次の動画へ進む →
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between text-xs text-ink/50">
                    <span>視聴の進み具合</span>
                    <span>{Math.floor(watchPercent)}%</span>
                  </div>
                  <ProgressBar percent={watchPercent} className="mt-1.5" />
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={complete} disabled={!canComplete || saving} className="btn-gold">
                      {saving ? '保存しています…' : '視聴完了にする'}
                    </button>
                    {!canComplete && (
                      <p className="text-xs leading-relaxed text-ink/45">
                        最後まで視聴すると、このボタンが押せるようになります。
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
