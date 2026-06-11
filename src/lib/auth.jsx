import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isDemo } from './supabase.js'
import * as demo from './demo.js'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

// パスワードの決まり: 半角英数字8〜12文字
export function validatePassword(pw) {
  return /^[A-Za-z0-9]{8,12}$/.test(pw)
}

async function fetchMember(userId) {
  const { data } = await supabase
    .from('members')
    .select('id,name,email,is_admin')
    .eq('auth_user_id', userId)
    .maybeSingle()
  if (!data) return null
  return { id: data.id, name: data.name, email: data.email, isAdmin: data.is_admin }
}

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setMember(demo.getSessionMember())
      setLoading(false)
      return
    }
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      if (data.session) setMember(await fetchMember(data.session.user.id))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // ログイン状態が変わったとき(setTimeoutは処理の詰まり防止)
      setTimeout(async () => {
        if (!active) return
        setMember(session ? await fetchMember(session.user.id) : null)
      }, 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    if (isDemo) {
      setMember(demo.signIn(email, password))
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        throw new Error('メールアドレスまたはパスワードが違います。はじめての方は「初回パスワード登録」からお入りください。')
      }
      throw new Error(error.message)
    }
  }

  const registerFirstTime = async (email, password) => {
    if (!validatePassword(password)) {
      throw new Error('パスワードは半角英数字8〜12文字で入力してください。')
    }
    if (isDemo) {
      setMember(demo.registerFirstTime(email, password))
      return
    }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) {
      if (/already registered/i.test(error.message)) {
        throw new Error('このメールアドレスはすでにパスワード登録済みです。「ログイン」からお入りください。')
      }
      if (/database error/i.test(error.message)) {
        throw new Error('このメールアドレスは会員として登録されていません。運営者にご確認ください。')
      }
      throw new Error(error.message)
    }
    if (!data.session) {
      throw new Error('登録を受け付けました。確認メールが届いている場合は、メール内のリンクを開いてからログインしてください。')
    }
  }

  const signOut = async () => {
    if (isDemo) {
      demo.signOut()
    } else {
      await supabase.auth.signOut()
    }
    setMember(null)
  }

  return (
    <AuthContext.Provider value={{ member, loading, signIn, registerFirstTime, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
