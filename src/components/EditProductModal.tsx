'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { getProductEmoji } from '@/lib/utils/emoji'
import { editItemAction } from '@/app/(dashboard)/pantry/actions'
import { CATEGORIES, LOCATIONS, UNITS } from '@/lib/constants'

interface EditProductModalProps {
  item: {
    id: string
    name: string
    category: string
    location?: string
    unit: string
    min_threshold: number
    emoji?: string | null
  }
  onClose: () => void
  onSuccess: (updatedItem: any) => void
}

export function EditProductModal({ item, onClose, onSuccess }: EditProductModalProps) {
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category || CATEGORIES[0])
  const [location, setLocation] = useState(item.location || LOCATIONS[0])
  const [unit, setUnit] = useState(item.unit || UNITS[0].value)
  const [minThreshold, setMinThreshold] = useState(item.min_threshold || 1)
  
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(item.emoji || null)
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const displayEmoji = selectedEmoji || getProductEmoji(name, category)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre del producto es obligatorio')
      return
    }

    setLoading(true)

    const res = await editItemAction(item.id, {
      name: name.trim(),
      category,
      location,
      unit,
      min_threshold: Number(minThreshold),
      emoji: selectedEmoji 
    })

    if (res.success) {
      toast.success('Producto actualizado')
      onSuccess({
        ...item,
        name: name.trim(),
        category,
        location,
        unit,
        min_threshold: Number(minThreshold),
        emoji: selectedEmoji
      })
      onClose()
    } else {
      toast.error('Error al actualizar', { description: res.error })
    }
    setLoading(false)
  }

  const modalGlassClass = "backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/80 dark:border-slate-700/60 shadow-2xl"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4">
      <div className={`w-full max-w-sm rounded-3xl p-6 ${modalGlassClass}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Editar producto</h2>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Nombre
            </label>
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 text-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-inner"
                title="Elegir emoji manualmente"
              >
                {displayEmoji}
              </button>

              <input 
                type="text" 
                required
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="h-10.5 flex-1 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all"
              />

              {showPicker && (
                <div className="absolute top-12 left-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="fixed inset-0" onClick={() => setShowPicker(false)} />
                  <div className="relative shadow-2xl rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                    <EmojiPicker
                      onEmojiClick={(emojiData: EmojiClickData) => {
                        setSelectedEmoji(emojiData.emoji)
                        setShowPicker(false)
                      }}
                      theme={Theme.AUTO}
                      searchPlaceHolder="Buscar..."
                      width={280}
                      height={350}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Ubicación
              </label>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Unidad
              </label>
              <select 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Umbral Mínimo
              </label>
              <input 
                type="number" 
                min="0"
                required
                value={minThreshold} 
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  )
}