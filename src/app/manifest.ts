import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mi Despensa',
    short_name: 'Despensa',
    description: 'Gestión interactiva del inventario del hogar',
    start_url: '/pantry',
    display: 'standalone',
    background_color: '#0f172a', // Color oscuro (slate-900) para que coincida con tu diseño
    theme_color: '#4f46e5', // Tu color principal (indigo-600)
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  }
}