// =====================================================================
// お試しモード(Supabase未設定のとき)用のデータ置き場。
// ブラウザの中だけにデータを保存し、本番と同じ操作感を確かめられる。
// =====================================================================

const DB_KEY = 'hjt-demo-db-v1'
const SESSION_KEY = 'hjt-demo-session-v1'

const uid = () => crypto.randomUUID()

function seed() {
  const c1 = uid()
  const c2 = uid()
  const t1 = uid()
  const t2 = uid()
  const t3 = uid()
  const admin = uid()
  const m1 = uid()
  const m2 = uid()
  const v = [uid(), uid(), uid(), uid(), uid()]
  return {
    members: [
      { id: admin, name: '運営者(あなた)', email: 'admin@example.com', isAdmin: true, password: 'hjt2026admin' },
      { id: m1, name: '山田 花子', email: 'member@example.com', isAdmin: false, password: 'hjt2026demo' },
      { id: m2, name: '佐藤 太郎', email: 'first@example.com', isAdmin: false, password: null },
    ],
    courses: [
      { id: c1, title: '電子書籍出版マスター講座', description: '企画から出版・販売促進まで、電子書籍出版の全工程を学びます。', sortOrder: 1 },
      { id: c2, title: 'Webマーケティング実践講座', description: '集客・販売・ブランディングをWebで実現する実践講座です。', sortOrder: 2 },
    ],
    themes: [
      { id: t1, courseId: c1, title: '第1章 出版の全体像', sortOrder: 1 },
      { id: t2, courseId: c1, title: '第2章 企画の立て方', sortOrder: 2 },
      { id: t3, courseId: c2, title: '第1章 Web集客の基礎', sortOrder: 1 },
    ],
    videos: [
      { id: v[0], themeId: t1, title: 'オリエンテーション 〜この講座の歩き方〜', youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', thumbnailUrl: null, sortOrder: 1 },
      { id: v[1], themeId: t1, title: '電子書籍市場の今を知る', youtubeUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE', thumbnailUrl: null, sortOrder: 2 },
      { id: v[2], themeId: t1, title: '出版までの5つのステップ', youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', thumbnailUrl: null, sortOrder: 3 },
      { id: v[3], themeId: t2, title: '売れる企画の見つけ方', youtubeUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE', thumbnailUrl: null, sortOrder: 1 },
      { id: v[4], themeId: t3, title: 'Web集客の全体マップ', youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', thumbnailUrl: null, sortOrder: 2 },
    ],
    enrollments: [
      { memberId: m1, courseId: c1 },
      { memberId: m2, courseId: c1 },
    ],
    progress: [{ memberId: m1, videoId: v[0], completedAt: new Date().toISOString() }],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 壊れていたら作り直す */
  }
  const db = seed()
  save(db)
  return db
}

function save(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

const publicMember = (m) => ({ id: m.id, name: m.name, email: m.email, isAdmin: m.isAdmin })

// ---------- ログイン関連 ----------

export function getSessionMember() {
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  const m = load().members.find((x) => x.id === id)
  return m ? publicMember(m) : null
}

export function signIn(email, password) {
  const db = load()
  const m = db.members.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  if (!m) throw new Error('このメールアドレスは会員として登録されていません。')
  if (m.password == null) throw new Error('はじめての方は「初回パスワード登録」からパスワードを設定してください。')
  if (m.password !== password) throw new Error('メールアドレスまたはパスワードが違います。')
  localStorage.setItem(SESSION_KEY, m.id)
  return publicMember(m)
}

export function registerFirstTime(email, password) {
  const db = load()
  const m = db.members.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  if (!m) throw new Error('このメールアドレスは会員として登録されていません。運営者にご確認ください。')
  if (m.password != null) throw new Error('このメールアドレスはすでにパスワード登録済みです。「ログイン」からお入りください。')
  m.password = password
  save(db)
  localStorage.setItem(SESSION_KEY, m.id)
  return publicMember(m)
}

export function changePassword(memberId, currentPassword, newPassword) {
  const db = load()
  const m = db.members.find((x) => x.id === memberId)
  if (!m) throw new Error('会員情報が見つかりませんでした。')
  if (m.password !== currentPassword) throw new Error('いまお使いのパスワードが違います。')
  m.password = newPassword
  save(db)
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

// ---------- 受講生向け ----------

function courseCounts(db, courseId) {
  const themeIds = db.themes.filter((t) => t.courseId === courseId).map((t) => t.id)
  return db.videos.filter((v) => themeIds.includes(v.themeId)).map((v) => v.id)
}

export function getMyCourses(memberId) {
  const db = load()
  const me = db.members.find((m) => m.id === memberId)
  if (!me) return []
  const ids = me.isAdmin
    ? db.courses.map((c) => c.id)
    : db.enrollments.filter((e) => e.memberId === memberId).map((e) => e.courseId)
  const done = new Set(db.progress.filter((p) => p.memberId === memberId).map((p) => p.videoId))
  return db.courses
    .filter((c) => ids.includes(c.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => {
      const vids = courseCounts(db, c.id)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        videoCount: vids.length,
        completedCount: vids.filter((v) => done.has(v)).length,
      }
    })
}

export function getCourse(courseId, memberId) {
  const db = load()
  const c = db.courses.find((x) => x.id === courseId)
  if (!c) throw new Error('コースが見つかりません')
  const done = new Set(db.progress.filter((p) => p.memberId === memberId).map((p) => p.videoId))
  const themes = db.themes
    .filter((t) => t.courseId === courseId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => ({
      id: t.id,
      title: t.title,
      sortOrder: t.sortOrder,
      videos: db.videos
        .filter((v) => v.themeId === t.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((v) => ({ ...v, completed: done.has(v.id) })),
    }))
  const all = themes.flatMap((t) => t.videos)
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    themes,
    videoCount: all.length,
    completedCount: all.filter((v) => v.completed).length,
  }
}

export function getVideoLocation(videoId) {
  const db = load()
  const v = db.videos.find((x) => x.id === videoId)
  if (!v) throw new Error('動画が見つかりません')
  const t = db.themes.find((x) => x.id === v.themeId)
  return { courseId: t.courseId, themeId: t.id }
}

export function markCompleted(memberId, videoId) {
  const db = load()
  if (!db.progress.some((p) => p.memberId === memberId && p.videoId === videoId)) {
    db.progress.push({ memberId, videoId, completedAt: new Date().toISOString() })
    save(db)
  }
}

// ---------- 管理者向け ----------

export function adminListCourses() {
  const db = load()
  return db.courses
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ ...c, videoCount: courseCounts(db, c.id).length }))
}

export function adminCreateCourse({ title, description }) {
  const db = load()
  const sortOrder = Math.max(0, ...db.courses.map((c) => c.sortOrder)) + 1
  db.courses.push({ id: uid(), title, description: description || '', sortOrder })
  save(db)
}

export function adminUpdateCourse(id, fields) {
  const db = load()
  const c = db.courses.find((x) => x.id === id)
  if (c) Object.assign(c, fields)
  save(db)
}

export function adminDeleteCourse(id) {
  const db = load()
  const themeIds = db.themes.filter((t) => t.courseId === id).map((t) => t.id)
  const videoIds = db.videos.filter((v) => themeIds.includes(v.themeId)).map((v) => v.id)
  db.courses = db.courses.filter((c) => c.id !== id)
  db.themes = db.themes.filter((t) => t.courseId !== id)
  db.videos = db.videos.filter((v) => !themeIds.includes(v.themeId))
  db.enrollments = db.enrollments.filter((e) => e.courseId !== id)
  db.progress = db.progress.filter((p) => !videoIds.includes(p.videoId))
  save(db)
}

export function adminCreateTheme(courseId, title) {
  const db = load()
  const siblings = db.themes.filter((t) => t.courseId === courseId)
  const sortOrder = Math.max(0, ...siblings.map((t) => t.sortOrder)) + 1
  db.themes.push({ id: uid(), courseId, title, sortOrder })
  save(db)
}

export function adminUpdateTheme(id, fields) {
  const db = load()
  const t = db.themes.find((x) => x.id === id)
  if (t) Object.assign(t, fields)
  save(db)
}

export function adminDeleteTheme(id) {
  const db = load()
  const videoIds = db.videos.filter((v) => v.themeId === id).map((v) => v.id)
  db.themes = db.themes.filter((t) => t.id !== id)
  db.videos = db.videos.filter((v) => v.themeId !== id)
  db.progress = db.progress.filter((p) => !videoIds.includes(p.videoId))
  save(db)
}

export function adminCreateVideo({ themeId, title, youtubeUrl, thumbnailUrl }) {
  const db = load()
  const siblings = db.videos.filter((v) => v.themeId === themeId)
  const sortOrder = Math.max(0, ...siblings.map((v) => v.sortOrder)) + 1
  db.videos.push({ id: uid(), themeId, title, youtubeUrl, thumbnailUrl: thumbnailUrl || null, sortOrder })
  save(db)
}

export function adminUpdateVideo(id, fields) {
  const db = load()
  const v = db.videos.find((x) => x.id === id)
  if (v) Object.assign(v, fields)
  save(db)
}

export function adminDeleteVideo(id) {
  const db = load()
  db.videos = db.videos.filter((v) => v.id !== id)
  db.progress = db.progress.filter((p) => p.videoId !== id)
  save(db)
}

export function uploadThumbnail(dataUrl) {
  // お試しモードでは画像データをそのまま保存先として使う
  return dataUrl
}

export function adminListMembers() {
  const db = load()
  return db.members.map((m) => {
    const courseIds = db.enrollments.filter((e) => e.memberId === m.id).map((e) => e.courseId)
    const done = new Set(db.progress.filter((p) => p.memberId === m.id).map((p) => p.videoId))
    const courses = db.courses
      .filter((c) => courseIds.includes(c.id))
      .map((c) => {
        const vids = courseCounts(db, c.id)
        const completed = vids.filter((v) => done.has(v)).length
        return {
          id: c.id,
          title: c.title,
          total: vids.length,
          done: completed,
          percent: vids.length ? Math.round((completed / vids.length) * 100) : 0,
        }
      })
    return { id: m.id, name: m.name, email: m.email, isAdmin: m.isAdmin, registered: m.password != null, courses }
  })
}

export function adminCreateMember({ name, email, courseIds }) {
  const db = load()
  if (db.members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new Error('このメールアドレスはすでに登録されています。')
  }
  const id = uid()
  db.members.push({ id, name, email: email.trim(), isAdmin: false, password: null })
  for (const courseId of courseIds) db.enrollments.push({ memberId: id, courseId })
  save(db)
}

export function adminUpdateMember(id, { name, email, courseIds }) {
  const db = load()
  const m = db.members.find((x) => x.id === id)
  if (!m) return
  m.name = name
  m.email = email.trim()
  db.enrollments = db.enrollments.filter((e) => e.memberId !== id)
  for (const courseId of courseIds) db.enrollments.push({ memberId: id, courseId })
  save(db)
}

export function adminDeleteMember(id) {
  const db = load()
  db.members = db.members.filter((m) => m.id !== id)
  db.enrollments = db.enrollments.filter((e) => e.memberId !== id)
  db.progress = db.progress.filter((p) => p.memberId !== id)
  save(db)
}
