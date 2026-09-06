'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Camera, Save, Loader2, Trash2, Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
import { FooterCredit } from '@/components/FooterCredit'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [userId, setUserId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [registeringPasskey, setRegisteringPasskey] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setAvatarUrl(profile.avatar_url || '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase])

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        setUploading(false)
        return
      }
      
      const file = event.target.files[0]

      if (file.size > 15 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. El tamaño máximo es 15MB.')
        setUploading(false)
        return
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Formato no válido. Solo se permiten imágenes JPG, PNG o WEBP.')
        setUploading(false)
        return
      }

      toast.info('Subiendo foto...')

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      toast.success('Foto subida con éxito')
      
    } catch (error: any) {
      toast.error('Error subiendo imagen', { description: error.message })
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: email, 
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      toast.success('¡Perfil actualizado con éxito!')
      router.refresh()
    } catch (error: any) {
      toast.error('Error guardando perfil', { description: error.message })
    } finally {
      setSaving(false)
    }
  }

  // Nueva función para Registrar Passkey
  const handleRegisterPasskey = async () => {
    try {
      setRegisteringPasskey(true)
      const { error } = await supabase.auth.registerPasskey()
      
      if (error) throw error
      toast.success('¡Autenticación biométrica activada con éxito!')
    } catch (error: any) {
      toast.error('No se pudo registrar la huella/FaceID', { description: error.message })
    } finally {
      setRegisteringPasskey(false)
    }
  }

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="mx-auto max-w-md p-4 pb-28 min-h-screen flex flex-col">
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
              Mi Perfil <User size={20} className="text-indigo-500" />
            </h1>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Ajustes de cuenta</p>
          </div>
        </div>
      </header>

      <div className={`space-y-6 rounded-3xl p-6 ${glass3dClass}`}>
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/80 dark:border-slate-700 shadow-lg bg-white/50 dark:bg-slate-800 flex items-center justify-center group">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <User size={40} className="text-gray-400" />
            )}
            
            <label className="absolute bottom-0 left-0 right-0 flex h-1/3 cursor-pointer items-center justify-center bg-black/50 text-white opacity-90 transition-all hover:bg-black/70 active:bg-black/80 backdrop-blur-xs">
              <Camera size={16} />
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={uploadAvatar} 
                disabled={uploading}
                className="hidden" 
              />
            </label>
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Toca la cámara para cambiar foto (Max 15MB)</p>
        </div>

        {/* Formulario */}
        <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              disabled 
              value={email}
              className="block w-full rounded-xl bg-slate-200/50 dark:bg-slate-950/50 border border-black/5 dark:border-white/5 px-4 py-3 text-gray-500 dark:text-gray-400 shadow-inner text-sm"
            />
            <p className="text-[10px] mt-1.5 text-gray-500 dark:text-gray-400">El correo electrónico no se puede modificar.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Nombre de Usuario
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Ronald Martinez"
              className="block w-full rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-black/10 dark:border-white/10 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all text-sm"
            />
          </div>
        </div>

        <button 
          onClick={saveProfile}
          disabled={saving || uploading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-3.5 font-bold text-white shadow-lg hover:shadow-xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer text-sm"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </button>

        {/* --- NUEVA SECCIÓN: PASSKEYS --- */}
        <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Fingerprint size={16} className="text-indigo-500" /> Seguridad
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Activa Passkeys para iniciar sesión rápido sin contraseña en tu dispositivo.</p>
          </div>
          <button 
            type="button"
            onClick={handleRegisterPasskey}
            disabled={registeringPasskey}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 px-4 py-3 font-bold text-gray-800 dark:text-gray-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all active:scale-[0.98] cursor-pointer text-sm"
          >
            {registeringPasskey ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint size={18} className="text-indigo-500" />}
            {registeringPasskey ? 'Registrando...' : 'Activar Huella / FaceID'}
          </button>
        </div>

        {/* Zona de Peligro: Eliminar Cuenta */}
        <div className="pt-6 border-t border-red-500/20">
          <button 
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all active:scale-[0.98] cursor-pointer text-xs"
          >
            <Trash2 size={16} />
            Eliminar mi cuenta y datos
          </button>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
      />

      <div className="mt-auto pt-8 pb-4">
        <FooterCredit />
      </div>
    </div>
  )
}