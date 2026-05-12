import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clave-secreta-por-defecto-cambiame'
);

export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getUserSession(request: NextRequest) {
  const userSession = request.cookies.get('userSession');
  if (!userSession) return null;

  const payload = await verifyToken(userSession.value);
  if (!payload || !payload.correo) return null;

  return payload;
}


export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const userSession = request.cookies.get('userSession');
    if (!userSession) return false;

    const payload = await verifyToken(userSession.value);
    if (!payload || !payload.correo) return false;

    const user = await prisma.usuarios.findUnique({
      where: { correo: payload.correo as string },
      select: { rol: true }
    });

    return user?.rol === 'administrador';
  } catch (error) {
    console.error('Error in isAdmin check:', error);
    return false;
  }
}

