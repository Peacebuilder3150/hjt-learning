export default function Brand({ large = false }) {
  return (
    <span className="inline-flex select-none items-baseline gap-1.5">
      <span
        className={`font-display font-bold tracking-wide bg-linear-to-br from-plum-600 to-plum-800 bg-clip-text text-transparent ${
          large ? 'text-5xl' : 'text-2xl'
        }`}
      >
        HJT
      </span>
      <span className={`font-display font-semibold text-plum-700 ${large ? 'text-3xl' : 'text-lg'}`}>
        メソッド<span className={`align-super ${large ? 'text-sm' : 'text-[10px]'}`}>™</span>
      </span>
      <span
        className={`ml-1 font-medium tracking-[0.25em] text-gold-600 ${
          large ? 'text-sm' : 'hidden text-[11px] sm:inline-block'
        }`}
      >
        学習コンテンツ
      </span>
    </span>
  )
}
