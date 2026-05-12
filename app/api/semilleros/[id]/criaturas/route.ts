import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserSession } from '../../../../lib/auth';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;

    const { id } = await params;
    const semilleroId = parseInt(id);

    if (isNaN(semilleroId)) {
      return NextResponse.json(
        { error: 'ID de semillero inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { criaturas } = body;

    if (!Array.isArray(criaturas)) {
      return NextResponse.json(
        { error: 'Las criaturas deben ser un array' },
        { status: 400 }
      );
    }

    // Verificar que el semillero pertenece al usuario
    const semillero = await prisma.semillero.findFirst({
      where: {
        id: semilleroId,
        usuario_correo: userEmail
      }
    });

    if (!semillero) {
      return NextResponse.json(
        { error: 'Semillero no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Validar el límite máximo de criaturas
    const totalCantidadSolicitada = criaturas.reduce((acc: number, c: any) => acc + (Number(c.cantidad) || 0), 0);
    
    if (totalCantidadSolicitada > semillero.LimiteMaximo) {
      return NextResponse.json(
        { error: `El semillero tiene un límite máximo de ${semillero.LimiteMaximo} Na'az. Estás intentando guardar ${totalCantidadSolicitada}.` },
        { status: 400 }
      );
    }

    // Procesar cada criatura
    const updates = [];
    const errors = [];

    for (const item of criaturas) {
      const { criaturaId, cantidad } = item;

      if (!criaturaId || typeof cantidad !== 'number' || cantidad < 0) {
        errors.push(`Criatura ${criaturaId}: datos inválidos`);
        continue;
      }

      // Verificar que la criatura existe
      const criatura = await prisma.criatura.findUnique({
        where: { id: criaturaId }
      });

      if (!criatura) {
        errors.push(`Criatura ${criaturaId}: no existe`);
        continue;
      }

      if (cantidad === 0) {
        // Si cantidad es 0, eliminar la relación
        await prisma.semilleroCriatura.deleteMany({
          where: {
            semillero_id: semilleroId,
            criatura_id: criaturaId
          }
        });
      } else {
        // Actualizar o crear la relación
        await prisma.semilleroCriatura.upsert({
          where: {
            semillero_id_criatura_id: {
              semillero_id: semilleroId,
              criatura_id: criaturaId
            }
          },
          update: {
            cantidad
          },
          create: {
            semillero_id: semilleroId,
            criatura_id: criaturaId,
            cantidad
          }
        });
      }

      updates.push({
        criaturaId,
        nombre: criatura.nombre,
        cantidad
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Criaturas actualizadas correctamente',
      updates,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error añadiendo criaturas al semillero:', error);
    if (error instanceof Error) {
      console.error('Detalle:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Error en el servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;

    const { id } = await params;
    const semilleroId = parseInt(id);

    if (isNaN(semilleroId)) {
      return NextResponse.json(
        { error: 'ID de semillero inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { criaturaId, cantidad } = body;

    if (!criaturaId || typeof cantidad !== 'number' || cantidad < 0) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Verificar que el semillero pertenece al usuario
    const semillero = await prisma.semillero.findFirst({
      where: {
        id: semilleroId,
        usuario_correo: userEmail
      }
    });

    if (!semillero) {
      return NextResponse.json(
        { error: 'Semillero no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Obtener la relación actual
    const semilleroCriatura = await prisma.semilleroCriatura.findUnique({
      where: {
        semillero_id_criatura_id: {
          semillero_id: semilleroId,
          criatura_id: criaturaId
        }
      },
      include: {
        criatura: true
      }
    });

    if (!semilleroCriatura) {
      return NextResponse.json(
        { error: 'Criatura no encontrada en este semillero' },
        { status: 404 }
      );
    }

    if (cantidad >= semilleroCriatura.cantidad) {
      // Eliminar completamente si se eliminan todas las criaturas
      await prisma.semilleroCriatura.delete({
        where: {
          semillero_id_criatura_id: {
            semillero_id: semilleroId,
            criatura_id: criaturaId
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Criatura eliminada del semillero',
        criaturaId,
        cantidadEliminada: semilleroCriatura.cantidad,
        cantidadRestante: 0
      });
    } else {
      // Solo restar la cantidad especificada
      const nuevaCantidad = semilleroCriatura.cantidad - cantidad;
      
      await prisma.semilleroCriatura.update({
        where: {
          semillero_id_criatura_id: {
            semillero_id: semilleroId,
            criatura_id: criaturaId
          }
        },
        data: {
          cantidad: nuevaCantidad
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Criaturas eliminadas del semillero',
        criaturaId,
        cantidadEliminada: cantidad,
        cantidadRestante: nuevaCantidad
      });
    }

  } catch (error) {
    console.error('Error eliminando criaturas del semillero:', error);
    if (error instanceof Error) {
      console.error('Detalle:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Error en el servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}