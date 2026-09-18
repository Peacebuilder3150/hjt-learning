import { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import Brand from '../components/Brand.jsx'

// 「パスワードを忘れた方」宛のメールのリンクから開いたときに表示する画面
export default function ResetPassword() {
  const { completePasswordReset, cancelRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== password2) {
      setError('確認用のパスワードが一致しません。')
      return
    }
    setBusy(true)
    try {
      await completePasswordReset(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-plum-100 opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold-100 opacity-80 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand large />
        </div>

        <div className="rounded-3xl bg-white/85 p-8 shadow-xl ring-1 ring-plum-100 backdrop-blur sm:p-10">
          <h1 className="font-display text-xl font-bold text-plum-800">新しいパスワードの設定</h1>
          <p className="mt-2 text-xs leading-relaxed text-ink/55">
            お決めになった新しいパスワードを入力してください。設定するとそのままご利用いただけます。
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="newpw">新しいパスワード(半角英数字8〜12文字)</label>
              <input
                id="newpw"
                type="password"
                required
                autoComplete="new-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="newpw2">新しいパスワード(確認のためもう一度)</label>
              <input
                id="newpw2"
                type="password"
                required
                autoComplete="new-password"
                className="input"
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? '設定しています…' : 'このパスワードで設定する'}
            </button>
          </form>

          <button
            type="button"
            onClick={cancelRecovery}
            className="mt-4 w-full text-xs text-ink/40 hover:text-plum-600 hover:underline"
          >
            設定せずに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
