'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { addProductAction } from './actions'

export default function AddProductPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Despensa')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('unidades')
  const [minThreshold, setMinThreshold] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await addProductAction({
      name,
      category,
      quantity,
      unit,
      minThreshold
    })

    if (result.success) {
      router.push('/pantry')
      router.refresh()
    } else {
      alert("Error: " + result.error)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link href="/pantry" className="rounded-full bg-white/50 backdrop-blur-md border border-white/60 p-2 text-gray-700 shadow-sm transition-all hover:bg-white/80">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Nuevo Producto</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        <div>
          <label className="block text-sm font-medium text-gray-800">Nombre del producto</label>
          <input 
            type="text" 
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            suppressHydrationWarning
            className="mt-1 block w-full rounded-xl bg-white/50 border border-white/40 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            placeholder="Ej: Arroz, Leche, Jabón"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800">Cantidad</label>
            <input 
              type="number" 
              required 
              min="0"
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))}
              suppressHydrationWarning
              className="mt-1 block w-full rounded-xl bg-white/50 border border-white/40 px-4 py-3 text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800">Unidad</label>
            <select 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              suppressHydrationWarning
              className="mt-1 block w-full rounded-xl bg-white/50 border border-white/40 px-4 py-3 text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all appearance-none"
            >
              <option value="unidades">Unidades</option>
              <option value="litros">Litros</option>
              <option value="kg">Kilos</option>
              <option value="gramos">Gramos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">Avisar al llegar a:</label>
          <input 
            type="number" 
            required 
            min="0"
            value={minThreshold} 
            onChange={(e) => setMinThreshold(Number(e.target.value))}
            suppressHydrationWarning
            className="mt-1 block w-full rounded-xl bg-white/50 border border-white/40 px-4 py-3 text-gray-900 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3.5 font-semibold text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? 'Guardando...' : 'Guardar en despensa'}
        </button>
      </form>
    </div>
  )
}