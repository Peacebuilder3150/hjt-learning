import { useEffect, useState } from 'react'
import * as api from '../../lib/api.js'
import ProgressBar from '../../components/ProgressBar.jsx'
import AdminShell from './AdminShell.jsx'

function MemberForm({ initial, courses, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [courseIds, setCourseIds] = useState(initial ? initial.courses.map((c) => c.id) : [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (id) =>
    setCourseIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onSave({ name: name.trim(), email: email.trim(), courseIds })
    } catch (err) {
      setError(err.message)
      setBusy(false)
      return
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="font-display text-base font-semibold text-plum-800">
        {initial ? '会員情報の変更' : '③ 新しい会員を登録'}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">① 会員名</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 山田 花子" />
        </div>
        <div>
          <label className="label">② メールアドレス</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label className="label">③ 受講コース</label>
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <label
              key={c.id}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-medium ring-1 transition ${
                courseIds.includes(c.id)
                  ? 'bg-plum-600 text-white ring-plum-600'
                  : 'bg-white text-ink/60 ring-plum-200 hover:bg-plum-50'
              }`}
            >
              <input type="checkbox" className="hidden" checked={courseIds.includes(c.id)} onChange={() => toggle(c.id)} />
              {c.title}
            </label>
          ))}
          {courses.length === 0 && <p className="text-xs text-ink/40">先に「コンテンツ管理」でコースを登録してください</p>}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary !px-5 !py-2 text-xs">
          {busy ? '保存中…' : initial ? '変更を保存' : 'この会員を登録'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost !py-2 text-xs">キャンセル</button>
        )}
      </div>
      {!initial && (
        <p className="text-[11px] leading-relaxed text-ink/45">
          登録後、会員ご本人がログイン画面の「初回パスワード登録」からパスワードを設定すると、学習を始められます。
        </p>
      )}
    </form>
  )
}

export default function AdminMembers() {
  const [members, setMembers] = useState(null)
  const [courses, setCourses] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const [m, c] = await Promise.all([api.adminListMembers(), api.adminListCourses()])
    setMembers(m)
    setCourses(c)
  }

  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  return (
    <AdminShell>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError('')}>閉じる</button>
        </p>
      )}

      <MemberForm
        courses={courses}
        onSave={async (fields) => {
          await api.adminCreateMember(fields)
          await load()
        }}
      />

      <div className="mt-8">
        <p className="label">会員一覧と学習の進捗</p>
        {members === null ? (
          <p className="text-sm text-ink/40">読み込んでいます…</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) =>
              editingId === m.id ? (
                <MemberForm
                  key={m.id}
                  initial={m}
                  courses={courses}
                  onSave={async (fields) => {
                    await api.adminUpdateMember(m.id, fields)
                    setEditingId(null)
                    await load()
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={m.id} className="card p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        {m.name}
                        {m.isAdmin && (
                          <span className="rounded-full bg-plum-100 px-2 py-0.5 text-[10px] font-bold text-plum-600">運営者</span>
                        )}
                      </p>
                      <p className="text-xs text-ink/50">{m.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        m.registered ? 'bg-gold-100 text-gold-700' : 'bg-plum-50 text-ink/40'
                      }`}
                    >
                      {m.registered ? 'パスワード登録済み' : '初回登録待ち'}
                    </span>
                    <div className="ml-auto flex gap-1 text-xs">
                      <button type="button" onClick={() => setEditingId(m.id)} className="rounded-full px-3 py-1.5 text-plum-600 hover:bg-plum-50">
                        編集
                      </button>
                      {!m.isAdmin && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`会員「${m.name}」さんを削除します。学習記録も消えます。よろしいですか?`)) return
                            try {
                              await api.adminDeleteMember(m.id)
                              await load()
                            } catch (err) {
                              setError(err.message)
                            }
                          }}
                          className="rounded-full px-3 py-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                  {m.courses.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {m.courses.map((c) => (
                        <div key={c.id} className="rounded-xl bg-plum-50/60 px-4 py-3">
                          <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="truncate font-medium text-plum-700">{c.title}</span>
                            <span className="shrink-0 font-bold text-plum-700">{c.percent}%</span>
                          </div>
                          <ProgressBar percent={c.percent} className="mt-1.5 !h-1.5" />
                          <p className="mt-1 text-[10px] text-ink/40">
                            {c.done} / {c.total} 本視聴
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            {members.length === 0 && <p className="text-sm text-ink/40">会員はまだ登録されていません。</p>}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
