'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Minus, Package, AlertTriangle, Trash2, ShoppingCart, Users, LogOut, Search, X, Clock, User, Pencil } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { updateItemQuantityAction, deleteItemAction } from './actions'
import { toast } from 'sonner'
import { EditProductModal } from '@/components/EditProductModal'

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
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)

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

    const res = await updateItemQuantityAction(id, newQuantity, currentItem.name, delta)
    
    if (!res.success) {
      toast.error(`Error al actualizar ${currentItem.name}`, { description: res.error })
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? { ...item, current_quantity: currentItem.current_quantity } : item))
      )
    }
  }

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id)
    if (!itemToDelete) return

    setItems((prev) => prev.filter((item) => item.id !== id))

    let isUndone = false

    toast.success(`"${itemToDelete.name}" eliminado`, {
      action: {
        label: 'Deshacer',
        onClick: () => {
          isUndone = true
          setItems((prev) => [...prev, itemToDelete])
          toast.info('Eliminación cancelada')
        },
      },
      onDismiss: async () => {
        if (!isUndone) {
          const res = await deleteItemAction(id, itemToDelete.name)
          if (!res.success) {
            toast.error('Error al borrar en el servidor')
            setItems((prev) => [...prev, itemToDelete])
          }
        }
      },
      duration: 4000,
    })
  }

  const handleSignOut = async () => {
    toast('¿Quieres cerrar sesión?', {
      action: {
        label: 'Confirmar',
        onClick: async () => {
          await supabase.auth.signOut()
          router.push('/login')
          router.refresh()
        }
      }
    })
  }

  // Estilo base 3D de Liquid Glass
  const glass3dStyle = "backdrop-blur-xl bg-gradient-to-b from-white/80 via-white/50 to-white/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900/40 border border-white/80 dark:border-slate-700/60 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),inset_0_1px_2px_0_rgba(255,255,255,0.9)] dark:shadow-[0_12px_30px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.15)]"

  return (
    <div className="mx-auto max-w-md p-4 pb-28">
      {editingItem && (
        <EditProductModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)}
          onSuccess={(updated) => {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
          }}
        />
      )}

      <header className="mb-6 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-md">Mi Despensa</h1>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Inventario interactivo</p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <div className={`flex items-center gap-1 p-1 rounded-2xl ${glass3dStyle}`}>
            <Link 
              href="/profile" 
              className="flex h-9 w-9 items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all active:scale-95"
              title="Mi Perfil"
            >
              <User size={18} />
            </Link>
            <Link 
              href="/history" 
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all active:scale-95"
              title="Historial"
            >
              <Clock size={18} />
            </Link>
            <Link 
              href="/household" 
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all active:scale-95"
              title="Hogar"
            >
              <Users size={18} />
            </Link>
            <Link 
              href="/shopping-list" 
              className="flex h-9 w-9 items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all active:scale-95"
              title="Lista de Compras"
            >
              <ShoppingCart size={18} />
            </Link>
            <button 
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition-all active:scale-95 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {!loading && items.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${glass3dStyle}`}
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
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] scale-105'
                      : `${glass3dStyle} text-gray-700 dark:text-gray-300 hover:scale-102`
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
        <div className={`rounded-3xl p-8 text-center ${glass3dStyle}`}>
          <Package className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Tu despensa está vacía</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Presiona el botón flotante para registrar productos.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center ${glass3dStyle}`}>
          <Search className="mx-auto mb-3 text-gray-400" size={40} />
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Sin coincidencias</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No hay productos que coincidan con los filtros.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('Todas')
            }}
            className="mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const isLowStock = item.current_quantity <= item.min_threshold

            return (
              <div 
                key={item.id}
                className={`group flex items-center justify-between rounded-3xl p-4 transition-all duration-200 ${glass3dStyle} ${
                  isLowStock ? 'ring-2 ring-amber-500/40 dark:ring-amber-500/30' : ''
                }`}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                      <span className="text-2xl filter drop-shadow">{getProductEmoji(item.name)}</span>
                      {item.name}
                    </h3>
                    {isLowStock && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <AlertTriangle size={11} /> Reponer
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize mt-0.5">{item.category}</p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Cápsula 3D para controles de cantidad */}
                  <div className="flex items-center gap-1 rounded-2xl bg-slate-900/5 dark:bg-slate-950/40 p-1 border border-black/5 dark:border-white/5 shadow-inner">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:text-red-500 active:scale-90 transition-all cursor-pointer"
                    >
                      <Minus size={15} />
                    </button>
                    
                    <span className="min-w-11 text-center text-sm font-extrabold text-gray-900 dark:text-white">
                      {item.current_quantity} <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">{item.unit}</span>
                    </span>

                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:text-green-500 active:scale-90 transition-all cursor-pointer"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-xl hover:bg-indigo-500/10"
                    title="Editar producto"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-red-500/10"
                    title="Eliminar producto"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botón Flotante con Profundidad 3D */}
      <Link 
        href="/pantry/add"
        className="fixed bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-[0_10px_25px_-3px_rgba(99,102,241,0.5),inset_0_2px_2px_0_rgba(255,255,255,0.45)] hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Plus size={30} />
      </Link>
    </div>
  )
}