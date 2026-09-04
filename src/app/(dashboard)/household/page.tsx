'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Copy, Check, UserPlus, Shield } from 'lucide-react'
import * as householdActions from '@/app/(dashboard)/household/actions'

const getHouseholdData = async () => {
  const loader =
    (householdActions as any).getHouseholdData ??
    (householdActions as any).fetchHouseholdData ??
    (householdActions as any).loadHouseholdData

  if (!loader) {
    console.warn('No household data loader exported from household actions.')
    return null
  }

  return loader()
}

const joinHouseholdAction = async (code: string) => {
  const action = (householdActions as any).joinHouseholdAction

  if (!action) {
    return { success: false, error: 'No household join action exported.' }
  }

  return action(code)
}

export default function HouseholdPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
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

  const handleCopyCode = () => {
    if (!data?.inviteCode) return
    navigator.clipboard.writeText(data.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode) return
    setJoining(true)

    const result = await joinHouseholdAction(joinCode)
    if (result.success) {
      alert('¡Te has unido al hogar exitosamente!')
      setJoinCode('')
      await loadData()
    } else {
      alert('Error: ' + result.error)
    }
    setJoining(false)
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 backdrop-blur-md border border-white/60 p-2 text-gray-700 shadow-sm transition-all hover:bg-white/80">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm flex items-center gap-2">
            Gestión del Hogar <Users size={22} className="text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-600">Sincroniza con tu familia</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Código de tu Despensa</h2>
            <div className="flex items-center justify-between rounded-2xl bg-white/60 border border-white/80 p-3 shadow-inner">
              <span className="text-2xl font-mono font-bold tracking-widest text-indigo-600">
                {data?.inviteCode || '------'}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-600 active:scale-95 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Comparte este código con los miembros de tu casa para que administren los mismos productos.
            </p>
          </div>

          <form onSubmit={handleJoin} className="rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UserPlus size={16} /> Unirse a otra Despensa
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: A1B2C3"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={6}
                suppressHydrationWarning
                className="block w-full rounded-xl bg-white/50 border border-white/40 px-4 py-2.5 font-mono text-sm uppercase text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={joining || !joinCode}
                className="rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 active:scale-95 transition-all"
              >
                {joining ? 'Entrando...' : 'Unirse'}
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Miembros ({data?.members?.length || 0})
            </h2>
            <div className="space-y-3">
              {data?.members?.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/50 border border-white/40 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {m.profiles?.full_name || m.profiles?.email || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500">{m.profiles?.email}</p>
                  </div>
                  {m.role === 'admin' && (
                    <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      <Shield size={10} /> Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}