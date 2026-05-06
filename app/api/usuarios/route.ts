import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        correo: true,
        usuario: true,
        rol: true,
      },
    });

    return Response.json(usuarios, { status: 200 });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);

    return Response.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { correo, usuario, password, rol } = body;

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.usuarios.create({
      data: {
        correo,
        usuario,
        password: hashedPassword,
        rol: rol ?? 'usuario',
      },
    });

    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}