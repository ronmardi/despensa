import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Inicializamos la respuesta que Next.js va a devolver
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Creamos el cliente de Supabase para leer/escribir las cookies de sesión
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Consultamos al servidor de Supabase si hay un usuario logueado válido
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // REGLA 1: Si intenta entrar a la raíz ("/"), lo mandamos a /pantry o al login
  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/pantry' : '/login', request.url))
  }

  // REGLA 2: Si NO está logueado e intenta entrar a rutas privadas, va al login
  // ¡CORREGIDO! Ahora protege el historial y el perfil.
  const isProtectedRoute = 
    pathname.startsWith('/pantry') || 
    pathname.startsWith('/shopping') || 
    pathname.startsWith('/household') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/profile')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // REGLA 3: Si YA está logueado e intenta ir al login, lo mandamos directo a su despensa
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/pantry', request.url))
  }

  return response
}

// Esto le dice a Next.js en qué archivos NO debe ejecutar el middleware (imágenes, iconos, código base)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}