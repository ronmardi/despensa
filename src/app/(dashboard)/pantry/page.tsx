'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  const [householdName, setHouseholdName] = useState<string>('Mi Despensa')
  const [userEmail, setUserEmail] = useState<string>('')
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)

  // Referencias para controlar el debounce individual por producto
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const pendingDeltas = useRef<{ [key: string]: number }>({})

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

        // Obtener el nombre del hogar
        const { data: hhData } = await supabase
          .from('households')
          .select('name')
          .eq('id', hId)
          .single()

        if (hhData) {
          setHouseholdName(hhData.name)
        }

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

  // Lógica de cambio de cantidad con debounce de 500ms
  const handleQuantityChange = (id: string, delta: number) => {
    const currentItem = items.find((i) => i.id === id)
    if (!currentItem) return

    const previousQuantity = currentItem.current_quantity
    const newQuantity = Math.max(0, previousQuantity + delta)

    // 1. Actualización de UI instantánea
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, current_quantity: newQuantity } : item))
    )

    // 2. Acumular el cambio
    pendingDeltas.current[id] = (pendingDeltas.current[id] || 0) + delta

    // 3. Reiniciar temporizador si se presiona de nuevo antes de 500ms
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id])
    }

    debounceTimers.current[id] = setTimeout(async () => {
      const totalDelta = pendingDeltas.current[id]
      delete pendingDeltas.current[id]
      delete debounceTimers.current[id]

      if (totalDelta === 0) return

      // 4. Sincronizar en servidor tras 500ms de inactividad
      const res = await updateItemQuantityAction(id, newQuantity, currentItem.name, totalDelta)

      if (!res.success) {
        toast.error(`Error al actualizar ${currentItem.name}`, { description: res.error })
        setItems((prevItems) =>
          prevItems.map((item) => (item.id === id ? { ...item, current_quantity: previousQuantity } : item))
        )
      }
    }, 500)
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

  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

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

      {/* Cabecera optimizada con ancho flexible para el nombre del hogar */}
      <header className="mb-6 mt-4 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm truncate">
            {householdName}
          </h1>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Inventario interactivo</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          
          <div className={`flex items-center gap-0.5 sm:gap-1 p-1 rounded-2xl ${glass3dClass}`}>
            <Link 
              href="/profile" 
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95"
              title="Mi Perfil"
            >
              <User size={18} />
            </Link>
            <Link 
              href="/history" 
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95"
              title="Historial"
            >
              <Clock size={18} />
            </Link>
            <Link 
              href="/household" 
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95"
              title="Hogar"
            >
              <Users size={18} />
            </Link>
            <Link 
              href="/shopping-list" 
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white/80 dark:hover:bg-slate-800 transition-all active:scale-95"
              title="Lista de Compras"
            >
              <ShoppingCart size={18} />
            </Link>
            <button 
              onClick={handleSignOut}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 transition-all active:scale-95 cursor-pointer"
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
              className={`w-full rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${glass3dClass}`}
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

          <div className="flex gap-2 overflow-x-auto py-2 px-1 -mx-1 no-scrollbar items-center">
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : `${glass3dClass} text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-800`
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
        <div className={`rounded-3xl p-8 text-center ${glass3dClass}`}>
          <Package className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Tu despensa está vacía</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Presiona el botón flotante para registrar productos.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center ${glass3dClass}`}>
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
                className={`flex items-center justify-between gap-2 rounded-2xl p-4 transition-all duration-200 ${glass3dClass} ${
                  isLowStock ? 'ring-2 ring-amber-500/40 dark:ring-amber-500/30' : ''
                }`}
              >
                {/* Lado izquierdo adaptabilidad min-w-0 para prevenir colapsos en Mac/safari */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-base truncate max-w-full">
                      <span className="text-2xl filter drop-shadow-sm shrink-0">{getProductEmoji(item.name)}</span>
                      <span className="truncate">{item.name}</span>
                    </h3>
                    {isLowStock && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        <AlertTriangle size={10} /> Reponer
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize mt-0.5 truncate">
                    {item.category}
                  </p>
                </div>

                {/* Controles del lado derecho blindados para no comprimirse */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-200/50 dark:bg-slate-950/50 p-1 border border-black/5 dark:border-white/5 shadow-inner">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-sm hover:text-red-500 active:scale-90 transition-all cursor-pointer shrink-0"
                    >
                      <Minus size={15} />
                    </button>
                    
                    {/* Disposición apilada verticalmente de número + unidad para ahorrar espacio */}
                    <div className="flex flex-col items-center justify-center min-w-10 px-1">
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
                        {item.current_quantity}
                      </span>
                      <span className="text-[8px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider truncate max-w-11.25">
                      {item.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-sm hover:text-green-500 active:scale-90 transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer rounded-xl hover:bg-indigo-500/10"
                      title="Editar producto"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-red-500/10"
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botón Flotante con Profundidad 3D */}
      <Link 
        href="/pantry/add"
        className="fixed bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Plus size={30} />
      </Link>
    </div>
  )
}