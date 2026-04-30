import { prisma } from '../../lib/prisma';

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

    const newUser = await prisma.usuarios.create({
      data: {
        correo,
        usuario,
        password,
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