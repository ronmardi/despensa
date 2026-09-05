export function FooterCredit() {
  return (
    <footer className="py-6 text-center">
      <a
        href="https://raccoonlab.cl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-slate-800/80 px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-xs active:scale-95"
      >
        <span>Desarrollado por</span>
        <span className="font-bold tracking-tight text-gray-900 dark:text-white">Raccoon Lab</span>
        <span className="text-xs">🦝</span>
      </a>
    </footer>
  )
}