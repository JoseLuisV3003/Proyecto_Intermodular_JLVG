// Script para poblar la base de datos con criaturas de ejemplo
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Poblando base de datos con criaturas de ejemplo...');

  // Crear habilidades
  const habilidad1 = await prisma.habilidad.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Vuelo',
      descripcion: 'Permite volar por los aires'
    }
  });

  const habilidad2 = await prisma.habilidad.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nombre: 'Veneno',
      descripcion: 'Puede envenenar a sus presas'
    }
  });

  const habilidad3 = await prisma.habilidad.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      nombre: 'Regeneración',
      descripcion: 'Puede regenerar partes de su cuerpo'
    }
  });

  // Crear criaturas
  const criatura1 = await prisma.criatura.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Dragón de Fuego',
      clasificacion: 'Mitológica',
      danio_base: 150,
      germinacion: 'Eclosiona de huevos gigantes en volcanes',
      descripcion: 'Criatura legendaria que escupe fuego y domina los cielos',
      apariencia: 'Escamas rojas brillantes, alas membranosas, cuernos curvos',
      observaciones: 'Extremadamente territorial y peligroso',
      forma_ser: 'Ser vivo inteligente con capacidades mágicas'
    }
  });

  const criatura2 = await prisma.criatura.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nombre: 'Araña Gigante',
      clasificacion: 'Arácnido',
      danio_base: 45,
      germinacion: 'Eclosiona de sacos de huevos en telarañas',
      descripcion: 'Araña de tamaño excepcional con veneno paralizante',
      apariencia: 'Pelaje negro con manchas rojas, ocho patas largas',
      observaciones: 'Teje telarañas resistentes como el acero',
      forma_ser: 'Artrópodo con instintos depredadores'
    }
  });

  const criatura3 = await prisma.criatura.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      nombre: 'Fénix Renacido',
      clasificacion: 'Mitológica',
      danio_base: 120,
      germinacion: 'Renace de sus cenizas cada 500 años',
      descripcion: 'Ave inmortal que se regenera del fuego',
      apariencia: 'Plumaje rojo dorado, cola larga con plumas iridiscentes',
      observaciones: 'Simboliza la renovación y el ciclo de la vida',
      forma_ser: 'Ser espiritual con esencia de fuego puro'
    }
  });

  const criatura4 = await prisma.criatura.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      nombre: 'Lobo Espectral',
      clasificacion: 'Sobrenatural',
      danio_base: 80,
      germinacion: 'Aparece durante las noches de luna llena',
      descripcion: 'Lobo translúcido que puede atravesar objetos sólidos',
      apariencia: 'Pelaje plateado transparente, ojos rojos brillantes',
      observaciones: 'Solo visible bajo la luz de la luna',
      forma_ser: 'Espíritu animal con forma física temporal'
    }
  });

  // Asignar habilidades a criaturas
  await prisma.criaturaHabilidad.upsert({
    where: { criatura_id_habilidad_id: { criatura_id: 1, habilidad_id: 1 } },
    update: {},
    create: { criatura_id: 1, habilidad_id: 1 }
  });

  await prisma.criaturaHabilidad.upsert({
    where: { criatura_id_habilidad_id: { criatura_id: 2, habilidad_id: 2 } },
    update: {},
    create: { criatura_id: 2, habilidad_id: 2 }
  });

  await prisma.criaturaHabilidad.upsert({
    where: { criatura_id_habilidad_id: { criatura_id: 3, habilidad_id: 3 } },
    update: {},
    create: { criatura_id: 3, habilidad_id: 3 }
  });

  await prisma.criaturaHabilidad.upsert({
    where: { criatura_id_habilidad_id: { criatura_id: 4, habilidad_id: 1 } },
    update: {},
    create: { criatura_id: 4, habilidad_id: 1 }
  });

  // Crear depredadores
  await prisma.criaturaDepredador.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      criatura_id: 1,
      descripcion: 'Cazadores de dragones profesionales'
    }
  });

  await prisma.criaturaDepredador.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      criatura_id: 2,
      descripcion: 'Pájaros grandes y aves rapaces'
    }
  });

  await prisma.criaturaDepredador.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      criatura_id: 3,
      descripcion: 'No tiene depredadores naturales debido a su capacidad de renacer'
    }
  });

  console.log('✅ Base de datos poblada exitosamente!');
  console.log('Criaturas creadas:', [criatura1.nombre, criatura2.nombre, criatura3.nombre, criatura4.nombre]);
}

main()
  .catch((e) => {
    console.error('❌ Error poblando la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });