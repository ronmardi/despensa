'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, CheckCircle2, Circle, PartyPopper, Plus, Minus } from 'lucide-react'

interface ShoppingItem {
  id: string
  name: string
  category: string
  current_quantity: number
  min_threshold: number
  ideal_quantity: number
  unit: string
}

export default function ShoppingListPage() {
  const supabase = createClient()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  // Guardamos la cantidad comprada editable por cada producto
  const [boughtQuantities, setBoughtQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    async function loadShoppingList() {
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
          const needsRestock = pantryItems.filter(
            (item) => item.current_quantity <= item.min_threshold
          )
          setItems(needsRestock)

          // Calcula automáticamente la cantidad sugerida a comprar: (Ideal - Actual)
          const initialQuantities: Record<string, number> = {}
          needsRestock.forEach((item) => {
            const diff = item.ideal_quantity - item.current_quantity
            initialQuantities[item.id] = diff > 0 ? diff : 1
          })
          setBoughtQuantities(initialQuantities)
        }
      }
      setLoading(false)
    }

    loadShoppingList()
  }, [supabase])

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  // Modifica la cantidad comprada sin activar el toggle de la tarjeta
  const handleQuantityChange = (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setBoughtQuantities((prev) => {
      const current = prev[id] || 1
      const updated = Math.max(1, current + delta)
      return { ...prev, [id]: updated }
    })
  }

  const handleCompletePurchase = async () => {
    if (selectedItems.size === 0) return
    setPurchasing(true)

    // Suma exactamente la cantidad que el usuario especificó
    const updates = Array.from(selectedItems).map(async (id) => {
      const item = items.find((i) => i.id === id)
      if (!item) return
      
      const qtyToAdd = boughtQuantities[id] || 1
      const newQty = item.current_quantity + qtyToAdd

      await supabase
        .from('items')
        .update({ current_quantity: newQty })
        .eq('id', id)
    })

    await Promise.all(updates)

    // Elimina de la lista de compras los items reabastecidos
    setItems((prev) => prev.filter((item) => !selectedItems.has(item.id)))
    setSelectedItems(new Set())
    setPurchasing(false)
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      {/* Encabezado */}
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 backdrop-blur-md border border-white/60 p-2 text-gray-700 shadow-sm transition-all hover:bg-white/80">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm flex items-center gap-2">
            Lista de Compras <ShoppingCart size={22} className="text-indigo-500"/>
          </h1>
          <p className="text-sm text-gray-600">Ajusta lo que realmente compraste</p>
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
          <PartyPopper className="mx-auto mb-3 text-emerald-400" size={48} />
          <h2 className="text-lg font-semibold text-gray-800">¡Surtido completo!</h2>
          <p className="mt-1 text-sm text-gray-600">No hay productos que requieran reposición por ahora.</p>
        </div>
      ) : (
        /* Lista de Productos */
        <div className="space-y-3">
          {items.map((item) => {
            const isSelected = selectedItems.has(item.id)
            const qtyToBuy = boughtQuantities[item.id] || 1

            return (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex cursor-pointer items-center justify-between rounded-2xl backdrop-blur-lg border p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)] transition-all ${
                  isSelected 
                    ? 'bg-indigo-500/10 border-indigo-300/80' 
                    : 'bg-white/40 border-white/60 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={isSelected ? 'text-indigo-600' : 'text-gray-400'}>
                    {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <div>
                    <h3 className={`font-semibold transition-colors ${isSelected ? 'text-indigo-900 line-through opacity-70' : 'text-gray-900'}`}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Actual: {item.current_quantity} {item.unit}
                    </p>
                  </div>
                </div>

                {/* Contador de Cantidad Comprada */}
                <div className="flex items-center gap-1.5 rounded-xl bg-white/70 border border-white/80 p-1 shadow-sm">
                  <button
                    onClick={(e) => handleQuantityChange(item.id, -1, e)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-700 shadow-xs hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  
                  <span className="min-w-[2rem] text-center text-xs font-bold text-gray-800">
                    +{qtyToBuy}
                  </span>

                  <button
                    onClick={(e) => handleQuantityChange(item.id, 1, e)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-700 shadow-xs hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botón Flotante para Finalizar Compra */}
      {items.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 mx-auto max-w-md px-4">
          <button 
            onClick={handleCompletePurchase}
            disabled={purchasing || selectedItems.size === 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-4 font-semibold text-white shadow-xl hover:shadow-2xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:scale-100 transition-all active:scale-[0.98]"
          >
            {purchasing ? 'Actualizando despensa...' : `Sumar comprados (${selectedItems.size})`}
          </button>
        </div>
      )}
    </div>
  )
}