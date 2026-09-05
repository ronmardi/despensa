'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Users, Copy, Check, QrCode, UserPlus, Loader2, Share2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'

interface Household {
  id: string
  name: string
  invite_code: string
}

export default function HouseholdPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [household, setHousehold] = useState<Household | null>(null)
  const [membersCount, setMembersCount] = useState<number>(1)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    async function loadHouseholdData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberData } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberData) {
        const { data: hh } = await supabase
          .from('households')
          .select('*')
          .eq('id', memberData.household_id)
          .single()

        if (hh) setHousehold(hh)

        // Consultar cantidad total de integrantes (con respaldo mínimo de 1)
        const { data: allMembers } = await supabase
          .from('household_members')
          .select('id')
          .eq('household_id', memberData.household_id)

        setMembersCount(allMembers && allMembers.length > 0 ? allMembers.length : 1)
      }
      setLoading(false)
    }

    loadHouseholdData()
  }, [supabase])

  const inviteUrl = household 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${household.invite_code}` 
    : ''

  // Copiar el enlace completo de invitación
  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Enlace de invitación copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  // Compartir enlace directamente vía WhatsApp o menú nativo del celular
  const handleShareLink = async () => {
    if (!inviteUrl || !household) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unirte a ${household.name}`,
          text: `¡Únete a mi hogar "${household.name}" en Mi Despensa para organizar el inventario juntos! 🏠`,
          url: inviteUrl,
        })
      } catch (_) {}
    } else {
      handleCopyLink()
    }
  }

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = joinCode.trim().toUpperCase()
    if (!cleanCode) return

    setJoining(true)
    
    const { data: hh } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', cleanCode)
      .maybeSingle()

    if (!hh) {
      toast.error('Código de hogar inválido')
      setJoining(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('household_members')
        .insert({ household_id: hh.id, user_id: user.id, role: 'member' })

      if (error) {
        toast.error('Error al unirse al hogar', { description: error.message })
      } else {
        toast.success('¡Te has unido al hogar con éxito!')
        window.location.reload()
      }
    }
    setJoining(false)
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">Mi Hogar</h1>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Gestión de miembros y accesos</p>
          </div>
        </div>

        <ThemeToggle />
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : household ? (
        <div className="space-y-5">
          {/* Tarjeta del Hogar */}
          <div className={`rounded-3xl p-6 text-center ${glass3dClass}`}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{household.name}</h2>
            <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {membersCount} {membersCount === 1 ? 'integrante activo' : 'integrantes activos'}
            </p>
          </div>

          {/* Opciones de Invitación */}
          <div className={`rounded-3xl p-5 space-y-4 ${glass3dClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Invitar integrantes</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Envía el enlace o muestra el código QR</p>
              </div>
              <button
                onClick={() => setShowQr(!showQr)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
                title="Mostrar Código QR"
              >
                <QrCode size={18} />
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-950 border border-black/5 dark:border-white/10">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`}
                  alt="Código QR del Hogar"
                  className="w-44 h-44 rounded-lg shadow-xs"
                />
                <p className="mt-3 text-[11px] font-medium text-gray-500 dark:text-gray-400">Escanea para unirte directamente</p>
              </div>
            )}

            {/* Visualización del Enlace Directo */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Enlace directo de invitación
              </label>
              <div className="rounded-xl bg-slate-200/50 dark:bg-slate-950/50 px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 truncate border border-black/5 dark:border-white/5">
                {inviteUrl}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleShareLink}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Share2 size={15} />
                Compartir por WhatsApp
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-black/10 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Unirse a otro hogar */}
          <div className={`rounded-3xl p-5 ${glass3dClass}`}>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">¿Tienes un código manual?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ingresa un código de 6 caracteres para unirte a otro hogar</p>
            
            <form onSubmit={handleJoinHousehold} className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. DCCFDC"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                disabled={joining}
                className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-4 py-2 text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {joining ? <Loader2 size={14} className="animate-spin" /> : 'Unirse'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className={`rounded-3xl p-8 text-center ${glass3dClass}`}>
          <UserPlus className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Sin hogar asignado</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-4">Ingresa un código de invitación para unirte a uno existente.</p>
          
          <form onSubmit={handleJoinHousehold} className="space-y-3">
            <input
              type="text"
              placeholder="Código de invitación (Ej: DCCFDC)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-sm font-mono text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="submit"
              disabled={joining}
              className="w-full rounded-xl bg-indigo-600 text-white font-bold py-3 text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : 'Unirse al Hogar'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}