'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingCart, Clock, Users, Plus } from 'lucide-react'

export function FloatingDock() {
  const pathname = usePathname()

  // Muestra la barra únicamente si el usuario está en la vista de Despensa
  if (pathname !== '/pantry') return null

  const navItems = [
    { href: '/pantry', label: 'Despensa', icon: Package },
    { href: '/shopping-list', label: 'Compras', icon: ShoppingCart },
    { href: '/history', label: 'Historial', icon: Clock },
    { href: '/household', label: 'Hogar', icon: Users },
  ]

  const glass3dClass = "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/90 dark:border-slate-700/80 shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"

  return (
    <div className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md flex items-center gap-2.5 pointer-events-auto">
      <nav className={`flex-1 flex items-center justify-around p-1.5 rounded-full ${glass3dClass}`}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <Link
        href="/pantry/add"
        className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        title="Agregar producto"
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>
    </div>
  )
}