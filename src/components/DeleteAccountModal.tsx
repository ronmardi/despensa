'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteUserAccountAction } from '@/app/actions/user'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleDelete = async () => {
    if (confirmText !== 'ELIMINAR') return

    setLoading(true)
    const res = await deleteUserAccountAction()

    if (res.success) {
      toast.success('Tu cuenta y datos han sido eliminados')
      window.location.href = '/login'
    } else {
      toast.error('Error al eliminar la cuenta', { description: res.error })
      setLoading(false)
    }
  }

  const glass3dClass = "backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-red-500/30 dark:border-red-500/30 shadow-2xl"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl p-6 text-center ${glass3dClass}`}>
        <div className="flex justify-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500">
            <AlertTriangle size={24} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Eliminar Cuenta
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          Esta acción es <strong className="text-red-500">irreversible</strong>. Se borrarán tus datos de acceso, tus listas e historial de la plataforma.
        </p>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Escribe "ELIMINAR" para confirmar
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-red-500/30 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 uppercase"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 rounded-xl bg-gray-200 dark:bg-slate-800 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || confirmText !== 'ELIMINAR'}
              className="w-1/2 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-red-500/30"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Borrar todo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}