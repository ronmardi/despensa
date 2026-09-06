'use client'

import { useState } from 'react'
import { PlusCircle, Users, Home, KeyRound, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createHouseholdAction, joinHouseholdAction } from '@/app/(dashboard)/pantry/actions'

interface OnboardingModalProps {
  userName?: string
  isOpen: boolean
  onSuccess: () => void
}

export function OnboardingModal({ userName, isOpen, onSuccess }: OnboardingModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdName.trim()) return
    setLoading(true)

    const res = await createHouseholdAction(householdName.trim())
    if (res.success) {
      toast.success('¡Hogar creado con éxito!')
      router.refresh() // <--- Refresca los componentes del servidor en el cliente
      onSuccess()
    } else {
      toast.error('Error al crear hogar', { description: res.error })
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setLoading(true)

    const res = await joinHouseholdAction(inviteCode.trim())
    if (res.success) {
      toast.success('¡Te has unido al hogar!')
      router.refresh() // <--- Refresca los componentes del servidor en el cliente
      onSuccess()
    } else {
      toast.error('Código inválido', { description: res.error })
      setLoading(false)
    }
  }

  const glass3dClass = "backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/80 dark:border-slate-700/60 shadow-2xl"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-3xl p-6 text-center ${glass3dClass}`}>
        
        <div className="flex justify-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={24} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          ¡Hola{userName ? `, ${userName}` : ''}! 👋
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">
          Bienvenido a Mi Despensa. Para comenzar a gestionar tu inventario, elige una opción:
        </p>

        {mode === 'select' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Home size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Crear un nuevo hogar</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Si eres la primera persona en registrar tu casa</p>
                </div>
              </div>
              <PlusCircle size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Unirme a un hogar</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Si alguien ya te compartió un código de invitación</p>
                </div>
              </div>
              <KeyRound size={18} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Nombre del Hogar
              </label>
              <input
                type="text"
                required
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ej. Casa Martínez, Depto 402..."
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-1/3 rounded-xl bg-gray-200 dark:bg-slate-800 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Crear e ingresar'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Código de Invitación
              </label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Ingresa el código único..."
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-1/3 rounded-xl bg-gray-200 dark:bg-slate-800 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Unirme'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}