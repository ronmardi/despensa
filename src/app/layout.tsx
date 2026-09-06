import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { FloatingDock } from '@/components/FloatingDock'
import { MusicPlayer } from '@/components/MusicPlayer'

export const metadata: Metadata = {
  title: 'Mi Despensa',
  description: 'Gestión inteligente de despensa',
  applicationName: 'Mi Despensa',
  appleWebApp: {
    capable: true,
    title: 'Mi Despensa',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Fundamental para que se sienta como App nativa (evita el zoom)
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full bg-slate-100 dark:bg-slate-950" suppressHydrationWarning>
      <body className="min-h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <MusicPlayer />
          <FloatingDock />
        </ThemeProvider>
      </body>
    </html>
  )
}