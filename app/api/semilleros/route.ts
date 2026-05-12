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
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;

    const body = await request.json();
    const { nombre, LimiteDeCombate, LimiteMaximo, color } = body;

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
        LimiteDeCombate: LimiteDeCombate !== undefined ? Number(LimiteDeCombate) : 5,
        LimiteMaximo: LimiteMaximo !== undefined ? Number(LimiteMaximo) : 20,
        color: color || 'Verde',
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