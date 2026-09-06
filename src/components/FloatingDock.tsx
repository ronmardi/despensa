'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingBag, History, Home, Plus } from 'lucide-react'

export function FloatingDock() {
  const pathname = usePathname()
  const supabase = createClient()
  const [hasHousehold, setHasHousehold] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    async function checkHousehold() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (isMounted) {
          setHasHousehold(false)
          setLoading(false)
        }
        return
      }

      const { data } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (isMounted) {
        setHasHousehold(!!data)
        setLoading(false)
      }
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
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [pathname, supabase])

  // Ocultar si no hay un hogar asignado o si está comprobando
  if (loading || !hasHousehold) return null

  const navItems = [
    { label: 'Despensa', href: '/pantry', icon: Package },
    { label: 'Compras', href: '/shopping', icon: ShoppingBag },
    { label: 'Historial', href: '/history', icon: History },
    { label: 'Hogar', href: '/household', icon: Home },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/20 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/80 p-2 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-1 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-11 rounded-full text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="h-6 w-px bg-gray-300 dark:bg-slate-800" />

      <Link
        href="/pantry?add=true"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
        title="Agregar producto"
      >
        <Plus size={22} />
      </Link>
    </div>
  )
}