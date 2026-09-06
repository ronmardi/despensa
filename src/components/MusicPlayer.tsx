'use client'

import { useState } from 'react'
import { Music, X } from 'lucide-react'

export function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end pointer-events-none">
      
      <div
        className={`transition-all duration-300 ease-in-out pointer-events-auto origin-bottom-right mb-3 ${
          isOpen ? 'scale-100 opacity-100 translate-x-0' : 'scale-0 opacity-0 translate-x-10'
        }`}
      >
        {/* Aquí está la magia: w-[320px] da el ancho perfecto para Spotify, 
            y max-w-[calc(100vw-2rem)] evita que se salga en pantallas muy pequeñas */}
        <div className="w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 bg-black">
          <iframe
            style={{ borderRadius: '16px' }}
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DXc2aPBXGmXrt?utm_source=generator&theme=0"
            width="100%"
            height="80"
            frameBorder="0"
            allowFullScreen={false}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto"
        title={isOpen ? "Ocultar reproductor" : "Mostrar reproductor"}
      >
        {isOpen ? <X size={24} /> : <Music size={24} />}
      </button>
      
    </div>
  )
}