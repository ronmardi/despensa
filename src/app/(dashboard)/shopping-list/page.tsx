'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingCart, ArrowLeft, Share2, Check, Circle, Plus, Minus, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import { updateItemQuantityAction } from '../pantry/actions'
import { formatUnit } from '@/lib/utils/format'
import { getProductEmoji } from '@/lib/utils/emoji' // <-- Importamos tu motor inteligente

interface PantryItem {
  id: string
  name: string
  category: string
  current_quantity: number
  min_threshold: number
  ideal_quantity: number
  unit: string
  emoji?: string | null // <-- Soporte para emoji personalizado
}

export default function ShoppingListPage() {
  const supabase = createClient()
  const listRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadShoppingList() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const hId = members[0].household_id

        const { data: pantryItems } = await supabase
          .from('items')
          .select('*')
          .eq('household_id', hId)

        if (pantryItems) {
          const itemsToBuy = pantryItems.filter(item => item.current_quantity <= item.min_threshold)
          setItems(itemsToBuy)

          const initialQuantities: Record<string, number> = {}
          itemsToBuy.forEach(item => {
            // Por defecto, sugerir comprar para alcanzar al menos el umbral + 1
            const deficit = (item.min_threshold - item.current_quantity) + 1
            initialQuantities[item.id] = deficit > 0 ? deficit : 1
          })
          setBuyQuantities(initialQuantities)
        }
      }
      setLoading(false)
    }

    loadShoppingList()
  }, [supabase])

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

  const handleShareImage = async () => {
    if (!listRef.current || items.length === 0) {
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
    } catch (err: any) {
      toast.error('No se pudo generar la imagen')
    } finally {
      setSharing(false)
    }
  }

  const handleCompletePurchase = async () => {
    if (checkedItems.size === 0) return
    setUpdating(true)

    let successCount = 0
    let failCount = 0

    // Procesar las actualizaciones en lote
    for (const id of Array.from(checkedItems)) {
      const item = items.find(i => i.id === id)
      if (!item) continue

      const addAmount = buyQuantities[id] || 1

      // ¡CORREGIDO! Pasamos 3 argumentos a la acción de base de datos
      const res = await updateItemQuantityAction(id, item.name, addAmount)
      if (res.success) {
        successCount++
      } else {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} producto(s) agregados a la despensa`)
      // Remover los items procesados de la vista actual
      setItems(prev => prev.filter(item => !checkedItems.has(item.id)))
      setCheckedItems(new Set())
    }

    if (failCount > 0) {
      toast.error(`Hubo un error al actualizar ${failCount} producto(s)`)
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
              {items.length} {items.length === 1 ? 'producto' : 'productos'} por reponer
            </p>
          </div>
        </div>

        <button
          onClick={handleShareImage}
          disabled={sharing || items.length === 0}
          className={`flex h-10 px-3.5 items-center gap-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 ${glass3dClass}`}
          title="Compartir tarjeta visual"
        >
          {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          <span className="text-xs font-bold">Compartir</span>
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center mt-12 ${glass3dClass}`}>
          <ShoppingCart className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Todo en orden</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Tu despensa tiene niveles óptimos. No hay nada que comprar por ahora.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div ref={listRef} className="space-y-6 rounded-3xl pb-2">
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
                              {/* USANDO EL EMOJI PERSONALIZADO O INTELIGENTE AQUÍ */}
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

          {/* Tip motivacional cuando hay menos de 4 ítems */}
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

      {/* Barra Sticky Flotante - Aparece al marcar un ítem */}
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