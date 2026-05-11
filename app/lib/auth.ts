import { NextRequest } from 'next/server';
import { prisma } from './prisma';

export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const userSession = request.cookies.get('userSession');
    if (!userSession) return false;

    const userEmail = userSession.value;

    const user = await prisma.usuarios.findUnique({
      where: { correo: userEmail },
      select: { rol: true }
    });

    return user?.rol === 'administrador';
  } catch (error) {
    console.error('Error in isAdmin check:', error);
    return false;
  }
}
