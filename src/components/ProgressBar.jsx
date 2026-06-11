export default function ProgressBar({ percent, className = '' }) {
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)))
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-plum-100 ${className}`}>
      <div
        className="h-full rounded-full bg-linear-to-r from-plum-600 to-gold-500 transition-all duration-500"
        style={{ width: `${p}%` }}
      />
    </div>
  )
}
