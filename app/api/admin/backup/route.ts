import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { isAdmin } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const p = prisma as any;
    const data = {
      usuarios: await p.usuarios.findMany(),
      semilleros: await p.semillero.findMany(),
      presets: await p.preset.findMany(),
      preset_criaturas: await p.presetCriatura.findMany(),
      criaturas: await p.criatura.findMany(),
      habilidades: await p.habilidad.findMany(),
      criatura_habilidades: await p.criaturaHabilidad.findMany(),
      criatura_depredadores: await p.criaturaDepredador.findMany(),
      semillero_criaturas: await p.semilleroCriatura.findMany(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    console.log(`[SYSTEM] Copia de seguridad generada correctamente.`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
