export function FooterCredit() {
  return (
    <footer className="py-6 text-center">
      <a
        href="https://raccoonlab.cl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-slate-800/80 px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-emerald-500/30 transition-all shadow-xs active:scale-95"
      >
        <span>Desarrollado por</span>
        <div className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white">
          <span className="bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-extrabold text-sm">
            Raccoon Lab
          </span>
          <img
            src="/raccoonlab-logo.png"
            alt="Raccoon Lab"
            className="h-6 w-auto object-contain filter drop-shadow-xs"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      </a>
    </footer>
  )
}