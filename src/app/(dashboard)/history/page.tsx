'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Clock, Plus, Minus, Trash2, RefreshCw, PackagePlus } from 'lucide-react'

interface ActivityLog {
  id: string
  user_email: string
  item_name: string
  action_type: string
  details: string
  created_at: string
}

export default function HistoryPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const householdId = members[0].household_id
        const { data: historyLogs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (historyLogs) setLogs(historyLogs)
      }
      setLoading(false)
    }

    loadHistory()
  }, [supabase])

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'ADD':
        return <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"><PackagePlus size={12}/> Creado</span>
      case 'INCREASE':
        return <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full"><Plus size={12}/> Sumó</span>
      case 'DECREASE':
        return <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Minus size={12}/> Restó</span>
      case 'RESTOCK':
        return <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full"><RefreshCw size={12}/> Reabasteció</span>
      case 'DELETE':
        return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full"><Trash2 size={12}/> Eliminó</span>
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 backdrop-blur-md border border-white/60 p-2 text-gray-700 shadow-sm transition-all hover:bg-white/80">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm flex items-center gap-2">
            Historial <Clock size={22} className="text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-600">Registro de actividades recientes</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <Clock className="mx-auto mb-3 text-gray-400" size={44} />
          <h2 className="text-base font-semibold text-gray-800">Sin historial aún</h2>
          <p className="mt-1 text-xs text-gray-500">Los cambios que realices en tu despensa aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl bg-white/40 backdrop-blur-lg border border-white/60 p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 text-sm">{log.item_name}</span>
                {getActionBadge(log.action_type)}
              </div>
              <p className="text-xs text-gray-600 mb-2">{log.details}</p>
              <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/40 pt-2">
                <span>{log.user_email || 'Usuario'}</span>
                <span>{new Date(log.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}