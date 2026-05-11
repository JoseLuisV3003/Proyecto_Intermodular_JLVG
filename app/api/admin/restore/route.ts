import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { isAdmin } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const backupData = await request.json();

    // Validar estructura básica
    if (!backupData.usuarios || !backupData.criaturas) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    // Ejecutar en una transacción para asegurar integridad
    await prisma.$transaction(async (txOrig) => {
      const tx = txOrig as any;
      // 1. Limpiar todas las tablas (Orden importa por FKs si no usamos TRUNCATE)
      // Gracias al onDelete: Cascade, podemos ser un poco más agresivos,
      // pero para evitar problemas de índices y dependencias circulares:
      await tx.presetCriatura.deleteMany();
      await tx.semilleroCriatura.deleteMany();
      await tx.criaturaHabilidad.deleteMany();
      await tx.criaturaDepredador.deleteMany();
      await tx.preset.deleteMany();
      await tx.semillero.deleteMany();
      await tx.habilidad.deleteMany();
      await tx.criatura.deleteMany();
      await tx.usuarios.deleteMany();

      // 2. Insertar datos (Orden importa)
      // Usuarios
      await tx.usuarios.createMany({ data: backupData.usuarios });
      
      // Criaturas y Habilidades
      await tx.criatura.createMany({ data: backupData.criaturas });
      await tx.habilidad.createMany({ data: backupData.habilidades });
      
      // Relaciones de Criaturas
      await tx.criaturaHabilidad.createMany({ data: backupData.criatura_habilidades });
      await tx.criaturaDepredador.createMany({ data: backupData.criatura_depredadores });

      // Semilleros
      await tx.semillero.createMany({ data: backupData.semilleros });
      await tx.semilleroCriatura.createMany({ data: backupData.semillero_criaturas });

      // Presets
      await tx.preset.createMany({ data: backupData.presets });
      await tx.presetCriatura.createMany({ data: backupData.preset_criaturas });
    });

    return NextResponse.json({ message: 'System restored successfully' });
  } catch (error) {
    console.error('Restore Error:', error);
    return NextResponse.json({ error: 'Failed to restore system', details: String(error) }, { status: 500 });
  }
}
