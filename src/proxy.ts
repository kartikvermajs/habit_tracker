import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/dashboard', '/settings']
const publicRoutes = ['/login', '/signup', '/']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  const isPublicRoute = publicRoutes.includes(path)

  // Read cookie directly from the request (NOT from next/headers cookies())
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  const isAuth = !!session?.userId

  // Unauthenticated user hitting a protected route → login
  if (isProtectedRoute && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Authenticated user hitting any public/auth route → dashboard
  if (isPublicRoute && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|sw\\.js|manifest\\.json).*)'],
}
