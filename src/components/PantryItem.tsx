'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Recibimos los datos del producto como "item"
export default function PantryItem({ item }: { item: any }) {
  const supabase = createClient()
  
  // Usamos el estado local para que el número cambie instantáneamente en pantalla
  const [quantity, setQuantity] = useState(item.current_quantity)
  const [loading, setLoading] = useState(false)

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 0) return // Evitamos cantidades negativas
    
    setQuantity(newQuantity) // Actualización visual instantánea
    setLoading(true)

    // Actualizamos en la base de datos en segundo plano
    const { error } = await supabase
      .from('items')
      .update({ current_quantity: newQuantity })
      .eq('id', item.id)

    if (error) {
      console.error(error)
      setQuantity(item.current_quantity) // Si falla, regresamos al número anterior
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div>
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <p className="text-sm text-gray-500">
          {quantity} {item.unit}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => updateQuantity(quantity - 1)}
          disabled={loading || quantity <= 0}
          className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          <Minus size={18} />
        </button>
        
        <span className="w-6 text-center font-medium text-gray-900">{quantity}</span>
        
        <button 
          onClick={() => updateQuantity(quantity + 1)}
          disabled={loading}
          className="rounded-full bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200 disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}