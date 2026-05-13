import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './app/lib/auth';


export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard'];
  
  // Rutas que solo pueden acceder los administradores
  const adminRoutes = [
    '/dashboard/manage-criaturas',
    '/dashboard/create-criatura'
  ];

  // Verificar si la ruta es protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute || isAdminRoute) {
    const userSession = request.cookies.get('userSession');
    
    if (userSession) {
      // Verificar si el token es válido
      const payload = await verifyToken(userSession.value);
      
      if (!payload) {
        // Token inválido o expirado, redirigir a login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      // Si es una ruta de admin, verificar el rol
      if (isAdminRoute && payload.rol !== 'administrador') {
        // No es administrador, redirigir al dashboard principal
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
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
