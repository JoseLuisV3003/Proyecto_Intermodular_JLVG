import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getUserSession } from '../../lib/auth';


export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;

    // Obtener el usuario
    const user = await prisma.usuarios.findUnique({
      where: {
        correo: userEmail
      },
      select: {
        correo: true,
        usuario: true,
        rol: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = session.correo as string;

    // Eliminar el usuario (Prisma se encargará de cascada según el schema)
    await prisma.usuarios.delete({
      where: {
        correo: userEmail
      }
    });

    // Crear respuesta y limpiar la cookie de sesión
    const response = NextResponse.json({ message: 'Cuenta eliminada correctamente' });
    response.cookies.set('userSession', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la cuenta' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { usuario } = await request.json();
    if (!usuario) {
      return NextResponse.json({ error: 'El nombre de usuario es requerido' }, { status: 400 });
    }

    // Validar caracteres especiales y longitud
    const nameRegex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]*$/;
    if (!nameRegex.test(usuario) || usuario.length > 25) {
      return NextResponse.json({ error: 'Nombre de usuario inválido (máx 25 caracteres, sin símbolos)' }, { status: 400 });
    }

    // Verificar si el nombre de usuario ya está en uso por otro usuario
    const existingUsername = await prisma.usuarios.findFirst({
      where: { 
        usuario,
        NOT: {
          correo: session.correo as string
        }
      }
    });

    if (existingUsername) {
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 409 });
    }

    await prisma.usuarios.update({
      where: { correo: session.correo as string },
      data: { usuario }
    });

    return NextResponse.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 });
  }
}