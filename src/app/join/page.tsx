'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { joinHouseholdAction } from '@/app/(dashboard)/household/actions'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

function JoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function processJoin() {
      const inviteCode = searchParams.get('code')

      if (!inviteCode) {
        setError('No se proporcionó ningún código de invitación.')
        setLoading(false)
        return
      }

      // 1. Verificar si hay usuario autenticado en la sesión
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.info('Inicia sesión para unirte al hogar')
        router.push(`/login?redirect=/join?code=${inviteCode}`)
        return
      }

      // 2. Ejecutar la acción segura en el servidor
      const res = await joinHouseholdAction(inviteCode)

      if (!res.success) {
        setError(res.error || 'Ocurrió un error al intentar unirte al hogar.')
      } else {
        setSuccess(true)
        toast.success('¡Te has unido al hogar con éxito!')
        setTimeout(() => {
          router.push('/pantry')
        }, 2000)
      }
      
      setLoading(false)
    }

    processJoin()
  }, [supabase, router, searchParams])

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className={`relative z-10 w-full max-w-sm rounded-3xl p-8 text-center ${glass3dClass}`}>
      {loading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Procesando invitación...</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Verificando código de acceso</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center">
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error de Invitación</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link 
            href="/household"
            className="rounded-xl bg-indigo-600 text-white font-bold px-6 py-3 text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all w-full"
          >
            Volver a Mi Hogar
          </Link>
        </div>
      ) : success ? (
        <div className="flex flex-col items-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Bienvenido!</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Te has unido exitosamente al hogar.
          </p>
          <p className="text-xs text-gray-500 animate-pulse">
            Redirigiendo a la despensa...
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/20 dark:bg-purple-600/15 blur-3xl" />
      </div>

      <Suspense fallback={
        <div className="relative z-10 w-full max-w-sm rounded-3xl p-8 text-center backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cargando...</h2>
        </div>
      }>
        <JoinContent />
      </Suspense>
    </div>
  )
}