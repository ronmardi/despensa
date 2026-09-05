'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Clock, History, Loader2, Plus, Minus, Trash2, Pencil, PackagePlus } from 'lucide-react'

interface HistoryLog {
  id: string
  item_name: string
  action: string
  quantity_change?: number
  new_quantity?: number
  user_name?: string
  created_at: string
}

export default function HistoryPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<HistoryLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (members) {
        const { data: historyLogs } = await supabase
          .from('pantry_history')
          .select('*')
          .eq('household_id', members.household_id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (historyLogs) setLogs(historyLogs)
      }
      setLoading(false)
    }

    loadHistory()
  }, [supabase])

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleString('es-CL', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBadgeStyle = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('sumado') || act.includes('agregado') || act.includes('mas')) {
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    }
    if (act.includes('restado') || act.includes('consumido') || act.includes('menos')) {
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    }
    if (act.includes('creado') || act.includes('nuevo')) {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    }
    if (act.includes('eliminado') || act.includes('borrado')) {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
    }
    return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
  }

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('sumado') || act.includes('agregado')) return <Plus size={13} />
    if (act.includes('restado') || act.includes('consumido')) return <Minus size={13} />
    if (act.includes('creado')) return <PackagePlus size={13} />
    if (act.includes('eliminado')) return <Trash2 size={13} />
    return <Pencil size={13} />
  }

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center mt-8 ${glass3dClass}`}>
          <History className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Sin historial aún</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Los cambios de inventario que realices tú o tu familia aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-500/30 ml-4 pl-4 space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="relative">
              <div className="absolute -left-6.25 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
              {getActionIcon(log.action)}
              </div>

              <div className={`rounded-2xl p-4 transition-all ${glass3dClass}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {log.item_name}
                  </h3>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold capitalize border ${getBadgeStyle(log.action)}`}>
                    {log.action}
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {log.action.toLowerCase().includes('sumado') || log.action.toLowerCase().includes('agregado')
                    ? `Agregó ${log.quantity_change ?? 1} unidades.`
                    : log.action.toLowerCase().includes('restado') || log.action.toLowerCase().includes('consumido')
                    ? `Consumió ${Math.abs(log.quantity_change ?? 1)} unidades.`
                    : 'Actualización en el inventario.'}
                  {log.new_quantity !== undefined && log.new_quantity !== null && (
                    <span className="font-semibold text-gray-800 dark:text-gray-200"> Total: {log.new_quantity}</span>
                  )}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 border-t border-black/5 dark:border-white/5 pt-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">{log.user_name || 'Usuario'}</span>
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