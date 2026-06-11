// =====================================================================
// データの読み書き窓口。
// Supabase(本番の保存先)が設定されていればそちらを、
// 未設定なら「お試しモード」(ブラウザ内保存)を使う。
// =====================================================================
import { supabase, isDemo } from './supabase.js'
import * as demo from './demo.js'
import { dataUrlToBlob } from './image.js'

function check(error) {
  if (error) throw new Error(error.message)
}

const bySort = (a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0)

const mapVideo = (v, done) => ({
  id: v.id,
  title: v.title,
  youtubeUrl: v.youtube_url,
  thumbnailUrl: v.thumbnail_url,
  sortOrder: v.sort_order,
  completed: done ? done.has(v.id) : false,
})

// ---------- 受講生向け ----------

export async function getMyCourses(memberId) {
  if (isDemo) return demo.getMyCourses(memberId)
  const [{ data: courses, error: e1 }, { data: prog, error: e2 }] = await Promise.all([
    supabase.from('courses').select('id,title,description,sort_order,themes(id,videos(id))').order('sort_order'),
    supabase.from('progress').select('video_id').eq('member_id', memberId),
  ])
  check(e1)
  check(e2)
  const done = new Set((prog || []).map((p) => p.video_id))
  return (courses || []).map((c) => {
    const vids = (c.themes || []).flatMap((t) => (t.videos || []).map((v) => v.id))
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      videoCount: vids.length,
      completedCount: vids.filter((v) => done.has(v)).length,
    }
  })
}

export async function getCourse(courseId, memberId) {
  if (isDemo) return demo.getCourse(courseId, memberId)
  const [{ data: c, error: e1 }, { data: prog, error: e2 }] = await Promise.all([
    supabase
      .from('courses')
      .select('id,title,description,themes(id,title,sort_order,videos(id,title,youtube_url,thumbnail_url,sort_order))')
      .eq('id', courseId)
      .single(),
    supabase.from('progress').select('video_id').eq('member_id', memberId),
  ])
  check(e1)
  check(e2)
  const done = new Set((prog || []).map((p) => p.video_id))
  const themes = (c.themes || [])
    .slice()
    .sort(bySort)
    .map((t) => ({
      id: t.id,
      title: t.title,
      sortOrder: t.sort_order,
      videos: (t.videos || []).slice().sort(bySort).map((v) => mapVideo(v, done)),
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

export async function getVideoLocation(videoId) {
  if (isDemo) return demo.getVideoLocation(videoId)
  const { data, error } = await supabase.from('videos').select('id, themes(id, course_id)').eq('id', videoId).single()
  check(error)
  return { courseId: data.themes.course_id, themeId: data.themes.id }
}

export async function markCompleted(memberId, videoId) {
  if (isDemo) return demo.markCompleted(memberId, videoId)
  const { error } = await supabase
    .from('progress')
    .upsert({ member_id: memberId, video_id: videoId }, { onConflict: 'member_id,video_id', ignoreDuplicates: true })
  check(error)
}

// ---------- 管理者向け ----------

export async function adminListCourses() {
  if (isDemo) return demo.adminListCourses()
  const { data, error } = await supabase.from('courses').select('id,title,description,sort_order,themes(videos(id))').order('sort_order')
  check(error)
  return (data || []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    sortOrder: c.sort_order,
    videoCount: (c.themes || []).flatMap((t) => t.videos || []).length,
  }))
}

export async function adminCreateCourse({ title, description }) {
  if (isDemo) return demo.adminCreateCourse({ title, description })
  const list = await adminListCourses()
  const sortOrder = Math.max(0, ...list.map((c) => c.sortOrder)) + 1
  const { error } = await supabase.from('courses').insert({ title, description: description || '', sort_order: sortOrder })
  check(error)
}

export async function adminUpdateCourse(id, { title, description }) {
  if (isDemo) return demo.adminUpdateCourse(id, { title, description })
  const { error } = await supabase.from('courses').update({ title, description: description || '' }).eq('id', id)
  check(error)
}

export async function adminDeleteCourse(id) {
  if (isDemo) return demo.adminDeleteCourse(id)
  const { error } = await supabase.from('courses').delete().eq('id', id)
  check(error)
}

export async function adminCreateTheme(courseId, title) {
  if (isDemo) return demo.adminCreateTheme(courseId, title)
  const { data, error: e1 } = await supabase.from('themes').select('sort_order').eq('course_id', courseId)
  check(e1)
  const sortOrder = Math.max(0, ...(data || []).map((t) => t.sort_order)) + 1
  const { error } = await supabase.from('themes').insert({ course_id: courseId, title, sort_order: sortOrder })
  check(error)
}

export async function adminUpdateTheme(id, fields) {
  if (isDemo) return demo.adminUpdateTheme(id, fields)
  const row = {}
  if (fields.title !== undefined) row.title = fields.title
  if (fields.sortOrder !== undefined) row.sort_order = fields.sortOrder
  const { error } = await supabase.from('themes').update(row).eq('id', id)
  check(error)
}

export async function adminDeleteTheme(id) {
  if (isDemo) return demo.adminDeleteTheme(id)
  const { error } = await supabase.from('themes').delete().eq('id', id)
  check(error)
}

export async function adminCreateVideo({ themeId, title, youtubeUrl, thumbnailUrl }) {
  if (isDemo) return demo.adminCreateVideo({ themeId, title, youtubeUrl, thumbnailUrl })
  const { data, error: e1 } = await supabase.from('videos').select('sort_order').eq('theme_id', themeId)
  check(e1)
  const sortOrder = Math.max(0, ...(data || []).map((v) => v.sort_order)) + 1
  const { error } = await supabase
    .from('videos')
    .insert({ theme_id: themeId, title, youtube_url: youtubeUrl, thumbnail_url: thumbnailUrl || null, sort_order: sortOrder })
  check(error)
}

export async function adminUpdateVideo(id, fields) {
  if (isDemo) return demo.adminUpdateVideo(id, fields)
  const row = {}
  if (fields.title !== undefined) row.title = fields.title
  if (fields.youtubeUrl !== undefined) row.youtube_url = fields.youtubeUrl
  if (fields.thumbnailUrl !== undefined) row.thumbnail_url = fields.thumbnailUrl
  if (fields.sortOrder !== undefined) row.sort_order = fields.sortOrder
  const { error } = await supabase.from('videos').update(row).eq('id', id)
  check(error)
}

export async function adminDeleteVideo(id) {
  if (isDemo) return demo.adminDeleteVideo(id)
  const { error } = await supabase.from('videos').delete().eq('id', id)
  check(error)
}

// サムネイル画像を保存して、表示用の場所(URL)を返す
export async function uploadThumbnail(dataUrl) {
  if (isDemo) return demo.uploadThumbnail(dataUrl)
  const blob = dataUrlToBlob(dataUrl)
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error } = await supabase.storage.from('thumbnails').upload(path, blob, { contentType: 'image/jpeg' })
  check(error)
  return supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl
}

export async function adminListMembers() {
  if (isDemo) return demo.adminListMembers()
  const [members, enrollments, courses, progress] = await Promise.all([
    supabase.from('members').select('id,name,email,is_admin,auth_user_id').order('created_at'),
    supabase.from('enrollments').select('member_id,course_id'),
    supabase.from('courses').select('id,title,sort_order,themes(videos(id))').order('sort_order'),
    supabase.from('progress').select('member_id,video_id'),
  ])
  for (const r of [members, enrollments, courses, progress]) check(r.error)

  const courseVideos = new Map(
    (courses.data || []).map((c) => [c.id, (c.themes || []).flatMap((t) => (t.videos || []).map((v) => v.id))])
  )
  const courseTitle = new Map((courses.data || []).map((c) => [c.id, c.title]))

  return (members.data || []).map((m) => {
    const myCourses = (enrollments.data || []).filter((e) => e.member_id === m.id).map((e) => e.course_id)
    const done = new Set((progress.data || []).filter((p) => p.member_id === m.id).map((p) => p.video_id))
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      isAdmin: m.is_admin,
      registered: !!m.auth_user_id,
      courses: myCourses.map((cid) => {
        const vids = courseVideos.get(cid) || []
        const completed = vids.filter((v) => done.has(v)).length
        return {
          id: cid,
          title: courseTitle.get(cid) || '',
          total: vids.length,
          done: completed,
          percent: vids.length ? Math.round((completed / vids.length) * 100) : 0,
        }
      }),
    }
  })
}

export async function adminCreateMember({ name, email, courseIds }) {
  if (isDemo) return demo.adminCreateMember({ name, email, courseIds })
  const { data, error } = await supabase.from('members').insert({ name, email: email.trim() }).select('id').single()
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error('このメールアドレスはすでに登録されています。')
    throw new Error(error.message)
  }
  if (courseIds.length) {
    const { error: e2 } = await supabase.from('enrollments').insert(courseIds.map((courseId) => ({ member_id: data.id, course_id: courseId })))
    check(e2)
  }
}

export async function adminUpdateMember(id, { name, email, courseIds }) {
  if (isDemo) return demo.adminUpdateMember(id, { name, email, courseIds })
  const { error } = await supabase.from('members').update({ name, email: email.trim() }).eq('id', id)
  check(error)
  const { error: e2 } = await supabase.from('enrollments').delete().eq('member_id', id)
  check(e2)
  if (courseIds.length) {
    const { error: e3 } = await supabase.from('enrollments').insert(courseIds.map((courseId) => ({ member_id: id, course_id: courseId })))
    check(e3)
  }
}

export async function adminDeleteMember(id) {
  if (isDemo) return demo.adminDeleteMember(id)
  const { error } = await supabase.from('members').delete().eq('id', id)
  check(error)
}
