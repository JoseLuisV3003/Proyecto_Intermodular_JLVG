import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getUserSession } from '../../lib/auth';


export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;



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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;

    // Eliminar el usuario (Prisma se encargará de cascada según el schema)
    await prisma.usuarios.delete({
      where: {
        correo: userEmail
      }
    });

    // Crear respuesta y limpiar la cookie de sesión
    const response = NextResponse.json({ message: 'Cuenta eliminada correctamente' });
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la cuenta' },
      { status: 500 }
    );
  }
}