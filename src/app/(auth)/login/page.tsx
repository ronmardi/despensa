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
      {/* Botón de tema en la esquina */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        
        <div className="text-center mb-8 flex flex-col items-center">
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