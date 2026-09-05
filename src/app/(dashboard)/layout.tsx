import { Toaster } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Esferas de luz de fondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/20 dark:bg-purple-600/15 blur-3xl" />
      </div>

      <main className="relative z-10">
        {children}
      </main>

      <Toaster 
        position="bottom-center" 
        theme="system" 
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)'
          },
        }}
      />
    </div>
  )
}