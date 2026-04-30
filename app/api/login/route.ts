import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar que los campos no estén vacíos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo/Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el usuario por correo o usuario
    const user = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { correo: email },
          { usuario: email }
        ]
      }
    });

    // Verificar si el usuario existe
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario o correo no encontrado' },
        { status: 401 }
      );
    }

    // Verificar la contraseña
    // Nota: En producción, deberías usar hashing (bcrypt, argon2, etc.)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear la respuesta exitosa con redirección
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        user: {
          correo: user.correo,
          usuario: user.usuario,
          rol: user.rol
        }
      },
      { status: 200 }
    );

    // Establecer cookie con información del usuario (opcional)
    response.cookies.set('userSession', user.correo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
