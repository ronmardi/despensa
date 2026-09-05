'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Camera, Save, Loader2 } from 'lucide-react'

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
      if (!event.target.files || event.target.files.length === 0) return
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Subir imagen al bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      alert('¡Perfil actualizado con éxito!')
      router.refresh()
    } catch (error: any) {
      alert('Error guardando perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 p-2 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-white/80 active:scale-95">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
            Mi Perfil <User size={22} className="text-indigo-500" />
          </h1>
        </div>
      </header>

      <div className="space-y-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/80 dark:border-slate-700 shadow-lg bg-white/50 dark:bg-slate-800 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User size={40} className="text-gray-400" />
            )}
            
            <label className="absolute bottom-0 left-0 right-0 flex h-1/3 cursor-pointer items-center justify-center bg-black/40 text-white transition-all hover:bg-black/60">
              <Camera size={16} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading}
                className="hidden" 
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Toca la cámara para cambiar foto</p>
        </div>

        {/* Formulario */}
        <div className="space-y-4 pt-4 border-t border-white/60 dark:border-slate-700/60">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Correo Electrónico</label>
            <input 
              type="email" 
              disabled 
              value={email}
              className="mt-1 block w-full rounded-xl bg-gray-100/50 dark:bg-slate-900/50 border border-white/40 dark:border-slate-700/40 px-4 py-3 text-gray-500 dark:text-gray-400 shadow-inner"
            />
            <p className="text-[10px] mt-1 text-gray-500">El correo no se puede cambiar.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Nombre de Usuario</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Ronald Martinez"
              className="mt-1 block w-full rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 px-4 py-3 text-gray-900 dark:text-white focus:bg-white/80 dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
            />
          </div>
        </div>

        <button 
          onClick={saveProfile}
          disabled={saving || uploading}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-4 font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={20} />}
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </button>

      </div>
    </div>
  )
}