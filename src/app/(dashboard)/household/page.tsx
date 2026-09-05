'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Copy, Check, UserPlus, Shield, Home, LogOut, Loader2 } from 'lucide-react'
import { getHouseholdData, joinHouseholdAction, createHouseholdAction, leaveHouseholdAction } from './actions'
import { useRouter } from 'next/navigation'

export default function HouseholdPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const res = await getHouseholdData()
    setData(res)
    setLoading(false)
  }

  const handleCopy = () => {
    if (data?.household?.invite_code) {
      navigator.clipboard.writeText(data.household.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    const res = await joinHouseholdAction(joinCode)
    if (res.success) {
      setJoinCode('')
      await loadData()
    } else {
      alert(res.error)
    }
    setJoining(false)
  }

  const handleCreate = async () => {
    setCreating(true)
    const res = await createHouseholdAction()
    if (res.success) {
      await loadData()
    } else {
      alert(res.error)
    }
    setCreating(false)
  }

  const handleLeave = async () => {
    if (!confirm('¿Seguro que quieres abandonar esta despensa? Perderás el acceso a sus productos.')) return
    const res = await leaveHouseholdAction()
    if (res.success) {
      router.push('/pantry')
    } else {
      alert(res.error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 p-2 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
            Gestión del Hogar <Users size={22} className="text-indigo-500 dark:text-indigo-400" />
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data ? 'Sincroniza con tu familia' : 'Configura tu espacio'}
          </p>
        </div>
      </header>

      {!data ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <Home className="mx-auto mb-4 text-indigo-400" size={48} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aún no tienes una despensa</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Puedes crear una nueva para ti, o unirte a una existente usando un código de invitación.</p>
            
            <button
              onClick={handleCreate}
              disabled={creating}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-3 font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Home size={18} />}
              Crear nueva despensa
            </button>
          </div>

          <form onSubmit={handleJoin} className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">¿Tienes un código?</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ej: A1B2C3"
                className="flex-1 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 px-4 py-3 text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={joining || !joinCode}
                className="flex items-center justify-center rounded-xl bg-indigo-600 px-5 font-medium text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                Unirse
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Código de Invitación */}
          <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">Código de tu despensa</h2>
            <div className="flex items-center justify-between rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700/40 p-4">
              <span className="text-2xl font-mono font-bold tracking-[0.2em] text-indigo-700 dark:text-indigo-400">
                {data.household.invite_code}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  copied 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                    : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Unirse a otra */}
          <form onSubmit={handleJoin} className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
              <UserPlus size={14} /> Cambiar de Despensa
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ej: A1B2C3"
                className="flex-1 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700/40 px-4 py-3 text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={joining || !joinCode}
                className="flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-5 font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
              >
                Unirse
              </button>
            </div>
          </form>

          {/* Miembros */}
          <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">Miembros activos</h2>
            <div className="space-y-3">
              {data.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {member.profiles?.full_name ? member.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      {member.profiles?.full_name || 'Usuario'}
                      {member.user_id === data.currentUserId && ' (Tú)'}
                    </span>
                  </div>
                  {member.role === 'admin' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Botón de salir */}
            <div className="mt-6 pt-4 border-t border-white/60 dark:border-slate-700/60">
              <button
                onClick={handleLeave}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:text-white transition-all cursor-pointer"
              >
                <LogOut size={16} /> Abandonar esta despensa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}