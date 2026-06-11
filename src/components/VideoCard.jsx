import { Link } from 'react-router-dom'
import { parseYouTubeId, youtubeThumb } from '../lib/youtube.js'

export function videoThumbSrc(video) {
  if (video.thumbnailUrl) return video.thumbnailUrl
  const id = parseYouTubeId(video.youtubeUrl)
  return id ? youtubeThumb(id) : null
}

export default function VideoCard({ video }) {
  const thumb = videoThumbSrc(video)
  return (
    <Link to={`/watch/${video.id}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-plum-100 shadow-sm ring-1 ring-black/5 transition group-hover:-translate-y-0.5 group-hover:shadow-md">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-plum-300">HJT</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-plum-800/0 transition group-hover:bg-plum-800/30">
          <span className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 text-plum-700 opacity-0 shadow transition group-hover:scale-100 group-hover:opacity-100">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        {video.completed && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            ✓ 完了
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug text-ink/80 group-hover:text-plum-700">
        {video.title}
      </p>
    </Link>
  )
}
