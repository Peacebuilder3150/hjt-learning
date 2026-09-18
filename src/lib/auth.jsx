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
  // 「パスワードを忘れた方」のメールから来たときだけ true になる
  const [recovery, setRecovery] = useState(false)

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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // 再設定メールのリンクから開いたときは、パスワード設定画面を出す
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
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

  // ログイン中の方が、自分でパスワードを変更する
  const changePassword = async (currentPassword, newPassword) => {
    if (!validatePassword(newPassword)) {
      throw new Error('新しいパスワードは半角英数字8〜12文字で入力してください。')
    }
    if (currentPassword === newPassword) {
      throw new Error('いまお使いのパスワードと同じです。別のパスワードをご入力ください。')
    }
    if (isDemo) {
      demo.changePassword(member.id, currentPassword, newPassword)
      return
    }
    // 本人確認のため、いまのパスワードが正しいかを先に確かめる
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: member.email,
      password: currentPassword,
    })
    if (checkError) {
      throw new Error('いまお使いのパスワードが違います。')
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }

  // パスワードを忘れた方へ、再設定用のメールを送る
  const sendPasswordReset = async (email) => {
    if (isDemo) {
      throw new Error('お試しモードではメールをお送りできません。本番のサイトでお試しください。')
    }
    // メールのリンクから戻ってくる先(サイトのトップ)
    const backTo = window.location.origin + window.location.pathname
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: backTo })
    if (error) throw new Error(error.message)
  }

  // 再設定メールのリンクから開いたあと、新しいパスワードを決める
  const completePasswordReset = async (newPassword) => {
    if (!validatePassword(newPassword)) {
      throw new Error('パスワードは半角英数字8〜12文字で入力してください。')
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
    setRecovery(false)
  }

  const cancelRecovery = () => setRecovery(false)

  const signOut = async () => {
    if (isDemo) {
      demo.signOut()
    } else {
      await supabase.auth.signOut()
    }
    setRecovery(false)
    setMember(null)
  }

  return (
    <AuthContext.Provider
      value={{
        member,
        loading,
        recovery,
        signIn,
        registerFirstTime,
        changePassword,
        sendPasswordReset,
        completePasswordReset,
        cancelRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
