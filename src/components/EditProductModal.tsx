'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { editItemAction } from '@/app/(dashboard)/pantry/actions'

interface EditProductModalProps {
  item: {
    id: string
    name: string
    category: string
    unit: string
    min_threshold: number
  }
  onClose: () => void
  onSuccess: (updatedItem: any) => void
}

export function EditProductModal({ item, onClose, onSuccess }: EditProductModalProps) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [unit, setUnit] = useState(item.unit)
  const [minThreshold, setMinThreshold] = useState(item.min_threshold || 1)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await editItemAction(item.id, {
      name,
      category,
      unit,
      min_threshold: Number(minThreshold)
    })

    if (res.success) {
      toast.success('Producto actualizado')
      onSuccess({
        ...item,
        name,
        category,
        unit,
        min_threshold: Number(minThreshold)
      })
      onClose()
    } else {
      toast.error('Error al actualizar', { description: res.error })
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Editar producto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Nombre</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Categoría</label>
            <input 
              type="text" 
              required
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Unidad</label>
              <input 
                type="text" 
                required
                value={unit} 
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, unidades..."
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Umbral Mínimo</label>
              <input 
                type="number" 
                min="0"
                required
                value={minThreshold} 
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  )
}