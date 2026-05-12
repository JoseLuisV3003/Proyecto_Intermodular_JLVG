import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './app/lib/auth';


export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard'];
  
  // Verificar si la ruta es protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    const userSession = request.cookies.get('userSession');
    if (userSession) {

      // Verificar si el token es válido
      const payload = await verifyToken(userSession.value);
      
      if (!payload) {
        // Token inválido o expirado, redirigir a login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      // No hay cookie, redirigir a login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

  }
  
  return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
