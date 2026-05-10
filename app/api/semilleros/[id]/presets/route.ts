import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const semilleroId = parseInt(id);

    const presets = await prisma.preset.findMany({
      where: { semillero_id: semilleroId },
      include: {
        criaturas: {
          include: {
            criatura: {
              include: {
                habilidades: {
                  include: { habilidad: true }
                },
                depredadores: true
              }
            }
          }
        }
      }
    });

    // Transformar para que el frontend reciba una lista de criaturas plana como espera
    const formattedPresets = presets.map(preset => ({
      ...preset,
      criaturas: preset.criaturas.map(pc => ({
        ...pc.criatura,
        cantidad_en_preset: pc.cantidad,
        habilidades: pc.criatura.habilidades.map(ch => ({
          id: ch.habilidad.id,
          nombre: ch.habilidad.nombre,
          descripcion: ch.habilidad.descripcion
        }))
      }))
    }));

    return NextResponse.json({ presets: formattedPresets });
  } catch (error) {
    console.error('Error obteniendo presets:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const semilleroId = parseInt(id);
    const body = await request.json();
    const { nombre, criaturas } = body;

    if (!nombre || !criaturas || !Array.isArray(criaturas)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const preset = await prisma.preset.create({
      data: {
        nombre,
        semillero_id: semilleroId,
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

    return NextResponse.json({ preset });
  } catch (error) {
    console.error('Error creando preset:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
