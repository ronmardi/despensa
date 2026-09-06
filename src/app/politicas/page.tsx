import Link from 'next/link'

export default function PoliticasPage() {
  const glass3dClass = "backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]"

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col justify-between">
      <div className={`rounded-3xl p-8 space-y-6 ${glass3dClass}`}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Política de Privacidad - Mi Despensa</h1>
        <p className="text-xs text-gray-600 dark:text-gray-300">Última actualización: Septiembre 2026</p>

        <section className="space-y-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1. Información que recopilamos</h2>
          <p>
            Al utilizar <strong>Mi Despensa</strong> (un producto de Raccoon Lab), recopilamos la dirección de correo electrónico, nombre y fotografía de perfil proporcionados exclusivamente a través del inicio de sesión con Google OAuth o registro por correo.
          </p>
        </section>

        <section className="space-y-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">2. Uso de la información</h2>
          <p>
            Los datos recopilados se utilizan únicamente para autenticar tu acceso a la plataforma, gestionar las listas de inventario de tu hogar y sincronizar la actividad en tiempo real entre los miembros autorizados de tu despensa.
          </p>
        </section>

        <section className="space-y-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">3. Protección y almacenamiento de datos</h2>
          <p>
            Tus datos se almacenan de forma segura utilizando la infraestructura cifrada de Supabase con políticas de aislamiento de nivel de fila (RLS). No vendemos ni compartimos tu información personal con terceros.
          </p>
        </section>

        <section className="space-y-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          <h2 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">4. Contacto</h2>
          <p>
            Para cualquier duda sobre esta política o para solicitar la eliminación de tu cuenta y datos asociados, contáctanos en: <strong>contacto@raccoonlab.cl</strong>.
          </p>
        </section>

        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          <Link href="/login" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}