import { useRef, useState } from 'react'
import { fileToResizedDataUrl } from '../lib/image.js'

// サムネイル画像の添付欄(ドラッグ&ドロップ / ファイル選択の両対応)
export default function ThumbDrop({ value, onChange }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    setError('')
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      onChange(dataUrl)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 text-center transition ${
          dragging ? 'border-plum-500 bg-plum-50' : 'border-plum-200 bg-white hover:border-plum-400'
        }`}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value} alt="サムネイル" className="aspect-video w-28 rounded-lg object-cover ring-1 ring-plum-100" />
            <div className="text-left text-xs text-ink/60">
              <p className="font-semibold text-plum-700">画像を添付済み</p>
              <p>クリックまたはドロップで差し替え</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
                className="mt-1 text-[11px] text-ink/40 underline hover:text-plum-600"
              >
                画像を外す
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-ink/50">
            <p className="font-semibold text-plum-600">サムネイル画像をここにドラッグ&ドロップ</p>
            <p className="mt-0.5">またはクリックしてファイルを選択(添付しない場合はYouTubeの画像を自動使用)</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
