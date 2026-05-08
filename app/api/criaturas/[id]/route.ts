import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar que el usuario sea administrador
    const userSession = request.cookies.get('userSession');
    if (!userSession) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = userSession.value;
    const user = await prisma.usuarios.findUnique({
      where: { correo: userEmail },
      select: { rol: true }
    });

    if (!user || user.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo administradores pueden editar criaturas' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const criaturaId = parseInt(id);
    if (isNaN(criaturaId)) {
      return NextResponse.json(
        { error: 'ID de criatura inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      clasificacion,
      tipo,
      danio_base,
      germinacion,
      descripcion,
      apariencia,
      observaciones,
      forma_ser,
      habilidades,
      depredadores
    } = body;

    // Validar campos requeridos
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la criatura existe
    const criaturaExistente = await prisma.criatura.findUnique({
      where: { id: criaturaId }
    });

    if (!criaturaExistente) {
      return NextResponse.json(
        { error: 'Criatura no encontrada' },
        { status: 404 }
      );
    }

    const habilidadesInput = Array.isArray(habilidades)
      ? habilidades
          .filter((habilidad: any) => habilidad?.nombre?.trim())
          .map((habilidad: any) => ({
            nombre: habilidad.nombre.trim(),
            descripcion: habilidad.descripcion?.trim() || null
          }))
      : [];

    const habilidadesUnicas = Array.from(
      new Map(
        habilidadesInput.map((habilidad) => [habilidad.nombre.toLowerCase(), habilidad])
      ).values()
    );

    const depredadoresInput = Array.isArray(depredadores)
      ? depredadores
          .map((depredador: any) => depredador?.descripcion?.trim() || depredador?.trim())
          .filter(Boolean)
      : [];

    const habilidadIds: number[] = [];
    for (const habilidad of habilidadesUnicas) {
      let habilidadExistente = await prisma.habilidad.findFirst({
        where: {
          nombre: habilidad.nombre
        }
      });

      if (!habilidadExistente) {
        habilidadExistente = await prisma.habilidad.create({
          data: {
            nombre: habilidad.nombre,
            descripcion: habilidad.descripcion
          }
        });
      }

      if (habilidadExistente) {
        habilidadIds.push(habilidadExistente.id);
      }
    }

    await prisma.$transaction([
      prisma.criatura.update({
        where: { id: criaturaId },
        data: {
          nombre: nombre.trim(),
          clasificacion: clasificacion?.trim() || null,
          tipo: tipo || undefined,
          danio_base: typeof danio_base === 'number' ? danio_base : null,
          germinacion: germinacion?.trim() || null,
          descripcion: descripcion?.trim() || null,
          apariencia: apariencia?.trim() || null,
          observaciones: observaciones?.trim() || null,
          forma_ser: forma_ser?.trim() || null
        }
      }),
      prisma.criaturaHabilidad.deleteMany({
        where: { criatura_id: criaturaId }
      }),
      prisma.criaturaDepredador.deleteMany({
        where: { criatura_id: criaturaId }
      })
    ]);

    if (habilidadIds.length > 0) {
      await prisma.criaturaHabilidad.createMany({
        data: habilidadIds.map((habilidad_id) => ({
          criatura_id: criaturaId,
          habilidad_id
        }))
      });
    }

    if (depredadoresInput.length > 0) {
      await prisma.criaturaDepredador.createMany({
        data: depredadoresInput.map((descripcion) => ({
          criatura_id: criaturaId,
          descripcion
        }))
      });
    }

    const criaturaActualizada = await prisma.criatura.findUnique({
      where: { id: criaturaId },
      include: {
        habilidades: {
          include: {
            habilidad: true
          }
        },
        depredadores: true
      }
    });

    return NextResponse.json(
      { criatura: criaturaActualizada, message: 'Criatura actualizada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error actualizando criatura:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar que el usuario sea administrador
    const userSession = request.cookies.get('userSession');
    if (!userSession) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = userSession.value;
    const user = await prisma.usuarios.findUnique({
      where: { correo: userEmail },
      select: { rol: true }
    });

    if (!user || user.rol !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo administradores pueden eliminar criaturas' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const criaturaId = parseInt(id);
    if (isNaN(criaturaId)) {
      return NextResponse.json(
        { error: 'ID de criatura inválido' },
        { status: 400 }
      );
    }

    // Verificar que la criatura existe
    const criaturaExistente = await prisma.criatura.findUnique({
      where: { id: criaturaId }
    });

    if (!criaturaExistente) {
      return NextResponse.json(
        { error: 'Criatura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si la criatura está siendo usada en algún semillero
    const semillerosConCriatura = await prisma.semilleroCriatura.findMany({
      where: { criatura_id: criaturaId }
    });

    if (semillerosConCriatura.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la criatura porque está siendo usada en semilleros' },
        { status: 400 }
      );
    }

    // Eliminar la criatura
    await prisma.criatura.delete({
      where: { id: criaturaId }
    });

    return NextResponse.json(
      { message: 'Criatura eliminada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error eliminando criatura:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}