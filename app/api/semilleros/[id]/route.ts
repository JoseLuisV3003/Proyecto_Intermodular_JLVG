import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const semilleroId = parseInt(id);

    if (isNaN(semilleroId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar que el semillero pertenece al usuario
    const semillero = await prisma.semillero.findFirst({
      where: {
        id: semilleroId,
        usuario_correo: userEmail
      },
      include: {
        criaturas: {
          include: {
            criatura: {
              include: {
                habilidades: {
                  include: {
                    habilidad: true
                  }
                },
                depredadores: true
              }
            }
          }
        }
      }
    });

    if (!semillero) {
      return NextResponse.json(
        { error: 'Semillero no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Transformar los datos para que coincidan con la interfaz del frontend
    const semilleroFormatted = {
      id: semillero.id,
      nombre: semillero.nombre,
      color: semillero.color,
      LimiteDeCombate: semillero.LimiteDeCombate,
      criaturas: semillero.criaturas.map((sc) => ({
        id: sc.criatura.id,
        nombre: sc.criatura.nombre,
        clasificacion: sc.criatura.clasificacion,
        danio_base: sc.criatura.danio_base,
        HabilidadAtaque: sc.criatura.HabilidadAtaque,
        HabilidadDefensa: sc.criatura.HabilidadDefensa,
        PuntosVitales: sc.criatura.PuntosVitales,
        germinacion: sc.criatura.germinacion,
        descripcion: sc.criatura.descripcion,
        apariencia: sc.criatura.apariencia,
        observaciones: sc.criatura.observaciones,
        forma_ser: sc.criatura.forma_ser,
        cantidad: sc.cantidad,
        habilidades: sc.criatura.habilidades.map((ch) => ({
          id: ch.habilidad.id,
          nombre: ch.habilidad.nombre,
          descripcion: ch.habilidad.descripcion
        })),
        tipo: sc.criatura.tipo,
        depredadores: sc.criatura.depredadores
      }))
    };

    return NextResponse.json({ semillero: semilleroFormatted });
  } catch (error) {
    console.error('Error obteniendo semillero:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const semilleroId = parseInt(id);

    if (isNaN(semilleroId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombre, LimiteDeCombate, color } = body;

    if (!nombre && LimiteDeCombate === undefined && !color) {
      return NextResponse.json(
        { error: 'Se requiere nombre, LimiteDeCombate o color' },
        { status: 400 }
      );
    }

    // Verificar que el semillero pertenece al usuario
    const semilleroExistente = await prisma.semillero.findFirst({
      where: {
        id: semilleroId,
        usuario_correo: userEmail
      }
    });

    if (!semilleroExistente) {
      return NextResponse.json(
        { error: 'Semillero no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Actualizar el semillero
    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (LimiteDeCombate !== undefined) updateData.LimiteDeCombate = Number(LimiteDeCombate);
    if (color !== undefined) updateData.color = color;

    const semilleroActualizado = await prisma.semillero.update({
      where: {
        id: semilleroId
      },
      data: updateData
    });

    return NextResponse.json({ semillero: semilleroActualizado });
  } catch (error) {
    console.error('Error actualizando semillero:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = request.cookies.get('userSession');
    if (!userSession) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = userSession.value;
    const { id } = await params;
    const semilleroId = parseInt(id);

    if (isNaN(semilleroId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const semilleroExistente = await prisma.semillero.findFirst({
      where: {
        id: semilleroId,
        usuario_correo: userEmail,
      },
    });

    if (!semilleroExistente) {
      return NextResponse.json(
        { error: 'Semillero no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    await prisma.semillero.delete({
      where: {
        id: semilleroId,
      },
    });

    return NextResponse.json({ message: 'Semillero eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando semillero:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}