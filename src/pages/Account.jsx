import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import Layout from '../components/Layout.jsx'

export default function Account() {
  const { member, changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [next2, setNext2] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setDone(false)
    if (next !== next2) {
      setError('確認用のパスワードが一致しません。')
      return
    }
    setBusy(true)
    try {
      await changePassword(current, next)
      setDone(true)
      setCurrent('')
      setNext('')
      setNext2('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] font-bold tracking-[0.25em] text-gold-600">SETTINGS</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-plum-800 sm:text-4xl">設定</h1>
        <p className="mt-2 text-sm text-ink/60">{member?.name}さまのアカウント情報です。</p>

        <div className="card mt-8 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-plum-800">ご登録情報</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-ink/45">お名前</dt>
              <dd className="font-medium">{member?.name}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-ink/45">メールアドレス</dt>
              <dd className="break-all font-medium">{member?.email}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink/45">
            お名前・メールアドレスの変更は、運営者にご連絡ください。
          </p>
        </div>

        <div className="card mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-plum-800">パスワードの変更</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink/50">
            安全のため、いまお使いのパスワードを入力してから、新しいパスワードをお決めください。
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="current">いまのパスワード</label>
              <input
                id="current"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="next">新しいパスワード(半角英数字8〜12文字)</label>
              <input
                id="next"
                type="password"
                required
                autoComplete="new-password"
                className="input"
                placeholder="••••••••"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="next2">新しいパスワード(確認のためもう一度)</label>
              <input
                id="next2"
                type="password"
                required
                autoComplete="new-password"
                className="input"
                placeholder="••••••••"
                value={next2}
                onChange={(e) => setNext2(e.target.value)}
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700">{error}</p>}
            {done && (
              <p className="rounded-xl bg-gold-100/70 px-4 py-3 text-xs leading-relaxed font-semibold text-gold-700">
                パスワードを変更しました。次回のログインから新しいパスワードをお使いください。
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? '変更しています…' : 'パスワードを変更する'}
              </button>
              <Link to="/" className="text-xs text-ink/45 hover:text-plum-600 hover:underline">
                ← マイコースへ戻る
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
