'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FooterCredit } from '@/components/FooterCredit'
import { Loader2, Fingerprint } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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

  // Nueva función para inicio de sesión biométrico (Passkey)
  const handlePasskeyLogin = async () => {
    setLoading(true)
    setErrorMsg('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPasskey()
      if (error) throw error
      
      // Si la autenticación biométrica es exitosa, redirigimos
      if (data?.user) {
        router.push('/pantry')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg('No se pudo iniciar sesión con huella/FaceID.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    if (isResetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) setErrorMsg(error.message)
      else setSuccessMsg('Te hemos enviado un enlace de recuperación a tu correo.')
    } else if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErrorMsg(error.message)
      else setSuccessMsg('Revisa tu correo para confirmar la cuenta.')
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

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 relative overflow-hidden">
      {/* Esferas decorativas de fondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/20 dark:bg-purple-600/15 blur-3xl" />
      </div>

      <div className="my-auto w-full max-w-sm relative z-10">
        {/* Contenedor Principal Liquid Glass */}
        <div className={`relative rounded-3xl p-8 text-center ${glass3dClass}`}>
          
          {/* Botón de tema en la esquina superior derecha del cuadro */}
          <div className="absolute top-4 right-4 z-20">
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center mb-6">
            {/* Logo oficial integrado */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-slate-700/60 p-2.5 mb-3 shadow-md">
              <img 
                src="/icon.svg" 
                alt="Mi Despensa Logo" 
                className="h-full w-full object-contain filter drop-shadow-sm" 
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm mb-1">
              Mi Despensa
            </h1>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {isResetMode ? 'Recupera tu acceso' : isSignUp ? 'Crea una cuenta nueva' : 'Gestiona el inventario de tu hogar'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-xs font-semibold text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          {!isResetMode && (
            <>
              {/* Botón Passkey (Biometría) */}
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={loading}
                className="mb-3 w-full flex items-center justify-center gap-3 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Fingerprint size={18} className="text-indigo-600 dark:text-indigo-400" />
                Iniciar sesión con Huella / FaceID
              </button>

              {/* Botón de Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mb-5 w-full flex items-center justify-center gap-3 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </button>

              <div className="mb-5 flex items-center justify-center gap-3">
                <div className="h-px w-full bg-black/10 dark:bg-white/10"></div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider shrink-0">O con correo</span>
                <div className="h-px w-full bg-black/10 dark:bg-white/10"></div>
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
              />
            </div>
            
            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true)
                        setErrorMsg('')
                        setSuccessMsg('')
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                    >
                      ¿La olvidaste?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required={!isResetMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Cargando...' : isResetMode ? 'Enviar enlace de recuperación' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-5 text-center">
            {isResetMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Volver a iniciar sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear cuenta nueva'}
              </button>
            )}
          </div>
        </div>
      </div>

      <FooterCredit />
    </div>
  )
}