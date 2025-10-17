# Auth Service

Microservicio de autenticación y gestión de usuarios construido con Node.js, Express, JWT y MongoDB (Mongoose). Expone endpoints para registro, login, validación de token, obtención de perfil y renovación de token.

- Stack: Node.js, Express, JWT, Mongoose, Passport (Local), bcrypt/bcryptjs
- Entrada: `index.js`
- Rutas base: `/api/auth` y `/api/user`

## Características

- Registro de usuarios con hash seguro de contraseña (bcrypt/bcryptjs).
- Login con emisión de token JWT (HS256, expira en 15 min).
- Middleware de autenticación con validación de token en cabecera `Authorization: Bearer <token>`.
- Validación de token y obtención de perfil del usuario autenticado.
- Renovación (refresh) de token JWT.
- UUID por usuario (sin guiones) generado automáticamente.
- Listo para correr con Docker.

## Requisitos

- Node.js >= 18 (recomendado 20)
- npm >= 8
- MongoDB accesible (local o Atlas)

## Variables de entorno

Cree un archivo `.env` en la raíz del proyecto con al menos:

```
MONGO_URI=mongodb://<usuario>:<password>@<host>:<puerto>/<db>?authSource=admin
JWT_SECRET=una_clave_segura_y_larga
PORT=4000
```

Notas:

- `MONGO_URI` debe apuntar a su instancia de MongoDB.
- `JWT_SECRET` debe ser suficientemente robusta; no la comparta.
- `PORT` es opcional; por defecto `4000`.

## Instalación y ejecución local

1. Instalar dependencias
   ```bash
   npm install
   ```
2. Configurar `.env` (ver sección anterior).
3. Ejecutar en desarrollo (con recarga en caliente):
   ```bash
   npm run dev
   ```
4. Ejecutar en producción:
   ```bash
   npm start
   ```

La API quedará disponible en `http://localhost:4000` (o el puerto configurado).

## Ejecución con Docker

Construir imagen y ejecutar el contenedor:

```bash
# Construir
docker build -t auth-service:latest .

# Ejecutar (pasando variables de entorno)
docker run -p 4000:4000 \
  -e MONGO_URI="mongodb://host.docker.internal:27017/authdb" \
  -e JWT_SECRET="una_clave_segura_y_larga" \
  --name auth-service \
  auth-service:latest
```

Ajuste `MONGO_URI` según su entorno (p. ej., MongoDB local o Atlas).

## Estructura del proyecto

```
.
├─ Dockerfile
├─ index.js
├─ database.js
├─ package.json
├─ routes/
│  ├─ auth.js
│  └─ user.js
├─ models/
│  └─ user.js
├─ middleware/
│  └─ auth.js
└─ config/
   └─ passport.js
```

## Modelo de Usuario

Ubicación: `models/user.js`

Campos principales:

- `uuid`: string (uuid v4 sin guiones), único.
- `firstname`, `lastname`: string, requeridos.
- `username`: string, requerido y único.
- `password`: string (hash), requerido en registro.
- `firstlogin`: boolean, por defecto `true`.
- `status`: boolean, por defecto `true`.
- `role`: string, requerido.
- `createdby`, `updatedby`: string.
- `createdat`, `updatedat`: fechas (por defecto `Date.now`).

Hooks y métodos:

- `pre('save')`: genera `salt` y hashea `password` (bcryptjs).
- `matchPassword(enteredPassword)`: compara contraseña (bcryptjs).

## Endpoints

Base URL por defecto: `http://localhost:4000`

### Auth

Ruta base: `/api/auth`

1. Registro

- Método: `POST`
- URL: `/api/auth/register`
- Body (JSON):
  ```json
  {
    "firstname": "Ada",
    "lastname": "Lovelace",
    "username": "ada",
    "password": "secret",
    "role": "admin"
  }
  ```
- Respuesta 201 (ejemplo):
  ```json
  {
    "result": true,
    "message": "Usuario creado exitosamente",
    "user": {
      "uuid": "...",
      "username": "ada",
      "firstname": "Ada",
      "lastname": "Lovelace",
      "role": "admin"
    }
  }
  ```

2. Login

- Método: `POST`
- URL: `/api/auth/login`
- Body (JSON):
  ```json
  {
    "username": "ada",
    "password": "secret"
  }
  ```
- Respuesta 200 (ejemplo):
  ```json
  {
    "result": true,
    "message": "Login exitoso",
    "token": "<jwt>",
    "user": {
      "uuid": "...",
      "username": "ada",
      "firstname": "Ada",
      "lastname": "Lovelace",
      "role": "admin"
    }
  }
  ```
- Notas JWT: algoritmo `HS256`, `expiresIn: 15m`, `issuer: "http://auth-service:4000"`, `audience: "http://api-gateway:5000"`.

3. Validar Token

- Método: `GET`
- URL: `/api/auth/validate`
- Headers: `Authorization: Bearer <token>`
- Respuesta 200 (ejemplo):
  ```json
  {
    "result": true,
    "message": "Token válido",
    "user": {
      "uuid": "...",
      "username": "ada",
      "firstname": "Ada",
      "lastname": "Lovelace",
      "role": "admin"
    }
  }
  ```

4. Mi Perfil

- Método: `GET`
- URL: `/api/auth/me`
- Headers: `Authorization: Bearer <token>`
- Respuesta 200 (ejemplo):
  ```json
  {
    "result": true,
    "user": {
      "uuid": "...",
      "username": "ada",
      "firstname": "Ada",
      "lastname": "Lovelace",
      "role": "admin"
    }
  }
  ```

5. Refresh Token

- Método: `POST`
- URL: `/api/auth/refresh`
- Headers: `Authorization: Bearer <token>` (debe ser un token válido no expirado o según su política)
- Respuesta 200 (ejemplo):
  ```json
  {
    "result": true,
    "message": "Token renovado",
    "token": "<nuevo_jwt>"
  }
  ```

### User

Ruta base: `/api/user`

1. Perfil (Ruta de ejemplo protegida)

- Método: `GET`
- URL: `/api/user/profile`
- Headers: `Authorization: Bearer <token>`
- Respuesta 200 (ejemplo):
  ```json
  {
    "message": "Ruta protegida",
    "user": {
      /* contenido del token decodificado */
    }
  }
  ```

## Ejemplos con curl

Registro:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Ada",
    "lastname": "Lovelace",
    "username": "ada",
    "password": "secret",
    "role": "admin"
  }'
```

Login:

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "ada", "password": "secret"}' | jq -r .token)
```

Validar token:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/auth/validate
```

Perfil protegido:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/user/profile
```

Refresh token:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/auth/refresh
```

## Seguridad y buenas prácticas

- Mantenga `JWT_SECRET` privado y largo. Considere rotación de claves si aplica.
- Los tokens expiran en 15 minutos; use el endpoint de refresh para renovar.
- Transmita tokens únicamente sobre HTTPS.
- Este servicio no incluye rate limiting ni bloqueo por intentos fallidos; evalúe añadirlos en entornos productivos.
- Dependencias: se usan tanto `bcrypt` (en `routes/auth.js`) como `bcryptjs` (en `models/user.js`). Esto funciona, pero podría unificarse para simplificar mantenimiento.

## Scripts disponibles

- `npm run dev`: inicia el servidor con `nodemon`.
- `npm start`: inicia el servidor con Node.

## Notas de implementación

- Conexión a BD: `database.js` usa `MONGO_URI` desde `.env`.
- Middleware JWT: `middleware/auth.js` valida el token y rellena `req.user` con el payload.
- Passport local: `config/passport.js` define estrategia local y (de ser usado) serialización; actualmente las rutas principales trabajan con JWT.
- Servidor: `index.js` monta rutas `/api/auth` y `/api/user` y expone el puerto `PORT`.

## Licencia

ISC (ver `package.json`).
