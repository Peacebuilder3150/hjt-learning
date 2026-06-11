import { createClient } from '@supabase/supabase-js'

// 本番の保存先(Supabase)の接続情報。未設定のときは「お試しモード」で動く
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isDemo = !url || !key
export const supabase = isDemo ? null : createClient(url, key)
