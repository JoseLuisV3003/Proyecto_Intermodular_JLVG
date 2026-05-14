import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserSession } from '../../../lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const presetId = parseInt(id);

    // Verificar propiedad a través del semillero
    const preset = await prisma.preset.findUnique({
      where: { id: presetId },
      include: { semillero: true }
    });

    if (!preset || preset.semillero.usuario_correo !== session.correo) {
      return NextResponse.json({ error: 'Formación no encontrada o no autorizada' }, { status: 404 });
    }

    const body = await request.json();
    const { nombre, criaturas } = body;

    if (!nombre || !criaturas || !Array.isArray(criaturas)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const updatedPreset = await prisma.$transaction(async (tx) => {
      await tx.presetCriatura.deleteMany({
        where: { preset_id: presetId }
      });

      return await tx.preset.update({
        where: { id: presetId },
        data: {
          nombre,
          criaturas: {
            create: criaturas.map((c: any) => ({
              criatura_id: c.id,
              cantidad: c.cantidad || 1
            }))
          }
        },
        include: {
          criaturas: {
            include: {
              criatura: true
            }
          }
        }
      });
    });

    return NextResponse.json({ preset: updatedPreset });
  } catch (error) {
    console.error('Error actualizando preset:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const presetId = parseInt(id);

    // Verificar propiedad a través del semillero
    const preset = await prisma.preset.findUnique({
      where: { id: presetId },
      include: { semillero: true }
    });

    if (!preset || preset.semillero.usuario_correo !== session.correo) {
      return NextResponse.json({ error: 'Formación no encontrada o no autorizada' }, { status: 404 });
    }

    await prisma.preset.delete({
      where: { id: presetId }
    });

    return NextResponse.json({ message: 'Preset eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando preset:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
