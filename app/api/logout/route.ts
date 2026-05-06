import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Sesión cerrada correctamente' },
    { status: 200 }
  );

  // Limpiar la cookie de sesión
  response.cookies.delete('userSession');

  return response;
}
