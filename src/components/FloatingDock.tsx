'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingCart, Clock, Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FloatingDock() {
  const pathname = usePathname()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [hasHousehold, setHasHousehold] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)

    async function checkHousehold() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHasHousehold(false)
        return
      }

      const { data } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle()

      setHasHousehold(!!data)
    }

    checkHousehold()

    const channel = supabase
      .channel('dock_household_check')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'household_members' },
        () => {
          checkHousehold()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pathname, supabase])

  // Verificamos si estamos únicamente en la Despensa
  const isPantry = pathname === '/pantry' || pathname === '/pantry/'

  // Se oculta si no está montado, si no tiene hogar o si NO estamos en Pantry
  if (!mounted || !hasHousehold || !isPantry) return null

  const navItems = [
    { href: '/pantry', label: 'Despensa', icon: Package },
    { href: '/shopping-list', label: 'Compras', icon: ShoppingCart },
    { href: '/history', label: 'Historial', icon: Clock },
    { href: '/household', label: 'Hogar', icon: Users },
  ]

  const glass3dClass = "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/90 dark:border-slate-700/80 shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"

  return (
    <div 
      className="fixed left-0 right-0 z-50 mx-auto w-full max-w-md px-4 flex items-center justify-between gap-2.5 pointer-events-none transition-all duration-300"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
    >
      {/* Barra de Navegación Flotante Principal */}
      <nav className={`flex-1 flex items-center justify-around p-2 rounded-full pointer-events-auto ${glass3dClass}`}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Botón Flotante de Agregar (+) */}
      <Link
        href="/pantry?add=true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all pointer-events-auto shrink-0"
        title="Agregar producto"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}