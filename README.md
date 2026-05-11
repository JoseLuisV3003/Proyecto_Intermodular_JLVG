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

Copia `.env.example` a `.env` y configura las variables con tus valores seguros:

```env
MYSQL_ROOT_PASSWORD=tu_contraseña_segura_aquí
MYSQL_DATABASE=nombre_de_tu_base_de_datos
MYSQL_USER=tu_usuario_db
MYSQL_PASSWORD=tu_contraseña_db_segura
DATABASE_URL=mysql://tu_usuario_db:tu_contraseña_db_segura@localhost:3306/nombre_de_tu_base_de_datos
```

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build
npm start            # Producción
npx prisma studio   # Ver BD
docker-compose down # Detener BD
```

## Criterios de Éxito del MVP

### Funcionalidades Implementadas
- **Registro de usuarios**: API para crear cuentas con correo, usuario y contraseña
- **Login de usuarios**: Autenticación con correo/usuario y contraseña
- **Dashboard protegido**: Seguridad básica para que no se pueda acceder al dashboard por enlace sin haber iniciado sesión
- **Base de datos MySQL**: Persistencia de datos con Prisma ORM
- **Contenedorización**: Docker Compose para entorno reproducible

### Verificación Paso a Paso

Sigue estos pasos para verificar que el MVP funciona correctamente:

#### 1. Preparar el Entorno
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (no uses contraseñas reales en ejemplos)

# Levantar base de datos
docker-compose up -d

# Esperar a que MySQL esté listo (unos segundos)
# Sincronizar esquema de BD
npx prisma db push
```

#### 2. Arrancar la Aplicación
```bash
npm run dev
```
- **Resultado esperado**: App corriendo en http://localhost:3000 

#### 3. Probar Registro de Usuario
```bash
# Usar curl para registrar un usuario
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"correo":"test@example.com","usuario":"testuser","password":"password123"}'
```
- **Resultado esperado**: Respuesta 201 con datos del usuario creado

#### 4. Probar Login
```bash
# Usar curl para hacer login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"test@example.com","password":"password123"}'
```
- **Resultado esperado**: Respuesta 200 con mensaje "Login exitoso" y datos del usuario

#### 5. Verificar Dashboard
- Abre http://localhost:3000/dashboard en el navegador
- **Resultado esperado**: Página accesible (protegida debe cargar)

#### 6. Verificar Base de Datos
```bash
# Ver usuarios en BD
npx prisma studio
```
- **Resultado esperado**: Usuario registrado visible en la tabla `usuarios`

### Notas de Seguridad
- Las contraseñas se almacenan hasheadas con bcrypt (implementado en el código)
- No se muestran contraseñas reales en logs, documentación o capturas
- Variables de entorno configuradas correctamente para evitar exposición de credenciales

## JUSTIFICACIONES

-NextJS - Me permitia desarrollar el el Frontend y Backend en el mismo proyecto y usando APIRoutes (También, nos lo recomendó un programador senior que vino a nuestra empresa de prácticas)

-Prisma - Además de que facilita las comunicaciones con la BD, me evita las consultas MySQL para las modificaciones (Y también me lo recomendó el mismo senior)

-MySQL - Es la que se nos ha dado desde que hemos empezado DAW hace ya casi 2 años

-Docker - Porque permite crear entornos de BD reproducibles que funcionan en cualquier máquina... Y porque nos lo pediste como un requisito

-BCrypt - Porque hashea las contraseñas asegurándose de que jamás se guarden en texto plano

-Cloudinary - Para subir las imágenes por enlace a la nube