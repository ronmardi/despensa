'use client'

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Minus, Package, AlertTriangle, Trash2, LogOut, Search, X, User, Pencil, MapPin } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { updateItemQuantityAction, deleteItemAction } from './actions'
import { toast } from 'sonner'
import { EditProductModal } from '@/components/EditProductModal'
import { AddProductModal } from '@/components/AddProductModal'
import { OnboardingModal } from '@/components/OnboardingModal'
import { formatUnit } from '@/lib/utils/format'
import { getProductEmoji } from '@/lib/utils/emoji'

interface PantryItem {
  id: string
  name: string
  category: string
  location?: string
  current_quantity: number
  min_threshold: number
  unit: string
  emoji?: string | null
}

function PantryContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [selectedLocation, setSelectedLocation] = useState('Todas')
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [householdName, setHouseholdName] = useState<string>('Mi Despensa')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)

  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const pendingDeltas = useRef<{ [key: string]: number }>({})
  const pendingDeletions = useRef<{ [key: string]: NodeJS.Timeout }>({})

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsAddModalOpen(true)
    }
  }, [searchParams])

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    router.replace('/pantry')
  }

  const loadPantryItems = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setUserEmail(user.email || '')
    const nameFromAuth = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
    setUserName(nameFromAuth)

    if (user.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url)
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }
    }

    const { data: members } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)

    if (members && members.length > 0) {
      setIsOnboardingOpen(false)
      const hId = members[0].household_id
      setHouseholdId(hId)

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
    } else {
      setIsOnboardingOpen(true)
      setItems([])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadPantryItems()
  }, [loadPantryItems])

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))
    return ['Todas', ...uniqueCats]
  }, [items])

  const locations = useMemo(() => {
    const uniqueLocs = Array.from(new Set(items.map((item) => item.location || 'Despensa').filter(Boolean)))
    return ['Todas', ...uniqueLocs]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'Todas' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      const itemLoc = item.location || 'Despensa'
      const matchesLocation =
        selectedLocation === 'Todas' ||
        itemLoc.toLowerCase() === selectedLocation.toLowerCase()
      
      return matchesSearch && matchesCategory && matchesLocation
    })
  }, [items, searchTerm, selectedCategory, selectedLocation])

  const handleQuantityChange = (id: string, delta: number) => {
    const currentItem = items.find((i) => i.id === id)
    if (!currentItem) return

    const previousQuantity = currentItem.current_quantity
    const newQuantity = Math.max(0, previousQuantity + delta)

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, current_quantity: newQuantity } : item))
    )

    pendingDeltas.current[id] = (pendingDeltas.current[id] || 0) + delta

    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id])
    }

    debounceTimers.current[id] = setTimeout(async () => {
      const totalDelta = pendingDeltas.current[id]
      delete pendingDeltas.current[id]
      delete debounceTimers.current[id]

      if (totalDelta === 0) return

      const res = await updateItemQuantityAction(id, currentItem.name, totalDelta)

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

    if (pendingDeletions.current[id]) {
      clearTimeout(pendingDeletions.current[id])
    }

    const timer = setTimeout(async () => {
      delete pendingDeletions.current[id]
      const res = await deleteItemAction(id, itemToDelete.name)
      if (!res.success) {
        toast.error(`Error al eliminar "${itemToDelete.name}" de la base de datos`)
        setItems((prev) => [...prev, itemToDelete])
      }
    }, 4000)

    pendingDeletions.current[id] = timer

    toast.success(`"${itemToDelete.name}" eliminado`, {
      action: {
        label: 'Deshacer',
        onClick: () => {
          if (pendingDeletions.current[id]) {
            clearTimeout(pendingDeletions.current[id])
            delete pendingDeletions.current[id]
            setItems((prev) => [...prev, itemToDelete])
            toast.info('Eliminación cancelada')
          }
        },
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
    <div className="mx-auto max-w-md p-4 pb-36">
      <OnboardingModal
        userName={userName}
        isOpen={isOnboardingOpen}
        onSuccess={() => {
          setIsOnboardingOpen(false)
          loadPantryItems()
        }}
      />

      {isAddModalOpen && householdId && (
        <AddProductModal
          householdId={householdId}
          onClose={handleCloseAddModal}
          onSuccess={() => {
            handleCloseAddModal()
            loadPantryItems()
          }}
        />
      )}

      {editingItem && (
        <EditProductModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)}
          onSuccess={(updated) => {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
          }}
        />
      )}

      <header className="mb-6 mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm truncate">
            {householdName}
          </h1>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Inventario interactivo</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          
          <div className={`flex items-center gap-1 p-1 rounded-2xl ${glass3dClass}`}>
            <Link 
              href="/profile" 
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl overflow-hidden hover:opacity-80 transition-all active:scale-95"
              title="Mi Perfil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <User size={18} />
                </div>
              )}
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
          {/* Campo de Búsqueda */}
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

          {/* Filtro por Categorías */}
          <div className="flex gap-2 overflow-x-auto py-1 px-1 -mx-1 no-scrollbar items-center mask-[linear-gradient(to_right,black_88%,transparent)]">
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

          {/* Filtro por Ubicación */}
          {locations.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 -mx-1 no-scrollbar mask-[linear-gradient(to_right,black_88%,transparent)]">
              <span className="text-gray-400 dark:text-gray-500 pl-1 shrink-0 flex items-center gap-1 text-xs font-bold">
                <MapPin size={12} />
              </span>
              {locations.map((loc) => {
                const isActive = selectedLocation.toLowerCase() === loc.toLowerCase()
                return (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`shrink-0 rounded-lg px-3 py-1 text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold shadow-xs'
                        : `${glass3dClass} text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-slate-800`
                    }`}
                  >
                    {loc}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : items.length === 0 && !isOnboardingOpen ? (
        <div className={`rounded-3xl p-8 text-center ${glass3dClass}`}>
          <Package className="mx-auto mb-3 text-indigo-500" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Tu despensa está vacía</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Presiona el botón flotante para registrar productos.</p>
        </div>
      ) : filteredItems.length === 0 && !isOnboardingOpen ? (
        <div className={`rounded-3xl p-8 text-center ${glass3dClass}`}>
          <Search className="mx-auto mb-3 text-gray-400" size={40} />
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Sin coincidencias</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No hay productos que coincidan con los filtros.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('Todas')
              setSelectedLocation('Todas')
            }}
            className="mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 pb-20">
          {filteredItems.map((item) => {
            const isLowStock = item.current_quantity <= item.min_threshold

            return (
              <div 
                key={item.id}
                className={`flex items-center justify-between gap-2 rounded-2xl p-4 transition-all duration-200 ${glass3dClass} ${
                  isLowStock ? 'ring-2 ring-amber-500/40 dark:ring-amber-500/30' : ''
                }`}
              >
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-base truncate max-w-full">
                      <span className="text-2xl filter drop-shadow-sm shrink-0">
                        {item.emoji || getProductEmoji(item.name, item.category)}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </h3>
                    {isLowStock && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        <AlertTriangle size={10} /> Reponer
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 overflow-hidden">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize truncate shrink-0">
                      {item.category}
                    </p>
                    
                    {item.location && item.location !== 'Despensa' && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600 text-[10px] shrink-0">•</span>
                        <span className="flex items-center gap-0.5 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0 truncate">
                          <MapPin size={10} /> {item.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-200/50 dark:bg-slate-950/50 p-1 border border-black/5 dark:border-white/5 shadow-inner">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-sm hover:text-red-500 active:scale-90 transition-all cursor-pointer shrink-0"
                    >
                      <Minus size={15} />
                    </button>
                    
                    <div className="flex flex-col items-center justify-center min-w-10 px-1">
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
                        {item.current_quantity}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 lowercase tracking-wider truncate max-w-12">
                        {formatUnit(item.unit, item.current_quantity)}
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
    </div>
  )
}

export default function PantryPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    }>
      <PantryContent />
    </Suspense>
  )
}