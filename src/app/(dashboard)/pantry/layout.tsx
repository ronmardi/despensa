import { Toaster } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-slate-100 via-indigo-50/60 to-purple-50/40 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80 dark:text-slate-100 transition-colors duration-300">
      {/* Esferas de brillo de fondo para reforzar el efecto de refracción de cristal */}
      <div className="pointer-events-none fixed -top-24 -left-20 h-72 w-72 rounded-full bg-indigo-400/20 dark:bg-indigo-600/15 blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 -right-20 h-80 w-80 rounded-full bg-purple-400/20 dark:bg-purple-600/15 blur-3xl" />

      <main className="relative z-10">
        {children}
      </main>

      <Toaster 
        position="bottom-center" 
        theme="system" 
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
          },
        }}
      />
    </div>
  )
}