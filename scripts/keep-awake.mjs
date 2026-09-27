// 保管庫(Supabase)を眠らせないための定期アクセス。
// GitHub Actions の「保管庫を眠らせない」から4時間ごとに実行される。
// サイト本体と同じ部品(supabase-js)を使い、サイトを開いたときと同じように複数の表を読み込む。
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY
if (!url || !key) {
  console.error('::error::接続情報(VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)が設定されていません。')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

let failed = false
for (const table of ['courses', 'themes', 'videos']) {
  try {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error) throw new Error(error.message)
    console.log(`${table}: 正常`)
  } catch (e) {
    failed = true
    console.error(`${table}: 失敗 (${e.message})`)
  }
}

if (failed) {
  console.error('::error::保管庫からの応答が異常です。Supabaseが停止していないかご確認ください。')
  process.exit(1)
}
console.log('保管庫は正常に応答しました。')
