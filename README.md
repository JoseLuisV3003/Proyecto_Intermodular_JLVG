# JOSÉ LUIS VALVERDE GALLEGO
# Semillero - Next.js + Prisma + MySQL

Proyecto web con **Next.js**, **Prisma ORM** y **MySQL en Docker**.

## Requisitos

- Node.js >= 18
- Docker & Docker Compose

## Arranque rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env con las variables (ver tabla abajo)

# 3. Levantar base de datos
docker-compose up -d

# 4. Sincronizar BD
npx prisma db push

# 5. Arrancar aplicación
npm run dev
```

## Puertos

| Servicio | Puerto |
|----------|--------|
| Next.js | 3000 |
| MySQL | 3306 |

## Variables (.env)

```env
MYSQL_ROOT_PASSWORD=root_pass
MYSQL_DATABASE=semillero_db
MYSQL_USER=semillero_user
MYSQL_PASSWORD=user_pass
DATABASE_URL=mysql://semillero_user:user_pass@localhost:3306/semillero_db
```

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build
npm start            # Producción
npx prisma studio   # Ver BD
docker-compose down # Detener BD
```
