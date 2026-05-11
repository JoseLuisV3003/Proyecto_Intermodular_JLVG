import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Obtener el correo del usuario de la cookie
    const userSession = request.cookies.get('userSession');
    if (!userSession) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = userSession.value;

    // Obtener el usuario
    const user = await prisma.usuarios.findUnique({
      where: {
        correo: userEmail
      },
      select: {
        correo: true,
        usuario: true,
        rol: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}