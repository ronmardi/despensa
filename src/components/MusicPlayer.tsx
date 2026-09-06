'use client'

import { useState } from 'react'
import { Music, X } from 'lucide-react'

export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {/* Botón flotante para activar/desactivar el reproductor */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto"
        title="Escuchar música"
      >
        {isOpen ? <X size={24} /> : <Music size={24} />}
      </button>

      {/* Mini Widget de Spotify (Justin Bieber) */}
      {isOpen && (
        <div className="w-72 md:w-80 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)] pointer-events-auto animate-in slide-in-from-right-8 duration-300">
          <iframe
          style={{ borderRadius: '16px' }}
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DXc2aPBXGmXrt?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen={false}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
        </div>
      )}
    </div>
  )
}