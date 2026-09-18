import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { isDemo } from '../lib/supabase.js'
import Brand from './Brand.jsx'

export default function Layout({ sidebar, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { member, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream">
      {isDemo && (
        <div className="bg-gold-100 px-4 py-1.5 text-center text-[11px] font-medium text-gold-700">
          お試しモードで表示中(本番の保存先が未設定のため、データはこのブラウザ内にのみ保存されます)
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-plum-100 bg-cream/85 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {sidebar && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-plum-700 hover:bg-plum-50 lg:hidden"
              aria-label="メニューを開く"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Link to="/" className="shrink-0">
            <Brand />
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {member?.isAdmin && (
              <Link to="/admin" className="btn-ghost shrink-0 whitespace-nowrap !px-3 !py-1.5 text-xs">
                管理画面
              </Link>
            )}
            <span className="hidden whitespace-nowrap text-sm text-ink/70 md:block">{member?.name} さま</span>
            <Link
              to="/account"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-ink/50 hover:bg-plum-50 hover:text-plum-700"
            >
              設定
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-ink/50 hover:bg-plum-50 hover:text-plum-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {sidebar && (
          <>
            {/* パソコン用: 常に表示の左メニュー */}
            <aside className="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-72 shrink-0 self-start overflow-y-auto border-r border-plum-100 bg-white/60 lg:block">
              {sidebar}
            </aside>
            {/* スマホ用: ボタンで開く左メニュー */}
            {drawerOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-plum-800/40" onClick={() => setDrawerOpen(false)} />
                <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-cream shadow-xl">
                  <div className="flex items-center justify-between border-b border-plum-100 px-4 py-3">
                    <Brand />
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg p-1.5 text-plum-700 hover:bg-plum-50"
                      aria-label="メニューを閉じる"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                  <div onClickCapture={() => setDrawerOpen(false)}>{sidebar}</div>
                </div>
              </div>
            )}
          </>
        )}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
