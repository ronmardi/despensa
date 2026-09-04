'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Minus, Package, AlertTriangle, Trash2, ShoppingCart, Users } from 'lucide-react'

interface PantryItem {
  id: string
  name: string
  category: string
  current_quantity: number
  min_threshold: number
  unit: string
}

export default function PantryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPantryItems() {
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

        if (pantryItems) setItems(pantryItems)
      }
      setLoading(false)
    }

    loadPantryItems()
  }, [supabase])

  const handleQuantityChange = async (id: string, delta: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.current_quantity + delta)
          return { ...item, current_quantity: newQty }
        }
        return item
      })
    )

    const currentItem = items.find((i) => i.id === id)
    if (!currentItem) return

    const newQuantity = Math.max(0, currentItem.current_quantity + delta)

    await supabase
      .from('items')
      .update({ current_quantity: newQuantity })
      .eq('id', id)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return

    setItems((prev) => prev.filter((item) => item.id !== id))
    await supabase.from('items').delete().eq('id', id)
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      {/* Encabezado con Botones de Navegación */}
      <header className="mb-6 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Mi Despensa</h1>
          <p className="text-sm text-gray-600">Inventario interactivo</p>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/household" 
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-gray-700 shadow-sm transition-all hover:bg-white/80 active:scale-95"
            title="Gestión del Hogar"
          >
            <Users size={20} />
          </Link>
          <Link 
            href="/shopping-list" 
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-indigo-600 shadow-sm transition-all hover:bg-white/80 active:scale-95"
            title="Lista de Compras"
          >
            <ShoppingCart size={20} />
          </Link>
        </div>
      </header>

      {/* Estado de Carga */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        /* Estado Vacío */
        <div className="rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <Package className="mx-auto mb-3 text-indigo-400" size={48} />
          <h2 className="text-lg font-semibold text-gray-800">Tu despensa está vacía</h2>
          <p className="mt-1 text-sm text-gray-600">Presiona el botón + para registrar tu primer producto.</p>
        </div>
      ) : (
        /* Tarjetas de Productos (Liquid Glass) */
        <div className="space-y-3">
          {items.map((item) => {
            const isLowStock = item.current_quantity <= item.min_threshold

            return (
              <div 
                key={item.id}
                className={`flex items-center justify-between rounded-2xl bg-white/40 backdrop-blur-lg border p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)] transition-all ${
                  isLowStock ? 'border-amber-300/80 bg-amber-500/5' : 'border-white/60'
                }`}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {isLowStock && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-500/20">
                        <AlertTriangle size={12} /> Reponer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                </div>

                {/* Controles de Cantidad (+ / -) */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/60 border border-white/80 p-1 shadow-inner">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-gray-700 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 active:scale-90"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span className="min-w-[2.5rem] text-center text-sm font-bold text-gray-800">
                      {item.current_quantity} <span className="text-[10px] font-normal text-gray-500">{item.unit}</span>
                    </span>

                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-gray-700 shadow-sm transition-all hover:bg-green-50 hover:text-green-600 active:scale-90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Botón Eliminar */}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botón Flotante para Agregar (+) */}
      <Link 
        href="/pantry/add"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={28} />
      </Link>
    </div>
  )
}