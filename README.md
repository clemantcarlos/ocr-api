<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tesseract.js-5-00BFFF?style=for-the-badge&logo=tesseract&logoColor=white" alt="Tesseract.js" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
</p>

<h1 align="center">🪪 ali-api</h1>

<p align="center">
  <strong>RESTful API — Authentication & Document OCR</strong><br />
  Construido con NestJS, Prisma y PostgreSQL. Autenticación JWT + API keys, y reconocimiento óptico de caracteres (OCR) sobre facturas venezolanas.
</p>

<p align="center">
  <a href="#✨-features">Features</a> •
  <a href="#📐-architecture">Architecture</a> •
  <a href="#🚀-quick-start">Quick Start</a> •
  <a href="#📚-api-docs">API Docs</a> •
  <a href="#📂-project-structure">Structure</a> •
  <a href="#🧪-testing">Testing</a>
</p>

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Registro e inicio de sesión** con email y contraseña (bcrypt + JWT)
- **Access tokens** (15 min) y **refresh tokens** (7 días) con rotación segura
- **API keys** programables (`ali_…`) — crea, lista y revoca llaves para integraciones
- Guard global con fallback automático: JWT → API Key

### 📄 OCR Inteligente
- Sube facturas/recibos en **PDF**, se convierten a imagen y se extrae texto mediante **Tesseract.js**
- Regiones de extracción predefinidas para documentos venezolanos:
  - **Digitel** — facturas de telefonía
  - **Banesco** — pago a terceros
- Validación de archivos: solo PDF, máximo 5 MB

### 📋 API Documentada
- Swagger UI interactivo en `/api`

---

## 📐 Architecture

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ JWT Bearer │ x-api-key  │
              └──────┬─────┴─────┬──────┘
                     │           │
              ┌──────▼───────────▼──────┐
              │   AtGuard (global)      │
              │   JWT Strategy  │       │
              │   API Key Strat│       │
              └──────┬──────────────────┘
                     │
              ┌──────▼──────────────────┐
              │     NestJS App          │
              │  ┌─────┐  ┌─────────┐  │
              │  │Auth │  │   OCR   │  │
              │  │Module│  │ Module  │  │
              │  └──┬──┘  └────┬────┘  │
              │     │          │        │
              │  ┌──▼──────────▼────┐  │
              │  │  PrismaModule    │  │
              │  │  (PostgreSQL)    │  │
              │  └─────────────────┘  │
              └───────────────────────┘
```

**Stack:**
- **NestJS 11** — framework modular con inyección de dependencias
- **Prisma 7** — ORM tipado con PostgreSQL
- **Passport.js** — estrategias JWT (access + refresh)
- **Tesseract.js** — OCR en español
- **pdf2pic** — conversión PDF → PNG
- **Swagger** — documentación automática de endpoints

---

## 🚀 Quick Start

### Prerrequisitos
- Node.js ≥ 20
- PostgreSQL
- npm

### Instalación

```bash
git clone https://github.com/tu-usuario/ali-api.git
cd ali-api

npm install

# Configurar variables de entorno
cp .env.example .env
# Editar DATABASE_URL con tu conexión PostgreSQL

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run start:dev
```

La API estará disponible en `http://localhost:3000` y Swagger en `http://localhost:3000/api`.

---

## 📚 API Docs

| Método | Endpoint                | Auth       | Descripción                           |
|--------|------------------------|------------|---------------------------------------|
| POST   | `/auth/local/signup`   | ❌ Público | Registrar nuevo usuario               |
| POST   | `/auth/local/signin`   | ❌ Público | Iniciar sesión → tokens               |
| POST   | `/auth/logout`         | ✅ JWT     | Cerrar sesión                         |
| POST   | `/auth/refresh`        | ✅ Refresh | Renovar token pair                    |
| POST   | `/auth/api-keys`       | ✅ JWT     | Crear API key                         |
| GET    | `/auth/api-keys`       | ✅ JWT     | Listar API keys del usuario           |
| DELETE | `/auth/api-keys/:id`   | ✅ JWT     | Revocar API key                       |
| POST   | `/ocr/upload`          | ✅ Auth*   | Subir PDF y extraer texto con OCR     |

_\* El endpoint OCR tiene `@Public()` pero requiere API key o autenticación según configuración._

Todas las respuestas siguen el formato:
```json
{
  "success": true,
  "data": { … }
}
```

---

## 📂 Project Structure

```
src/
├── main.ts                     # Bootstrap: NestFactory, Swagger, CORS
├── app.module.ts               # Módulo raíz
├── interfaces/                 # Tipos genéricos de respuesta
├── types/                      # Tipos compartidos
├── utils/                      # Helpers (regex, hash, imágenes)
├── prisma/
│   ├── prisma.module.ts        # Módulo global de Prisma
│   └── prisma.service.ts       # Cliente Prisma + Pool PostgreSQL
└── modules/
    ├── auth/                   # Autenticación + API keys
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/                # DTOs de entrada
    │   ├── strategies/         # Passport strategies (JWT)
    │   └── common/
    │       ├── decorators/     # @Public(), @GetCurrentUser()
    │       └── guards/         # AtGuard, RtGuard
    └── ocr/                    # OCR sobre PDFs
        ├── ocr.controller.ts
        ├── ocr.service.ts
        ├── dto/
        └── pipes/              # Validación de archivos

prisma/
└── schema.prisma               # Modelos User + ApiKey
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Linting
npm run lint
```

---

## 🛣️ Roadmap / Próximos pasos

- [ ] Mover JWT secrets a variables de entorno
- [ ] Implementar roles de usuario (`UserRole`)
- [ ] Pipeline CI/CD (GitHub Actions + Docker)
- [ ] Más formatos de documento OCR
- [ ] Paginación en listado de API keys

---

## 📄 Licencia

MIT
