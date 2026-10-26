import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Route handlers authenticate API requests independently. Never cache personal data.
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }
  // Public pages and assets remain available without an account.
  if (pathname === '/' || pathname === '/pricing' || pathname === '/privacy' || pathname === '/terms' || pathname.startsWith('/brand/') || /\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next()
  }
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
  })
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url))
  if (pathname.startsWith('/auth/')) {
    if (pathname === '/auth/signin' && token?.hasCompletedOnboarding) {
      const from = request.nextUrl.searchParams.get('from')
      if (from?.startsWith('/') && !from.startsWith('//') && !from.includes('\\')) {
        const target = new URL(from, request.url)
        if (target.origin === request.nextUrl.origin && !target.pathname.startsWith('/auth/')) return NextResponse.redirect(target)
      }
      return redirect('/dashboard')
    }
    return NextResponse.next()
  }
  if (!token?.id) {
    const signIn = new URL('/auth/signin', request.url)
    signIn.searchParams.set('from', pathname)
    return NextResponse.redirect(signIn)
  }
  if (!token.hasCompletedOnboarding && !pathname.startsWith('/onboarding')) return redirect('/onboarding')
  if (token.hasCompletedOnboarding && pathname.startsWith('/onboarding')) return redirect('/dashboard')
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
