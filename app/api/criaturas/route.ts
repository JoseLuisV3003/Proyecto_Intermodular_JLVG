import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { isAdmin } from '../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Buscar criaturas por nombre si se recibe un filtro
    const search = request.nextUrl.searchParams.get('search')?.trim();
    const where = search
      ? {
          nombre: {
            contains: search,
            mode: 'insensitive'
          }
        }
      : undefined;

    // Obtener todas las criaturas con sus habilidades y depredadores
    const criaturas = await prisma.criatura.findMany({
      where,
      include: {
        habilidades: {
          include: {
            habilidad: true
          }
        },
        depredadores: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Transformar los datos para el frontend
    const criaturasFormatted = criaturas.map(criatura => ({
      id: criatura.id,
      nombre: criatura.nombre,
      clasificacion: criatura.clasificacion,
      danio_base: criatura.danio_base,
      germinacion: criatura.germinacion,
      descripcion: criatura.descripcion,
      apariencia: criatura.apariencia,
      observaciones: criatura.observaciones,
      forma_ser: criatura.forma_ser,
      tipo: criatura.tipo,
      tipo_ataque: criatura.tipo_ataque,
      HabilidadAtaque: criatura.HabilidadAtaque,
      HabilidadDefensa: criatura.HabilidadDefensa,
      PuntosVitales: criatura.PuntosVitales,
      AlturaCM: criatura.AlturaCM,
      habilidades: criatura.habilidades.map(ch => ({
        id: ch.habilidad.id,
        nombre: ch.habilidad.nombre,
        descripcion: ch.habilidad.descripcion
      })),
      depredadores: criatura.depredadores
    }));

    return NextResponse.json({ criaturas: criaturasFormatted });
  } catch (error) {
    console.error('Error obteniendo criaturas:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear criaturas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      clasificacion,
      tipo,
      tipo_ataque,
      danio_base,
      germinacion,
      descripcion,
      apariencia,
      observaciones,
      forma_ser,
      habilidades,
      depredadores,
      HabilidadAtaque,
      HabilidadDefensa,
      PuntosVitales,
      AlturaCM
    } = body;

    // Validar campos requeridos
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
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
          .map((depredador: any) => depredador?.trim())
          .filter(Boolean)
      : [];

    const habilidadesRelacion = [] as Array<any>;

    for (const habilidad of habilidadesUnicas) {
      const habilidadExistente = await prisma.habilidad.findFirst({
        where: {
          nombre: habilidad.nombre
        }
      });

      if (habilidadExistente) {
        habilidadesRelacion.push({
          habilidad: {
            connect: {
              id: habilidadExistente.id
            }
          }
        });
      } else {
        habilidadesRelacion.push({
          habilidad: {
            create: {
              nombre: habilidad.nombre,
              descripcion: habilidad.descripcion
            }
          }
        });
      }
    }

    const data: any = {
      nombre: nombre.trim(),
      clasificacion: clasificacion?.trim() || null,
      tipo: tipo || undefined,
      tipo_ataque: tipo_ataque || null,
      danio_base: typeof danio_base === 'number' ? danio_base : null,
      germinacion: germinacion?.trim() || null,
      descripcion: descripcion?.trim() || null,
      apariencia: apariencia?.trim() || null,
      observaciones: observaciones?.trim() || null,
      forma_ser: forma_ser?.trim() || null,
      HabilidadAtaque: typeof HabilidadAtaque === 'number' ? HabilidadAtaque : null,
      HabilidadDefensa: typeof HabilidadDefensa === 'number' ? HabilidadDefensa : null,
      PuntosVitales: typeof PuntosVitales === 'number' ? PuntosVitales : null,
      AlturaCM: typeof AlturaCM === 'number' ? AlturaCM : null
    };

    if (habilidadesRelacion.length > 0) {
      data.habilidades = {
        create: habilidadesRelacion
      };
    }

    if (depredadoresInput.length > 0) {
      data.depredadores = {
        create: depredadoresInput.map((descripcion: string) => ({ descripcion }))
      };
    }

    const nuevaCriatura = await prisma.criatura.create({
      data,
      include: {
        habilidades: {
          include: {
            habilidad: true
          }
        },
        depredadores: true
      }
    });

    console.log(`[ADMIN] Nueva criatura creada: "${nuevaCriatura.nombre}" (ID: ${nuevaCriatura.id})`);

    return NextResponse.json(
      { criatura: nuevaCriatura, message: 'Criatura creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando criatura:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}