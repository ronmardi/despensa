'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ShoppingCart, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErrorMsg(error.message)
      else alert('Revisa tu correo para confirmar la cuenta')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
      else {
        router.push('/pantry')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-3 rounded-full mb-3 border border-indigo-500/20">
            <ShoppingCart size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm mb-1">Mi Despensa</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Crea una cuenta nueva' : 'Gestiona el inventario de tu hogar'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Botón de Google SSO */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-6 w-full flex items-center justify-center gap-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar con Google
        </button>

        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="h-px w-full bg-gray-300 dark:bg-slate-700"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">O con correo</span>
          <div className="h-px w-full bg-gray-300 dark:bg-slate-700"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="block w-full rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white/80 dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white/80 dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-3.5 font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg('')
            }}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear cuenta nueva'}
          </button>
        </div>
        
      </div>
    </div>
  )
}