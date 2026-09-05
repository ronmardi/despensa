export function FooterCredit() {
  return (
    <footer className="py-6 text-center">
      <a
        href="https://raccoonlab.cl"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/60 dark:border-slate-800/80 px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-xs active:scale-95"
      >
        <span>Desarrollado por</span>
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-gray-900 dark:text-white">
          <img
            src="/raccoonlab-logo.svg"
            alt="Raccoon Lab"
            className="h-4 w-auto object-contain filter drop-shadow-xs"
            onError={(e) => {
              // Muestra el emoji como respaldo si aún no has subido la imagen a /public
              e.currentTarget.style.display = 'none'
            }}
          />
          <span>Raccoon Lab</span>
        </div>
      </a>
    </footer>
  )
}