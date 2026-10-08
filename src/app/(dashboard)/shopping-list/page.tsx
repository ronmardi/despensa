'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingCart, ArrowLeft, Share2, Check, Circle, Plus, Minus, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import { 
  completePurchasesAction, 
  addExtraItemAction, 
  toggleExtraItemAction, 
  deleteExtraItemAction 
} from './actions'
import { formatUnit } from '@/lib/utils/format'
import { getProductEmoji } from '@/lib/utils/emoji'

interface PantryItem {
  id: string
  name: string
  category: string
  current_quantity: number
  min_threshold: number
  ideal_quantity: number
  unit: string
  emoji?: string | null
}

interface ShoppingExtra {
  id: string
  name: string
  is_checked: boolean
}

export default function ShoppingListPage() {
  const supabase = createClient()
  const listRef = useRef<HTMLDivElement>(null)
  
  // Estados para Inventario
  const [items, setItems] = useState<PantryItem[]>([])
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({})
  
  // Estados para Ítems Manuales
  const [extras, setExtras] = useState<ShoppingExtra[]>([])
  const [newExtra, setNewExtra] = useState('')
  const [addingExtra, setAddingExtra] = useState(false)

  // Estados Generales
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [updating, setUpdating] = useState(false)

  const loadShoppingList = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: members } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)

    if (members && members.length > 0) {
      const hId = members[0].household_id

      // 1. Cargar inventario faltante
      const { data: pantryItems } = await supabase
        .from('items')
        .select('*')
        .eq('household_id', hId)

      if (pantryItems) {
        const itemsToBuy = pantryItems.filter(item => item.current_quantity <= item.min_threshold)
        setItems(itemsToBuy)

        const initialQuantities: Record<string, number> = {}
        itemsToBuy.forEach(item => {
          const deficit = item.ideal_quantity > item.current_quantity 
            ? item.ideal_quantity - item.current_quantity 
            : (item.min_threshold - item.current_quantity) + 1
            
          initialQuantities[item.id] = deficit > 0 ? deficit : 1
        })
        setBuyQuantities(initialQuantities)
      }

      // 2. Cargar ítems manuales extras
      const { data: extraItems } = await supabase
        .from('shopping_extras')
        .select('*')
        .eq('household_id', hId)
        .order('created_at', { ascending: true })

      if (extraItems) {
        setExtras(extraItems)
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    const initList = async () => {
      if (isMounted) {
        await loadShoppingList()
      }
    }

    initList()

    return () => {
      isMounted = false
    }
  }, [loadShoppingList])

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const cat = item.category || 'Otros'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {} as Record<string, PantryItem[]>)
  }, [items])

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  const handleBuyQuantityChange = (e: React.MouseEvent, id: string, delta: number) => {
    e.stopPropagation()
    setBuyQuantities((prev) => {
      const current = prev[id] || 1
      const next = Math.max(1, current + delta)
      return { ...prev, [id]: next }
    })
  }

  // --- Funciones para Ítems Manuales ---
  const handleAddExtra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExtra.trim()) return

    setAddingExtra(true)
    const res = await addExtraItemAction(newExtra)
    
    if (res.success) {
      setNewExtra('')
      loadShoppingList()
    } else {
      toast.error('Error al agregar el ítem extra', { description: res.error })
    }
    setAddingExtra(false)
  }

  const handleToggleExtra = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setExtras(prev => prev.map(ex => ex.id === id ? { ...ex, is_checked: newStatus } : ex))
    await toggleExtraItemAction(id, newStatus)
  }

  const handleDeleteExtra = async (id: string) => {
    setExtras(prev => prev.filter(ex => ex.id !== id))
    await deleteExtraItemAction(id)
  }

  const handleShareImage = async () => {
    if (!listRef.current || (items.length === 0 && extras.length === 0)) {
      toast.error('La lista está vacía')
      return
    }

    setSharing(true)
    toast.info('Generando tarjeta de lista...')

    try {
      const isDark = document.documentElement.classList.contains('dark')
      
      const dataUrl = await toPng(listRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: isDark ? '#020617' : '#f8fafc',
        style: {
          padding: '16px',
          borderRadius: '24px'
        }
      })
      
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'lista-de-compras.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi Lista de Compras',
          text: 'Lista de compras generada en Mi Despensa 🛒'
        })
        toast.success('Lista compartida con éxito')
      } else {
        const link = document.createElement('a')
        link.download = 'lista-de-compras.png'
        link.href = dataUrl
        link.click()
        toast.success('Imagen descargada')
      }
    } catch (_err) {
      toast.error('No se pudo generar la imagen')
    } finally {
      setSharing(false)
    }
  }

  const handleCompletePurchase = async () => {
    if (checkedItems.size === 0) return
    setUpdating(true)

    const purchasesToComplete = Array.from(checkedItems).map(id => {
      const item = items.find(i => i.id === id)
      return {
        id,
        name: item?.name || '',
        added_qty: buyQuantities[id] || 1
      }
    }).filter(p => p.name)

    const res = await completePurchasesAction(purchasesToComplete)

    if (res.success) {
      toast.success(`${purchasesToComplete.length} producto(s) agregados a la despensa`)
      setItems(prev => prev.filter(item => !checkedItems.has(item.id)))
      setCheckedItems(new Set())
    } else {
      toast.error(res.error || 'Hubo un error al actualizar los productos')
    }

    setUpdating(false)
  }

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className="mx-auto max-w-md p-4 pb-40">
      <header className="mb-6 mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href="/pantry" 
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0 ${glass3dClass}`}
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm truncate">Compras</h1>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {items.length + extras.length} elementos en total
            </p>
          </div>
        </div>

        <button
          onClick={handleShareImage}
          disabled={sharing || (items.length === 0 && extras.length === 0)}
          className={`flex h-10 px-3.5 items-center gap-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 ${glass3dClass}`}
          title="Compartir tarjeta visual"
        >
          {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          <span className="text-xs font-bold">Compartir</span>
        </button>
      </header>

      {/* Input Rápido para Compras Extras */}
      <form onSubmit={handleAddExtra} className="mb-6 relative flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-2xl">
        <div className="absolute left-3.5 text-gray-400">
          <Plus size={18} />
        </div>
        <input
          type="text"
          placeholder="Ej. Pilas, Bolsas de basura..."
          value={newExtra}
          onChange={(e) => setNewExtra(e.target.value)}
          className={`w-full h-12 pl-10 pr-12 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${glass3dClass}`}
          disabled={addingExtra}
        />
        <button
          type="submit"
          disabled={!newExtra.trim() || addingExtra}
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
        >
          {addingExtra ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 && extras.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center mt-6 ${glass3dClass}`}>
          <ShoppingCart className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Todo en orden</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Tu despensa tiene niveles óptimos y no hay extras pendientes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div ref={listRef} className="space-y-6 rounded-3xl pb-2">
            
            {/* Sección de Ítems Extras (Manuales) */}
            {extras.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 text-[11px] tracking-wider uppercase px-1">
                  <span className="h-px flex-1 bg-linear-to-r from-transparent via-indigo-300 dark:via-indigo-700 to-transparent"></span>
                  Extras (No Inventario)
                  <span className="h-px flex-1 bg-linear-to-r from-indigo-300 dark:from-indigo-700 via-indigo-300 dark:via-indigo-700 to-transparent"></span>
                </h2>
                
                <div className="space-y-2.5">
                  {extras.map((extra) => (
                    <div 
                      key={extra.id}
                      onClick={() => handleToggleExtra(extra.id, extra.is_checked)}
                      className={`group flex items-center justify-between gap-2 rounded-2xl p-4 transition-all duration-300 cursor-pointer ${glass3dClass} ${
                        extra.is_checked ? 'opacity-50 scale-[0.98]' : 'hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors shrink-0 ${
                          extra.is_checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'
                        }`}>
                          {extra.is_checked ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
                        </div>
                        
                        <div className={`min-w-0 flex-1 transition-all ${extra.is_checked ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          <h3 className="font-bold text-base truncate">{extra.name}</h3>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteExtra(extra.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-red-500/10 shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección de Reposición Inteligente (Despensa) */}
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="space-y-3">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 text-[11px] tracking-wider uppercase px-1">
                  <span className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></span>
                  {category}
                  <span className="h-px flex-1 bg-linear-to-r from-gray-300 dark:from-gray-700 via-gray-300 dark:via-gray-700 to-transparent"></span>
                </h2>

                <div className="space-y-2.5">
                  {categoryItems.map((item) => {
                    const isChecked = checkedItems.has(item.id)
                    const buyQty = buyQuantities[item.id] || 1

                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`group flex items-center justify-between gap-2 rounded-2xl p-4 transition-all duration-300 cursor-pointer ${glass3dClass} ${
                          isChecked ? 'opacity-50 scale-[0.98]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors shrink-0 ${
                            isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'
                          }`}>
                            {isChecked ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
                          </div>
                          
                          <div className={`min-w-0 flex-1 transition-all ${isChecked ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            <h3 className="font-bold flex items-center gap-2 text-base truncate">
                              <span className="text-xl filter drop-shadow-sm shrink-0">
                                {item.emoji || getProductEmoji(item.name, item.category)}
                              </span>
                              <span className="truncate">{item.name}</span>
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 rounded-xl bg-slate-200/50 dark:bg-slate-950/50 p-1 border border-black/5 dark:border-white/5 shadow-inner">
                            <button
                              onClick={(e) => handleBuyQuantityChange(e, item.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-xs hover:text-red-500 active:scale-90 transition-all cursor-pointer shrink-0"
                            >
                              <Minus size={13} />
                            </button>
                            
                            <div className="flex flex-col items-center justify-center min-w-10 px-1">
                              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                                +{buyQty}
                              </span>
                              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 lowercase tracking-wider truncate max-w-12">
                                {formatUnit(item.unit, buyQty)}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleBuyQuantityChange(e, item.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-xs hover:text-green-500 active:scale-90 transition-all cursor-pointer shrink-0"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && items.length < 4 && (
            <div className={`mt-8 p-6 text-center rounded-3xl opacity-80 ${glass3dClass}`}>
              <Sparkles className="mx-auto mb-2 text-amber-500" size={24} />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ¡Lista corta! Un viaje rápido a la tienda y estarás al 100%.
              </p>
            </div>
          )}
        </div>
      )}

      {checkedItems.size > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className={`p-4 rounded-3xl flex items-center justify-between gap-4 border-2 border-indigo-500/20 shadow-[0_20px_50px_rgba(79,70,229,0.2)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={16} className="text-indigo-500" />
                {checkedItems.size} {checkedItems.size === 1 ? 'seleccionado' : 'seleccionados'}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                Listo para enviar a la despensa
              </p>
            </div>

            <button
              onClick={handleCompletePurchase}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 shrink-0 cursor-pointer"
            >
              {updating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Check size={18} strokeWidth={3} />
                  Completar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}