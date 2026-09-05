'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Minus, Trash2, PackageSearch, Loader2, PlusCircle } from 'lucide-react'
import { updateItemQuantityAction, deleteItemAction } from './actions'

interface PantryItem {
  id: string
  name: string
  category: string
  current_quantity: number
  min_threshold: number
  ideal_quantity: number
  unit: string
}

export default function PantryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPantry() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const householdId = members[0].household_id
        
        const { data: pantryItems } = await supabase
          .from('items')
          .select('*')
          .eq('household_id', householdId)
          .order('name', { ascending: true })

        if (pantryItems) {
          setItems(pantryItems)
        }
      }
      setLoading(false)
    }

    loadPantry()
  }, [supabase])

  const handleUpdateQuantity = async (item: PantryItem, difference: number) => {
    const newQuantity = item.current_quantity + difference
    if (newQuantity < 0) return // Evitar números negativos

    // Actualización optimista (la UI reacciona instantáneamente)
    setItems((prev) => 
      prev.map(i => i.id === item.id ? { ...i, current_quantity: newQuantity } : i)
    )

    // Ejecuta la Server Action segura en segundo plano
    const res = await updateItemQuantityAction(item.id, newQuantity, item.name, difference)
    
    if (!res.success) {
      alert('Error al actualizar: ' + res.error)
      // Revierte visualmente si el servidor falla
      setItems((prev) => 
        prev.map(i => i.id === item.id ? { ...i, current_quantity: item.current_quantity } : i)
      )
    }
  }

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${itemName}" de tu despensa?`)) return

    // Eliminación optimista
    const previousItems = [...items]
    setItems((prev) => prev.filter(i => i.id !== itemId))

    const res = await deleteItemAction(itemId, itemName)
    
    if (!res.success) {
      alert('Error al eliminar: ' + res.error)
      setItems(previousItems) // Revierte visualmente si el servidor falla
    }
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-6 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
            Despensa <PackageSearch size={22} className="text-indigo-500 dark:text-indigo-400"/>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Inventario actual de tu hogar</p>
        </div>
        
        <Link 
          href="/add-product" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 transition-colors active:scale-95"
        >
          <PlusCircle size={24} />
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <PackageSearch className="mx-auto mb-3 text-gray-400" size={48} />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Despensa vacía</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Comienza a agregar productos a tu inventario.</p>
          <Link 
            href="/add-product"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            Agregar producto
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isLowStock = item.current_quantity <= item.min_threshold

            return (
              <div 
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {item.name}
                      {isLowStock && (
                        <span className="flex h-2 w-2 rounded-full bg-red-500" title="Bajo stock"></span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Categoría: {item.category}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className={isLowStock ? 'text-red-500 font-bold' : ''}>
                      {item.current_quantity}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/80 dark:border-slate-700/50 p-1 shadow-sm">
                    <button
                      onClick={() => handleUpdateQuantity(item, -1)}
                      disabled={item.current_quantity <= 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 active:scale-90 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleUpdateQuantity(item, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-300 active:scale-90 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                {isLowStock && (
                  <div className="text-[10px] text-red-500/80 mt-1">
                    Sugerido comprar: {item.ideal_quantity - item.current_quantity} {item.unit}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}