'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function JoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [householdName, setHouseholdName] = useState('')

  useEffect(() => {
    async function processJoin() {
      const inviteCode = searchParams.get('code')

      if (!inviteCode) {
        setError('No se proporcionó ningún código de invitación.')
        setLoading(false)
        return
      }

      // 1. Verificar si el usuario está autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Si no está logueado, redirigir al login guardando la intención de unirse
        toast.info('Inicia sesión para unirte al hogar')
        // Podríamos guardar el código en sessionStorage para procesarlo después del login,
        // pero por ahora redirigimos simplemente.
        router.push(`/login?redirect=/join?code=${inviteCode}`)
        return
      }

      // 2. Buscar el hogar con ese código
      const { data: household } = await supabase
        .from('households')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (!household) {
        setError('El código de invitación es inválido o ha expirado.')
        setLoading(false)
        return
      }

      setHouseholdName(household.name)

      // 3. Verificar si el usuario ya pertenece a este hogar
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', household.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        toast.info('Ya eres miembro de este hogar.')
        router.push('/pantry')
        return
      }

      // 4. Unir al usuario al hogar
      const { error: joinError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'member'
        })

      if (joinError) {
        setError('Ocurrió un error al intentar unirte al hogar.')
      } else {
        setSuccess(true)
        toast.success(`¡Te has unido a ${household.name}!`)
        // Redirigir a la despensa después de un breve momento
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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Fondo de esferas (similar al dashboard layout para mantener coherencia visual) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/20 dark:bg-purple-600/15 blur-3xl" />
      </div>

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
              Te has unido exitosamente al hogar:
            </p>
            <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg mb-6">
              {householdName}
            </p>
            <p className="text-xs text-gray-500 animate-pulse">
              Redirigiendo a la despensa...
            </p>
          </div>
        ) : null}

      </div>
    </div>
  )
}