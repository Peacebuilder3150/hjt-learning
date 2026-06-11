// YouTubeのリンク(いろいろな書き方)から動画IDを取り出す
export function parseYouTubeId(input) {
  if (!input) return null
  const s = String(input).trim()
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const u = new URL(s)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return /^[\w-]{11}$/.test(id) ? id : null
    }
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)
      if (m) return m[1]
    }
  } catch {
    /* リンクの形式でない場合 */
  }
  return null
}

// YouTubeが自動生成しているサムネイル画像
export function youtubeThumb(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

// YouTube埋め込みプレーヤーの仕組みを読み込む(1回だけ)
let ytPromise = null
export function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev()
        resolve(window.YT)
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    })
  }
  return ytPromise
}
