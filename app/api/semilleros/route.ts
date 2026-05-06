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

    // Obtener todos los semilleros del usuario
    const semilleros = await prisma.semillero.findMany({
      where: {
        usuario_correo: userEmail
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json({ semilleros });
  } catch (error) {
    console.error('Error obteniendo semilleros:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Crear el nuevo semillero
    const nuevoSemillero = await prisma.semillero.create({
      data: {
        nombre,
        usuario_correo: userEmail
      }
    });

    return NextResponse.json({ semillero: nuevoSemillero }, { status: 201 });
  } catch (error) {
    console.error('Error creando semillero:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}