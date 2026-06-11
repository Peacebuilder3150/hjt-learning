import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import * as api from '../../lib/api.js'
import { parseYouTubeId, youtubeThumb } from '../../lib/youtube.js'
import { videoThumbSrc } from '../../components/VideoCard.jsx'
import ThumbDrop from '../../components/ThumbDrop.jsx'
import AdminShell from './AdminShell.jsx'

// ---------- 動画の登録・編集フォーム ----------
function VideoForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [url, setUrl] = useState(initial?.youtubeUrl || '')
  const [thumb, setThumb] = useState(initial?.thumbnailUrl || null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const ytId = parseYouTubeId(url)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!ytId) {
      setError('YouTubeのリンクが正しくありません。動画ページのURLを貼り付けてください。')
      return
    }
    setBusy(true)
    try {
      await onSave({ title: title.trim(), youtubeUrl: url.trim(), thumbDataUrl: thumb })
    } catch (err) {
      setError(err.message)
      setBusy(false)
      return
    }
    setBusy(false)
    setTitle('')
    setUrl('')
    setThumb(null)
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-plum-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">③ 動画のタイトル</label>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 売れる企画の見つけ方" />
        </div>
        <div>
          <label className="label">⑤ YouTubeのリンク(限定公開)</label>
          <input className="input" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      </div>
      <div>
        <label className="label">④ サムネイル画像(任意)</label>
        <ThumbDrop value={thumb} onChange={setThumb} />
        {!thumb && ytId && (
          <p className="mt-1.5 flex items-center gap-2 text-[11px] text-ink/45">
            <img src={youtubeThumb(ytId)} alt="" className="aspect-video w-16 rounded object-cover" />
            未添付の場合は、このYouTubeの画像が使われます
          </p>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary !px-5 !py-2 text-xs">
          {busy ? '保存中…' : initial ? '変更を保存' : 'この動画を登録'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost !py-2 text-xs">
            キャンセル
          </button>
        )}
      </div>
    </form>
  )
}

// ---------- テーマ1つ分(動画一覧つき) ----------
function ThemeBlock({ theme, onChanged }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(theme.title)
  const [editingVideoId, setEditingVideoId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  const saveVideo = (videoId) => async ({ title, youtubeUrl, thumbDataUrl }) => {
    let thumbnailUrl = thumbDataUrl
    // 新しく添付された画像(データ形式)のときだけアップロードする
    if (thumbDataUrl && thumbDataUrl.startsWith('data:')) {
      thumbnailUrl = await api.uploadThumbnail(thumbDataUrl)
    }
    if (videoId) {
      await api.adminUpdateVideo(videoId, { title, youtubeUrl, thumbnailUrl })
      setEditingVideoId(null)
    } else {
      await api.adminCreateVideo({ themeId: theme.id, title, youtubeUrl, thumbnailUrl })
      setAddOpen(false)
    }
    await onChanged()
  }

  const move = async (index, dir) => {
    const other = theme.videos[index + dir]
    const target = theme.videos[index]
    if (!other) return
    await api.adminUpdateVideo(target.id, { sortOrder: other.sortOrder })
    await api.adminUpdateVideo(other.id, { sortOrder: target.sortOrder })
    await onChanged()
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-2">
        {editingTitle ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              await api.adminUpdateTheme(theme.id, { title: title.trim() })
              setEditingTitle(false)
              await onChanged()
            }}
          >
            <input className="input !py-1.5" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <button type="submit" className="btn-primary !px-4 !py-1.5 text-xs">保存</button>
          </form>
        ) : (
          <h3 className="font-display text-base font-semibold text-plum-800">{theme.title}</h3>
        )}
        <div className="ml-auto flex items-center gap-1 text-xs">
          {!editingTitle && (
            <button type="button" onClick={() => setEditingTitle(true)} className="rounded-full px-3 py-1 text-ink/50 hover:bg-plum-50 hover:text-plum-700">
              名前を変更
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`テーマ「${theme.title}」と中の動画をすべて削除します。よろしいですか?`)) return
              await api.adminDeleteTheme(theme.id)
              await onChanged()
            }}
            className="rounded-full px-3 py-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          >
            削除
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {theme.videos.map((v, i) =>
          editingVideoId === v.id ? (
            <li key={v.id}>
              <VideoForm initial={v} onSave={saveVideo(v.id)} onCancel={() => setEditingVideoId(null)} />
            </li>
          ) : (
            <li key={v.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-plum-50/50">
              <img src={videoThumbSrc(v) || ''} alt="" className="aspect-video w-20 shrink-0 rounded-lg object-cover ring-1 ring-plum-100" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{v.title}</p>
              <div className="flex shrink-0 items-center gap-0.5 text-xs">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-ink/40 hover:bg-plum-100 disabled:opacity-20" title="上へ">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === theme.videos.length - 1} className="rounded p-1.5 text-ink/40 hover:bg-plum-100 disabled:opacity-20" title="下へ">▼</button>
                <button type="button" onClick={() => setEditingVideoId(v.id)} className="rounded-full px-3 py-1 text-plum-600 hover:bg-plum-100">編集</button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`動画「${v.title}」を削除します。よろしいですか?`)) return
                    await api.adminDeleteVideo(v.id)
                    await onChanged()
                  }}
                  className="rounded-full px-3 py-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  削除
                </button>
              </div>
            </li>
          )
        )}
        {theme.videos.length === 0 && <li className="px-2 text-xs text-ink/40">まだ動画がありません</li>}
      </ul>

      <div className="mt-4">
        {addOpen ? (
          <VideoForm onSave={saveVideo(null)} onCancel={() => setAddOpen(false)} />
        ) : (
          <button type="button" onClick={() => setAddOpen(true)} className="btn-ghost text-xs">
            ＋ このテーマに動画を追加
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- ページ本体 ----------
export default function AdminContent() {
  const { member } = useAuth()
  const [courses, setCourses] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [newCourse, setNewCourse] = useState(false)
  const [editCourse, setEditCourse] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [newTheme, setNewTheme] = useState('')

  const loadCourses = useCallback(async () => {
    const list = await api.adminListCourses()
    setCourses(list)
    setSelectedId((cur) => (cur && list.some((c) => c.id === cur) ? cur : (list[0]?.id ?? null)))
  }, [])

  const loadDetail = useCallback(async () => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    setDetail(await api.getCourse(selectedId, member.id))
  }, [selectedId, member.id])

  useEffect(() => {
    loadCourses().catch((e) => setError(e.message))
  }, [loadCourses])

  useEffect(() => {
    setDetail(null)
    loadDetail().catch((e) => setError(e.message))
  }, [loadDetail])

  const refresh = async () => {
    await loadCourses()
    await loadDetail()
  }

  const submitCourse = async (e) => {
    e.preventDefault()
    try {
      if (editCourse) await api.adminUpdateCourse(selectedId, { title: courseTitle.trim(), description: courseDesc.trim() })
      else await api.adminCreateCourse({ title: courseTitle.trim(), description: courseDesc.trim() })
      setNewCourse(false)
      setEditCourse(false)
      setCourseTitle('')
      setCourseDesc('')
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AdminShell>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError('')}>閉じる</button>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ① コースの一覧と登録 */}
        <div>
          <p className="label">① コース</p>
          <div className="card divide-y divide-plum-50 overflow-hidden">
            {(courses || []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  c.id === selectedId ? 'bg-plum-600 font-semibold text-white' : 'hover:bg-plum-50'
                }`}
              >
                {c.title}
                <span className={`block text-[10px] ${c.id === selectedId ? 'text-white/60' : 'text-ink/40'}`}>
                  動画 {c.videoCount}本
                </span>
              </button>
            ))}
            {courses && courses.length === 0 && <p className="px-4 py-6 text-xs text-ink/40">コースはまだありません</p>}
          </div>
          {newCourse ? (
            <form onSubmit={submitCourse} className="card mt-3 space-y-3 p-4">
              <div>
                <label className="label">コース名</label>
                <input className="input" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">紹介文(任意)</label>
                <textarea className="input" rows="3" value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary !px-5 !py-2 text-xs">登録</button>
                <button type="button" onClick={() => setNewCourse(false)} className="btn-ghost !py-2 text-xs">キャンセル</button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewCourse(true)
                setEditCourse(false)
                setCourseTitle('')
                setCourseDesc('')
              }}
              className="btn-ghost mt-3 w-full text-xs"
            >
              ＋ 新しいコースを登録
            </button>
          )}
        </div>

        {/* ②〜⑤ テーマと動画 */}
        <div>
          {detail ? (
            <>
              <div className="card flex flex-wrap items-center gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-semibold text-plum-800">{detail.title}</h2>
                  {detail.description && <p className="mt-0.5 line-clamp-1 text-xs text-ink/50">{detail.description}</p>}
                </div>
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCourse(true)
                      setNewCourse(true)
                      setCourseTitle(detail.title)
                      setCourseDesc(detail.description || '')
                    }}
                    className="rounded-full px-3 py-1.5 text-plum-600 hover:bg-plum-50"
                  >
                    コース名・紹介文を変更
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`コース「${detail.title}」を中身ごとすべて削除します。よろしいですか?`)) return
                      try {
                        await api.adminDeleteCourse(detail.id)
                        await refresh()
                      } catch (err) {
                        setError(err.message)
                      }
                    }}
                    className="rounded-full px-3 py-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    コースを削除
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {detail.themes.map((t) => (
                  <ThemeBlock key={t.id} theme={t} onChanged={refresh} />
                ))}
              </div>

              <form
                className="card mt-5 flex flex-wrap items-end gap-3 p-5"
                onSubmit={async (e) => {
                  e.preventDefault()
                  try {
                    await api.adminCreateTheme(detail.id, newTheme.trim())
                    setNewTheme('')
                    await refresh()
                  } catch (err) {
                    setError(err.message)
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <label className="label">② 新しいテーマ(章)の名前</label>
                  <input className="input" required value={newTheme} onChange={(e) => setNewTheme(e.target.value)} placeholder="例: 第3章 原稿のつくり方" />
                </div>
                <button type="submit" className="btn-primary !px-5 text-xs">テーマを追加</button>
              </form>
            </>
          ) : (
            <p className="text-sm text-ink/40">{courses === null ? '読み込んでいます…' : 'コースを選択するか、新しく登録してください。'}</p>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
