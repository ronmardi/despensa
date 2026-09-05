'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PackagePlus, Loader2 } from 'lucide-react'
import { addProductAction } from './actions'
import { toast } from 'sonner'

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
    if (!name.trim()) {
      toast.error('El nombre del producto es obligatorio')
      return
    }

    setLoading(true)

    const result = await addProductAction({
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit,
      minThreshold: Number(minThreshold)
    })

    if (result.success) {
      toast.success('Producto guardado en la despensa')
      router.push('/pantry')
      router.refresh()
    } else {
      toast.error('Error al guardar', { description: result.error })
      setLoading(false)
    }
  }

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      {/* Encabezado */}
      <header className="mb-6 mt-4 flex items-center gap-3">
        <Link 
          href="/pantry" 
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95 ${glass3dClass}`}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
            Nuevo Producto <PackagePlus size={22} className="text-indigo-500 dark:text-indigo-400" />
          </h1>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Agrega un ítem a la despensa</p>
        </div>
      </header>

      {/* Formulario Liquid Glass */}
      <form onSubmit={handleSubmit} className={`space-y-4 rounded-3xl p-6 ${glass3dClass}`}>
        
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Nombre del producto
          </label>
          <input 
            type="text" 
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all"
            placeholder="Ej: Arroz, Leche, Jabón..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Categoría
          </label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer"
          >
            <option value="Despensa" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Despensa</option>
            <option value="Lácteos" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Lácteos</option>
            <option value="Carnes" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Carnes</option>
            <option value="Frutas y Verduras" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Frutas y Verduras</option>
            <option value="Limpieza" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Limpieza</option>
            <option value="Aseo Personal" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Aseo Personal</option>
            <option value="Bebidas" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Bebidas</option>
            <option value="Mascotas" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Mascotas</option>
            <option value="Otros" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Otros</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Cantidad actual
            </label>
            <input 
              type="number" 
              required 
              min="0"
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Unidad de medida
            </label>
            <select 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all cursor-pointer"
            >
              <option value="unidades" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Unidades</option>
              <option value="litros" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Litros</option>
              <option value="kg" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Kilos</option>
              <option value="gramos" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Gramos</option>
              <option value="paquetes" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Paquetes</option>
              <option value="latas" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Latas</option>
              <option value="botellas" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Botellas</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
            Umbral mínimo (Para lista de compras)
          </label>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
            Te avisaremos cuando queden esta cantidad o menos.
          </p>
          <input 
            type="number" 
            required 
            min="0"
            value={minThreshold} 
            onChange={(e) => setMinThreshold(Number(e.target.value))}
            className="w-full rounded-xl bg-white/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Guardando...
            </span>
          ) : (
            'Guardar en despensa'
          )}
        </button>
      </form>
    </div>
  )
}