import { Toaster } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen transition-colors">
      {children}
      <Toaster 
        position="bottom-center" 
        theme="system" 
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          },
        }}
      />
    </div>
  )
}