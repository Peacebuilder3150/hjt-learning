import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { isDemo } from '../lib/supabase.js'
import Brand from '../components/Brand.jsx'

export default function Login() {
  const { member, signIn, registerFirstTime, sendPasswordReset } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (member) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (tab === 'register' && password !== password2) {
      setError('確認用のパスワードが一致しません。')
      return
    }
    setBusy(true)
    try {
      if (tab === 'login') await signIn(email, password)
      else if (tab === 'register') await registerFirstTime(email, password)
      else {
        await sendPasswordReset(email)
        setSent(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (t) => {
    setTab(t)
    setError('')
    setSent(false)
    setPassword('')
    setPassword2('')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-10">
      {/* 背景の飾り */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-plum-100 opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold-100 opacity-80 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand large />
          <p className="mt-3 text-sm font-medium tracking-wide text-ink/55">動画で学ぶ「出版 × マーケティング」</p>
        </div>

        <div className="rounded-3xl bg-white/85 p-8 shadow-xl ring-1 ring-plum-100 backdrop-blur sm:p-10">
          {tab === 'forgot' ? (
            <div className="mb-6">
              <h1 className="font-display text-xl font-bold text-plum-800">パスワードの再設定</h1>
              <button
                type="button"
                onClick={() => switchTab('login')}
                className="mt-1 text-xs text-ink/45 hover:text-plum-600 hover:underline"
              >
                ← ログイン画面へ戻る
              </button>
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-2 rounded-full bg-plum-50 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`rounded-full py-2 transition ${tab === 'login' ? 'bg-white text-plum-700 shadow' : 'text-ink/40'}`}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                className={`rounded-full py-2 transition ${tab === 'register' ? 'bg-white text-plum-700 shadow' : 'text-ink/40'}`}
              >
                初回パスワード登録
              </button>
            </div>
          )}

          {tab === 'register' && (
            <p className="mb-4 rounded-xl bg-plum-50 px-4 py-3 text-xs leading-relaxed text-plum-700">
              はじめてご利用の方は、運営者に登録いただいたメールアドレスと、お好きなパスワード(半角英数字8〜12文字)を入力してください。
            </p>
          )}

          {tab === 'forgot' && (
            <p className="mb-4 rounded-xl bg-plum-50 px-4 py-3 text-xs leading-relaxed text-plum-700">
              ご登録のメールアドレスを入力してください。パスワードを設定し直すためのご案内メールをお送りします。
            </p>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {tab !== 'forgot' && (
              <div>
                <label className="label" htmlFor="password">
                  パスワード{tab === 'register' && '(半角英数字8〜12文字)'}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {tab === 'register' && (
              <div>
                <label className="label" htmlFor="password2">パスワード(確認のためもう一度)</label>
                <input
                  id="password2"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="input"
                  placeholder="••••••••"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </div>
            )}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700">{error}</p>}
            {sent && (
              <p className="rounded-xl bg-gold-100/70 px-4 py-3 text-xs leading-relaxed font-semibold text-gold-700">
                ご案内メールをお送りしました。メール内のリンクを開いて、新しいパスワードをお決めください。
                <br />
                <span className="font-normal">
                  メールが見当たらないときは、迷惑メールフォルダもご確認ください。
                </span>
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy
                ? '確認しています…'
                : tab === 'login'
                  ? 'ログイン'
                  : tab === 'register'
                    ? 'パスワードを登録して始める'
                    : '再設定のメールを送る'}
            </button>
          </form>

          {tab === 'login' && (
            <button
              type="button"
              onClick={() => switchTab('forgot')}
              className="mt-4 w-full text-xs text-ink/45 hover:text-plum-600 hover:underline"
            >
              パスワードをお忘れですか？
            </button>
          )}
        </div>

        {isDemo && (
          <div className="mt-6 rounded-2xl bg-gold-100/70 px-5 py-4 text-xs leading-relaxed text-gold-700">
            <p className="font-bold">お試しモード用アカウント</p>
            <p className="mt-1">
              受講生: member@example.com / hjt2026demo
              <br />
              運営者: admin@example.com / hjt2026admin
              <br />
              初回登録の体験: first@example.com(パスワード未設定)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
