'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingCart, Clock, Users, Plus, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FloatingDock() {
  const pathname = usePathname()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [hasHousehold, setHasHousehold] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState(false) // <-- Controla si el menú está abierto o cerrado

  useEffect(() => {
    setMounted(true)
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setupDock() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHasHousehold(false)
        return
      }

      const checkHousehold = async () => {
        const { data } = await supabase
          .from('household_members')
          .select('household_id')
          .eq('user_id', user.id)
          .maybeSingle()

        setHasHousehold(!!data)
      }

      await checkHousehold()

      // Suscripción OPTIMIZADA (igual que el MusicPlayer, ahorra recursos)
      channel = supabase
        .channel(`dock_household_${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'household_members',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            checkHousehold()
          }
        )
        .subscribe()
    }

    setupDock()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [pathname, supabase])

  // Cierra el menú automáticamente cuando el usuario cambia de página
  useEffect(() => {
    setIsExpanded(false)
  }, [pathname])

  const isPantry = pathname === '/pantry' || pathname === '/pantry/'

  if (!mounted || !hasHousehold || !isPantry) return null

  const navItems = [
    { href: '/pantry', label: 'Despensa', icon: Package },
    { href: '/shopping-list', label: 'Compras', icon: ShoppingCart },
    { href: '/history', label: 'Historial', icon: Clock },
    { href: '/household', label: 'Hogar', icon: Users },
  ]

  const glass3dClass = "backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"

  return (
    <>
      {/* Capa invisible a pantalla completa: al hacer clic fuera de la barra, la cierra */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)} 
        />
      )}

      <div 
        className="fixed left-0 right-0 z-50 mx-auto w-full max-w-md px-4 flex items-end justify-between gap-3 pointer-events-none transition-all duration-300"
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }} // <-- Bajamos el margen para pegarlo más al borde inferior
      >
        {/* Lado Izquierdo: Contenedor Dinámico del Menú */}
        <div className={`relative flex pointer-events-auto transition-all duration-300 origin-bottom-left ${isExpanded ? 'flex-1 w-full' : 'w-auto'}`}>
          
          {/* ESTADO 1: Botón Contraído (Pastilla pequeña) */}
          <button
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-full transition-all duration-300 ${glass3dClass} ${
              isExpanded 
                ? 'opacity-0 scale-90 pointer-events-none absolute bottom-0 left-0' 
                : 'opacity-100 scale-100 relative'
            }`}
          >
            <Menu size={20} className="text-gray-800 dark:text-gray-200" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Menú</span>
          </button>

          {/* ESTADO 2: Barra de Navegación Expandida */}
          <nav 
            className={`flex w-full items-center justify-around p-2 rounded-3xl transition-all duration-300 ${glass3dClass} ${
              isExpanded 
                ? 'opacity-100 scale-100 translate-y-0 relative pointer-events-auto' 
                : 'opacity-0 scale-95 translate-y-4 absolute bottom-0 left-0 pointer-events-none'
            }`}
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsExpanded(false)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl text-[10px] font-bold transition-all ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 scale-105 bg-indigo-500/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Lado Derecho: Botón Flotante de Agregar (+) siempre visible */}
        <Link
          href="/pantry?add=true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all pointer-events-auto shrink-0"
          title="Agregar producto"
        >
          <Plus size={26} />
        </Link>
      </div>
    </>
  )
}