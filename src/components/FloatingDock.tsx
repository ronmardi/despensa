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
  const [isExpanded, setIsExpanded] = useState(false)

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

  const glass3dClass = "backdrop-blur-2xl bg-white/30 dark:bg-slate-800/40 border border-white/50 dark:border-slate-600/40 shadow-[0_8px_30px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]"
  
  const btn3dClass = "bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3),inset_0_2px_2px_rgba(255,255,255,0.4)] dark:shadow-[0_8px_20px_rgba(79,70,229,0.4),inset_0_2px_2px_rgba(255,255,255,0.2)]"

  return (
    <>
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)} 
        />
      )}

      <div 
        className="fixed inset-x-0 z-50 mx-auto w-full max-w-md h-14 pointer-events-none"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div 
          className={`absolute bottom-0 h-14 flex items-center justify-center pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            /* CORRECCIÓN 1: right-18 en lugar de right-[4.5rem] */
            isExpanded ? 'left-4 right-18' : 'left-0 right-0'
          }`}
        >
          <button
            onClick={() => setIsExpanded(true)}
            className={`absolute px-6 py-3.5 rounded-full flex items-center gap-2 pointer-events-auto transition-all duration-500 ease-out ${glass3dClass} ${
              isExpanded 
                ? 'opacity-0 scale-50 translate-y-8 pointer-events-none' 
                : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <Menu size={20} className="text-gray-800 dark:text-gray-200 drop-shadow-sm" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wide drop-shadow-sm">Menú</span>
          </button>

          <nav 
            className={`absolute w-full flex items-center justify-around p-1.5 transition-all duration-500 ease-out pointer-events-auto ${glass3dClass} ${
              /* CORRECCIÓN 2: rounded-full en lugar de rounded-[2rem] */
              isExpanded 
                ? 'opacity-100 scale-100 translate-y-0 rounded-full' 
                : 'opacity-0 scale-75 translate-y-8 pointer-events-none rounded-full'
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
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl text-[10px] font-bold transition-all duration-300 ${
                    isActive
                      ? 'text-indigo-700 dark:text-indigo-300 scale-105 bg-white/40 dark:bg-slate-700/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={22} className="mb-1 drop-shadow-sm" />
                  <span className="drop-shadow-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 right-4 pointer-events-auto">
          <Link
            href="/pantry?add=true"
            className={`flex h-14 w-14 items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all shrink-0 ${btn3dClass}`}
            title="Agregar producto"
          >
            <Plus size={28} className="drop-shadow-md" />
          </Link>
        </div>
      </div>
    </>
  )
}