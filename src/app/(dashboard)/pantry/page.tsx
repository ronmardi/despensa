'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Minus, Package, AlertTriangle, Trash2, ShoppingCart, Users, LogOut, Search, X, Clock, User } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface PantryItem {
  id: string
  name: string
  category: string
  current_quantity: number
  min_threshold: number
  unit: string
}

function getProductEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('arroz')) return '🍚'
  if (n.includes('leche')) return '🥛'
  if (n.includes('pan')) return '🍞'
  if (n.includes('huevo')) return '🥚'
  if (n.includes('carne')) return '🥩'
  if (n.includes('pollo')) return '🍗'
  if (n.includes('queso')) return '🧀'
  if (n.includes('tomate')) return '🍅'
  if (n.includes('cebolla')) return '🧅'
  if (n.includes('papa')) return '🥔'
  if (n.includes('manzana')) return '🍎'
  if (n.includes('platano') || n.includes('banana')) return '🍌'
  if (n.includes('agua')) return '💧'
  if (n.includes('jugo')) return '🧃'
  if (n.includes('cerveza')) return '🍺'
  if (n.includes('vino')) return '🍷'
  if (n.includes('cafe') || n.includes('café')) return '☕'
  if (n.includes('te') || n.includes('té')) return '🍵'
  if (n.includes('jabon') || n.includes('jabón')) return '🧼'
  if (n.includes('papel') || n.includes('higienico')) return '🧻'
  if (n.includes('pasta') || n.includes('fideo')) return '🍝'
  if (n.includes('galleta')) return '🍪'
  if (n.includes('chocolate')) return '🍫'
  if (n.includes('azucar') || n.includes('azúcar') || n.includes('sal')) return '🧂'
  if (n.includes('pescado') || n.includes('atun') || n.includes('atún')) return '🐟'
  if (n.includes('yogur') || n.includes('cereal')) return '🥣'
  if (n.includes('helado')) return '🍨'
  return '📦'
}

export default function PantryPage() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    async function loadPantryItems() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')

      const { data: members } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const hId = members[0].household_id
        setHouseholdId(hId)

        const { data: pantryItems } = await supabase
          .from('items')
          .select('*')
          .eq('household_id', hId)
          .order('name', { ascending: true })

        if (pantryItems) setItems(pantryItems)
      }
      setLoading(false)
    }

    loadPantryItems()
  }, [supabase])

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))
    return ['Todas', ...uniqueCats]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'Todas' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, selectedCategory])

  const handleQuantityChange = async (id: string, delta: number) => {
    const currentItem = items.find((i) => i.id === id)
    if (!currentItem) return

    const newQuantity = Math.max(0, currentItem.current_quantity + delta)

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, current_quantity: newQuantity } : item))
    )

    await supabase
      .from('items')
      .update({ current_quantity: newQuantity })
      .eq('id', id)

    if (householdId) {
      await supabase.from('activity_logs').insert([{
        household_id: householdId,
        user_email: userEmail,
        item_name: currentItem.name,
        action_type: delta > 0 ? 'INCREASE' : 'DECREASE',
        details: `Cambió la cantidad de ${currentItem.current_quantity} a ${newQuantity} ${currentItem.unit}`
      }])
    }
  }

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find((i) => i.id === id)
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return

    setItems((prev) => prev.filter((item) => item.id !== id))
    await supabase.from('items').delete().eq('id', id)

    if (householdId && itemToDelete) {
      await supabase.from('activity_logs').insert([{
        household_id: householdId,
        user_email: userEmail,
        item_name: itemToDelete.name,
        action_type: 'DELETE',
        details: `Producto eliminado de la despensa`
      }])
    }
  }

  const handleSignOut = async () => {
    if (!confirm('¿Quieres cerrar la sesión activa?')) return
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      <header className="mb-4 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">Mi Despensa</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Inventario interactivo</p>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link 
            href="/profile" 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-indigo-600 dark:text-indigo-400 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95"
            title="Mi Perfil"
          >
            <User size={18} />
          </Link>
          <Link 
            href="/history" 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95"
            title="Historial de Cambios"
          >
            <Clock size={18} />
          </Link>
          <Link 
            href="/household" 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95"
            title="Gestión del Hogar"
          >
            <Users size={18} />
          </Link>
          <Link 
            href="/shopping-list" 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-indigo-600 dark:text-indigo-400 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95"
            title="Lista de Compras"
          >
            <ShoppingCart size={18} />
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 shadow-sm transition-all hover:bg-red-500 hover:text-white dark:hover:text-white active:scale-95 cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {!loading && items.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white/80 dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/40 dark:bg-slate-800/40 text-gray-700 dark:text-gray-300 border border-white/60 dark:border-slate-700/60 hover:bg-white/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <Package className="mx-auto mb-3 text-indigo-400" size={48} />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Tu despensa está vacía</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Presiona el botón + para registrar tu primer producto.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <Search className="mx-auto mb-3 text-gray-400" size={40} />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Sin coincidencias</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No encontramos productos que coincidan con los filtros.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('Todas')
            }}
            className="mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isLowStock = item.current_quantity <= item.min_threshold

            return (
              <div 
                key={item.id}
                className={`flex items-center justify-between rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border p-4 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)] transition-all ${
                  isLowStock ? 'border-amber-300/80 dark:border-amber-500/50 bg-amber-500/5' : 'border-white/60 dark:border-slate-700/60'
                }`}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="text-xl drop-shadow-sm">{getProductEmoji(item.name)}</span>
                      {item.name}
                    </h3>
                    {isLowStock && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <AlertTriangle size={12} /> Reponer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.category}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-white/80 dark:border-slate-700/50 p-1 shadow-inner">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-700 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 active:scale-90 cursor-pointer"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span className="min-w-10 text-center text-sm font-bold text-gray-800 dark:text-gray-200">
                      {item.current_quantity} <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">{item.unit}</span>
                    </span>

                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-700 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-500/20 dark:hover:text-green-400 active:scale-90 cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link 
        href="/pantry/add"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={28} />
      </Link>
    </div>
  )
}