<div align="center">

🔍 OCR API — Document OCR with NestJS

RESTful API for authentication and document OCR text extraction from Venezuelan invoices

[!TypeScript](https://www.typescriptlang.org/)
[!NestJS](https://nestjs.com/)
[!Prisma](https://www.prisma.io/)
[!PostgreSQL](https://www.postgresql.org/)
[!Tesseract.js](https://tesseract.projectnaptha.com/)
[!Swagger](https://swagger.io/)
[!License](LICENSE)

</div>

> ⚠️ Work in Progress — This project is actively under development. Some features are incomplete or still under development.

***

## 📋 About the Project

OCR API is a RESTful API built with NestJS that provides authentication and document OCR (Optical Character Recognition) capabilities. It is specifically designed for extracting text from Venezuelan invoices and receipts, such as Digitel phone bills and Banesco third-party payment receipts.

The API uses Tesseract.js for OCR processing with Spanish language support, and includes JWT authentication with API key management for secure integrations.

## ✨ Features

| Feature | Description |
|---------|-------------|
| JWT Authentication | Access/refresh token pair for secure access |
| API Key Management | Generate and manage API keys for integrations |
| PDF Upload | Upload PDF documents for processing |
| OCR Text Extraction | Extract text from images/PDFs using Tesseract.js |
| Spanish OCR | Trained data for Spanish language recognition |
| Swagger Documentation | Interactive API documentation at `/api` |
| User Management | User registration and profile management |

## 🏗️ Architecture

```
ocr-api/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── modules/             # Feature modules (auth, ocr, users, api-keys)
│   ├── prisma/              # Prisma service and schema
│   ├── interfaces/          # Standard response types
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utilities (regex, hashing)
├── prisma/
│   └── schema.prisma        # Database schema
├── test/                    # Unit and e2e tests
├── spa.traineddata          # Spanish OCR training data
├── nest-cli.json
├── tsconfig.json
└── package.json
```

## 🛠️ Tech Stack

**Backend:**
- Framework: NestJS 11 with modular architecture
- ORM: Prisma 7 with PostgreSQL
- Authentication: Passport.js + JWT (access + refresh tokens)
- Validation: class-validator + class-transformer
- Documentation: Swagger/OpenAPI
- Testing: Jest + Supertest
- OCR: Tesseract.js 7
- PDF Processing: pdf2pic

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ocr-api.git
cd ocr-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL configuration
```

### Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Running the Application

```bash
npm run start:dev      # Start in development mode
npm run build          # Build for production
npm run start:prod     # Start in production mode
```

The Swagger documentation will be available at `http://localhost:3000/api`.

## 📦 Available Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start NestJS in watch mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Start in production mode |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## 🧪 Testing

```bash
# Unit tests
npm run test

# Tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 📄 License

This project is licensed under the MIT License. See LICENSE for more details.

***

## 👤 Author

**Carlos Clemant**

[!GitHub](https://github.com/your-username)
[!LinkedIn](https://linkedin.com/in/your-profile)

***
<div align="center">

If you found this project helpful, give it a ⭐!

</div>
