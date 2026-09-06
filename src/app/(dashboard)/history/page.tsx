'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Clock, History as HistoryIcon, Plus, Minus, PackagePlus, Trash2, Pencil } from 'lucide-react'

interface ActivityLog {
  id: string
  item_name: string
  action_type: 'ADD' | 'INCREASE' | 'DECREASE' | 'DELETE'
  details: string
  user_email: string
  user_name?: string
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
          // Extraer correos únicos del historial
          const uniqueEmails = Array.from(new Set(activityLogs.map(log => log.user_email).filter(Boolean)))
          
          let emailToNameMap: Record<string, string> = {}
          
          // Buscar los nombres en la tabla profiles
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

          // Vincular nombres a los registros
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
      case 'ADD': return 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
      case 'INCREASE': return 'text-blue-700 dark:text-blue-300 bg-blue-500/15 border-blue-500/30'
      case 'DECREASE': return 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30'
      case 'DELETE': return 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30'
      default: return 'text-slate-700 dark:text-slate-300 bg-slate-500/15 border-slate-500/30'
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ADD': return <PackagePlus size={13} />
      case 'INCREASE': return <Plus size={13} />
      case 'DECREASE': return <Minus size={13} />
      case 'DELETE': return <Trash2 size={13} />
      default: return <Pencil size={13} />
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

  const formatDetails = (details: string) => {
    if (!details) return ''
    return details
      .replace(/\b1\s+unidades\b/gi, '1 unidad')
      .replace(/\b1\s+litros\b/gi, '1 litro')
      .replace(/\b1\s+kilos\b/gi, '1 kilo')
      .replace(/\b1\s+kilogramos\b/gi, '1 kilogramo')
      .replace(/\b1\s+latas\b/gi, '1 lata')
      .replace(/\b1\s+botellas\b/gi, '1 botella')
      .replace(/\b1\s+cajas\b/gi, '1 caja')
      .replace(/\b1\s+paquetes\b/gi, '1 paquete')
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('es-CL', { 
      day: 'numeric', month: 'numeric', year: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    })
  }

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link 
          href="/pantry" 
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95 ${glass3dClass}`}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
            Historial <Clock size={20} className="text-indigo-500" />
          </h1>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Registro de actividades recientes</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center mt-8 ${glass3dClass}`}>
          <HistoryIcon className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Sin historial aún</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Los cambios que realices tú o tu familia en la despensa aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-500/30 ml-4 pl-4 space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="relative">
              <div className="absolute -left-6.25 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                {getActionIcon(log.action_type)}
              </div>

              <div className={`rounded-2xl p-4 transition-all ${glass3dClass}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {log.item_name}
                  </h3>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${getActionStyles(log.action_type)}`}>
                    {getActionText(log.action_type)}
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {formatDetails(log.details)}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 border-t border-black/5 dark:border-white/5 pt-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 capitalize">{log.user_name}</span>
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