'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Plus, Package } from 'lucide-react'
import { toast } from 'sonner'

interface AddProductModalProps {
  householdId: string
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  'Despensa',
  'Lácteos y Huevos',
  'Frutas y Verduras',
  'Carnes y Pescados',
  'Bebidas',
  'Limpieza',
  'Aseo Personal',
  'Mascotas',
  'Otros'
]

const UNITS = [
  { value: 'uds', label: 'Unidades (uds)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'gr', label: 'Gramos (gr)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'bot', label: 'Botellas (bot)' },
  { value: 'caja', label: 'Cajas' },
  { value: 'paq', label: 'Paquetes (paq)' },
]

export function AddProductModal({ householdId, onClose, onSuccess }: AddProductModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Despensa')
  const [currentQuantity, setCurrentQuantity] = useState('1')
  const [minThreshold, setMinThreshold] = useState('1')
  const [unit, setUnit] = useState('uds')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Ingresa el nombre del producto')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('items')
      .insert({
        household_id: householdId,
        name: name.trim(),
        category,
        current_quantity: parseFloat(currentQuantity) || 0,
        min_threshold: parseFloat(minThreshold) || 0,
        unit,
        last_updated_by: user?.id || null
      })

    if (error) {
      toast.error('Error al agregar el producto', { description: error.message })
    } else {
      toast.success(`"${name.trim()}" agregado a la despensa`)
      onSuccess()
    }

    setLoading(false)
  }

  const glass3dClass = "backdrop-blur-md bg-white/90 dark:bg-slate-900/95 border border-white/80 dark:border-slate-700/60 shadow-2xl"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-3xl p-6 ${glass3dClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Agregar producto</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Registra un nuevo ítem en tu despensa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Nombre del producto
            </label>
            <input
              type="text"
              placeholder="Ej. Leche entera, Arroz..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-black/5 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-black/5 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Cantidad inicial
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-black/5 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Unidad
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-black/5 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Mínimo deseado (Alerta reponer)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-black/5 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 py-3 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-slate-300/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}