'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Users, Copy, Check, QrCode, UserPlus, Loader2, Share2, Pencil, X, User, Shield, UserMinus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Household {
  id: string
  name: string
  invite_code: string
}

interface MemberProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  role?: string
}

interface DialogState {
  isOpen: boolean
  title: string
  description: string
  actionLabel: string
  isDestructive: boolean
  actionFn: () => Promise<void> | void
}

export default function HouseholdPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<MemberProfile[]>([])
  
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const [isEditingName, setIsEditingName] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [updatingName, setUpdatingName] = useState(false)

  // Estado para el Modal de Confirmación Personalizado
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    isDestructive: false,
    actionFn: () => {}
  })

  const loadHouseholdData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    const { data: memberData } = await supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberData) {
      const hId = memberData.household_id
      setCurrentUserRole(memberData.role || 'member')

      const { data: hh } = await supabase
        .from('households')
        .select('*')
        .eq('id', hId)
        .single()

      if (hh) {
        setHousehold({
          id: hh.id,
          name: hh.name,
          invite_code: hh.code || hh.invite_code || '',
        })
        setNewHouseholdName(hh.name)
      }

      const { data: allMembers } = await supabase
        .from('household_members')
        .select('user_id, role')
        .eq('household_id', hId)

      if (allMembers && allMembers.length > 0) {
        const userIds = allMembers.map((m) => m.user_id)

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds)

        if (profilesData) {
          const merged = profilesData.map((profile) => {
            const mInfo = allMembers.find((m) => m.user_id === profile.id)
            return {
              ...profile,
              role: mInfo?.role || 'member',
            }
          })

          merged.sort((a, b) => {
            if (a.role === 'admin' || a.role === 'owner') return -1
            if (b.role === 'admin' || b.role === 'owner') return 1
            return 0
          })

          setMembers(merged)
        }
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadHouseholdData()
  }, [loadHouseholdData])

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner'
  const inviteUrl = household 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${household.invite_code}` 
    : ''

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Confirmación para Renovar Código
  const confirmRegenerateCode = () => {
    if (!household || !isAdmin) return
    setDialog({
      isOpen: true,
      title: 'Renovar código',
      description: 'Si cambias el código, los enlaces y códigos anteriores dejarán de funcionar. ¿Estás seguro?',
      actionLabel: 'Sí, renovar',
      isDestructive: true,
      actionFn: async () => {
        setRegenerating(true)
        const newCode = generateRandomCode()

        const { error } = await supabase
          .from('households')
          .update({ code: newCode }) // Apuntamos a 'code' que es la columna estándar
          .eq('id', household.id)

        if (error) {
          toast.error('Error al generar nuevo código')
        } else {
          setHousehold({ ...household, invite_code: newCode })
          toast.success('Código de invitación renovado')
        }
        setRegenerating(false)
        setDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Confirmación para Expulsar
  const confirmKickMember = (userId: string, userName: string) => {
    if (!household || !isAdmin || userId === currentUserId) return
    setDialog({
      isOpen: true,
      title: 'Expulsar integrante',
      description: `¿Seguro que deseas expulsar a ${userName} de la despensa? Perderá el acceso inmediatamente.`,
      actionLabel: 'Expulsar',
      isDestructive: true,
      actionFn: async () => {
        const { error } = await supabase
          .from('household_members')
          .delete()
          .eq('user_id', userId)
          .eq('household_id', household.id)

        if (error) toast.error('Error al expulsar usuario')
        else {
          toast.success(`${userName} ha sido expulsado`)
          loadHouseholdData()
        }
        setDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Confirmación para Cambiar Rol
  const confirmChangeRole = (userId: string, userName: string, currentRole: string) => {
    if (!household || !isAdmin) return
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const roleText = newRole === 'admin' ? 'Administrador' : 'Miembro'
    
    setDialog({
      isOpen: true,
      title: 'Cambiar rol',
      description: `¿Deseas otorgarle el rol de ${roleText} a ${userName}?`,
      actionLabel: 'Sí, cambiar',
      isDestructive: false,
      actionFn: async () => {
        const { error } = await supabase
          .from('household_members')
          .update({ role: newRole })
          .eq('user_id', userId)
          .eq('household_id', household.id)

        if (error) toast.error('Error al cambiar rol')
        else {
          toast.success(`Rol de ${userName} actualizado`)
          loadHouseholdData()
        }
        setDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!household || !newHouseholdName.trim()) return

    setUpdatingName(true)
    const trimmed = newHouseholdName.trim()

    const { data, error } = await supabase
      .from('households')
      .update({ name: trimmed })
      .eq('id', household.id)
      .select()

    if (error || !data || data.length === 0) {
      toast.error('Error al cambiar el nombre')
    } else {
      setHousehold({ ...household, name: trimmed })
      setIsEditingName(false)
      toast.success('Nombre del hogar actualizado')
    }
    setUpdatingName(false)
  }

  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    toast.success('Enlace de invitación copiado')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = () => {
    if (!household) return
    navigator.clipboard.writeText(household.invite_code)
    setCopiedCode(true)
    toast.success('Código de invitación copiado')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleShareLink = async () => {
    if (!inviteUrl || !household) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unirte a ${household.name}`,
          text: `¡Únete a "${household.name}" en la app Mi Despensa para organizar el inventario juntos! 🏠`,
          url: inviteUrl,
        })
      } catch (_) {}
    } else {
      const message = `¡Únete a mi hogar "${household.name}" en Mi Despensa!\n\nCódigo: *${household.invite_code}*\nO ingresa aquí: ${inviteUrl}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
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
      .or(`invite_code.eq.${cleanCode},code.eq.${cleanCode}`)
      .maybeSingle()

    if (!hh) {
      toast.error('Código de hogar inválido')
      setJoining(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('household_members').delete().eq('user_id', user.id)
      const { error } = await supabase
        .from('household_members')
        .insert({ household_id: hh.id, user_id: user.id, role: 'member' })

      if (error) {
        toast.error('Error al unirse al hogar', { description: error.message })
      } else {
        toast.success('¡Te has unido al hogar con éxito!')
        setJoinCode('')
        loadHouseholdData()
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

            {isEditingName && isAdmin ? (
              <form onSubmit={handleUpdateName} className="flex items-center justify-center gap-2 mt-2 mb-1">
                <input
                  type="text"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  className="rounded-xl bg-white/80 dark:bg-slate-950/80 border border-indigo-500/50 px-3 py-1.5 text-center text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Ej. Casa Martínez"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={updatingName}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer active:scale-95"
                >
                  {updatingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false)
                    setNewHouseholdName(household.name)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 cursor-pointer active:scale-95"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{household.name}</h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            )}

            <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {members.length} {members.length === 1 ? 'integrante activo' : 'integrantes activos'}
            </p>
          </div>

          {/* Lista de Integrantes (Con cambio de Rol) */}
          <div className={`rounded-3xl p-5 space-y-3 ${glass3dClass}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Integrantes del hogar
            </h3>

            <div className="space-y-2.5">
              {members.map((member) => {
                const isMe = member.id === currentUserId
                const displayName = member.full_name || member.email?.split('@')[0] || 'Usuario'
                const isMemberAdmin = member.role === 'admin' || member.role === 'owner'
                const canKick = isAdmin && !isMe

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-black/5 dark:border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isAdmin && !isMe ? (
                            <button
                              onClick={() => confirmChangeRole(member.id, displayName, member.role || 'member')}
                              className={`flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border cursor-pointer hover:opacity-80 transition-opacity ${
                                isMemberAdmin 
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 border-black/5 dark:border-white/5'
                              }`}
                              title="Cambiar rol"
                            >
                              {isMemberAdmin && <Shield size={9} />}
                              {isMemberAdmin ? 'Admin' : 'Miembro'}
                              <RefreshCw size={8} className="ml-0.5 opacity-50" />
                            </button>
                          ) : (
                            <span className={`flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                              isMemberAdmin 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                                : 'bg-slate-200/50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 border-black/5 dark:border-white/5'
                            }`}>
                              {isMemberAdmin && <Shield size={9} />}
                              {isMemberAdmin ? 'Admin' : 'Miembro'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canKick && (
                        <button
                          onClick={() => confirmKickMember(member.id, displayName)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                          title={`Expulsar a ${displayName}`}
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                      
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          Tú
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Opciones de Invitación */}
          <div className={`rounded-3xl p-5 space-y-4 ${glass3dClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Invitar integrantes</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Envía el enlace, código o muestra el QR</p>
              </div>
              <button
                onClick={() => setShowQr(!showQr)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
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

            {/* Código de Invitación Texto */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tu código de invitación
                </label>
                {isAdmin && (
                  <button
                    onClick={confirmRegenerateCode}
                    disabled={regenerating}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
                    Renovar código
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-slate-200/50 dark:bg-slate-950/50 px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 border border-black/5 dark:border-white/5">
                  {household.invite_code}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {copiedCode ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  {copiedCode ? 'Copiado' : 'Código'}
                </button>
              </div>
            </div>

            {/* Enlace Directo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Enlace directo de invitación
              </label>
              <div className="rounded-xl bg-slate-200/50 dark:bg-slate-950/50 px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 truncate border border-black/5 dark:border-white/5">
                {inviteUrl}
              </div>
            </div>

            {/* Botones de Compartir y Copiar Enlace */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleShareLink}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Share2 size={15} />
                Compartir
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-black/10 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {copiedLink ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                {copiedLink ? 'Copiado' : 'Enlace'}
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
                placeholder="Ej. X8K9P2"
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
              placeholder="Código de invitación (Ej: X8K9P2)"
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

      {/* Modal de Confirmación Global */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10 ${glass3dClass}`}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{dialog.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{dialog.description}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-slate-300/60 dark:hover:bg-slate-700/60 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={dialog.actionFn}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer ${
                  dialog.isDestructive
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                }`}
              >
                {dialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}