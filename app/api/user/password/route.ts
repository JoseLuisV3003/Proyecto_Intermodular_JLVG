import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getUserSession } from '../../../lib/auth';
import bcrypt from 'bcrypt';
import { validatePassword } from '../../../lib/validation';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    if (!session || !session.correo) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    // 1. Obtener usuario de la DB
    const user = await prisma.usuarios.findUnique({
      where: { correo: session.correo as string }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Verificar contraseña actual
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    // 3. Validar nueva contraseña
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    // 4. Hashear y actualizar
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.usuarios.update({
      where: { correo: session.correo as string },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
