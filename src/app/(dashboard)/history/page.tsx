'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Clock, History as HistoryIcon } from 'lucide-react'

interface ActivityLog {
  id: string
  item_name: string
  action_type: 'ADD' | 'INCREASE' | 'DECREASE' | 'DELETE'
  details: string
  user_email: string
  user_name?: string // <-- Agregado para almacenar el nombre traducido
  created_at: string
}

export default function HistoryPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const householdId = members[0].household_id
        
        const { data: activityLogs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (activityLogs) {
          // 1. Extraer todos los correos únicos del historial
          const uniqueEmails = Array.from(new Set(activityLogs.map(log => log.user_email).filter(Boolean)))
          
          let emailToNameMap: Record<string, string> = {}
          
          // 2. Buscar los nombres de esos correos en la tabla profiles
          if (uniqueEmails.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('email, full_name')
              .in('email', uniqueEmails)
              
            if (profiles) {
              profiles.forEach(profile => {
                if (profile.full_name) {
                  emailToNameMap[profile.email] = profile.full_name
                }
              })
            }
          }

          // 3. Unir el nombre al registro (con fallback amigable si no tienen nombre)
          const logsWithNames = activityLogs.map(log => ({
            ...log,
            user_name: emailToNameMap[log.user_email] || log.user_email?.split('@')[0] || 'Usuario'
          }))

          setLogs(logsWithNames)
        }
      }
      setLoading(false)
    }

    loadLogs()
  }, [supabase])

  const getActionStyles = (type: string) => {
    switch (type) {
      case 'ADD': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
      case 'INCREASE': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
      case 'DECREASE': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
      case 'DELETE': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20'
    }
  }

  const getActionText = (type: string) => {
    switch (type) {
      case 'ADD': return 'Creado'
      case 'INCREASE': return 'Sumado'
      case 'DECREASE': return 'Restado'
      case 'DELETE': return 'Eliminado'
      default: return 'Actualizado'
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('es-ES', { 
      day: 'numeric', month: 'numeric', year: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    })
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 p-2 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
            Historial <Clock size={22} className="text-indigo-500 dark:text-indigo-400"/>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Registro de actividades recientes</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <HistoryIcon className="mx-auto mb-3 text-gray-400" size={48} />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sin historial aún</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Los cambios que realices en tu despensa aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-indigo-200 dark:before:via-indigo-800 before:to-transparent">
          {logs.map((log) => (
            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-900 text-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <HistoryIcon size={16} />
              </div>
              
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700/80 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{log.item_name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActionStyles(log.action_type)}`}>
                    {getActionText(log.action_type)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{log.details}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-slate-700/50 pt-2">
                  <span className="font-medium capitalize">{log.user_name || log.user_email}</span>
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}