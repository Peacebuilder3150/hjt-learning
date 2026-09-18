export default function Brand({ large = false }) {
  if (large) {
    // ログイン画面などの大きなロゴ(2段組みで上品に)
    return (
      <span className="inline-flex select-none flex-col items-center gap-2">
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="inline-block pb-2 font-display font-extrabold leading-[1.15] tracking-wide bg-linear-to-br from-plum-600 to-plum-800 bg-clip-text text-transparent text-5xl sm:text-6xl">
            HJT
          </span>
          <span className="font-display font-bold text-plum-700 text-2xl sm:text-3xl">
            メソッド<span className="align-super text-xs sm:text-sm">™</span>
          </span>
        </span>
        <span className="flex items-center gap-3 whitespace-nowrap">
          <span className="h-px w-6 bg-gold-400/70" />
          <span className="font-medium uppercase tracking-[0.4em] text-gold-600 text-xs sm:text-sm">
            学習コンテンツ
          </span>
          <span className="h-px w-6 bg-gold-400/70" />
        </span>
      </span>
    )
  }

  // ヘッダー用の小さなロゴ(1行で折り返さない)
  return (
    <span className="inline-flex select-none items-baseline gap-1.5 whitespace-nowrap">
      <span className="inline-block pb-0.5 font-display font-extrabold leading-[1.2] tracking-wide bg-linear-to-br from-plum-600 to-plum-800 bg-clip-text text-transparent text-2xl">
        HJT
      </span>
      <span className="hidden font-display font-bold text-plum-700 text-lg whitespace-nowrap sm:inline">
        メソッド<span className="align-super text-[10px]">™</span>
      </span>
      <span className="ml-1 hidden font-medium tracking-[0.25em] text-gold-600 text-[11px] whitespace-nowrap sm:inline-block">
        学習コンテンツ
      </span>
    </span>
  )
}
