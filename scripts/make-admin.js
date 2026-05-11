import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    // Cambiar el primer usuario a administrador para pruebas
    const user = await prisma.usuarios.updateMany({
      where: {
        rol: 'usuario'
      },
      data: {
        rol: 'administrador'
      }
    });

    console.log('Usuario(s) actualizado(s) a administrador');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();