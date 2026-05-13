import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { validatePassword, validateEmail } from '../../lib/validation';
import { isAdmin } from '../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const usuarios = await prisma.usuarios.findMany({
      select: {
        correo: true,
        usuario: true,
        rol: true,
      },
    });

    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);

    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { correo, usuario, password, rol } = body;

    // Validar formato del correo
    const emailValidation = validateEmail(correo);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.message },
        { status: 400 }
      );
    }

    // Validar complejidad de la contraseña
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { correo }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta vinculada a este correo electrónico' },
        { status: 409 }
      );
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = await prisma.usuarios.findFirst({
      where: { usuario }
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya está en uso' },
        { status: 409 }
      );
    }

    // Seguridad: Solo un administrador puede crear usuarios con roles específicos.
    // Si no es admin, forzamos el rol a 'usuario'.
    let finalRol = 'usuario';
    if (rol === 'administrador' && await isAdmin(request)) {
      finalRol = 'administrador';
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.usuarios.create({
      data: {
        correo,
        usuario,
        password: hashedPassword,
        rol: finalRol as any,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}