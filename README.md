# INFYPOS Enterprise Backend

INFYPOS is an enterprise multi-tenant SaaS Electronic Point of Sale (EPOS) & ERP backend built with NestJS 11, PostgreSQL 17, and Prisma ORM.

## Tech Stack
- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Prisma 7
- **Auth**: JWT & Passport
- **Cache**: Redis & ioredis
- **Queue**: BullMQ
- **Documentation**: Swagger OpenAPI at `/api/docs`

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Start development server
npm run start:dev
```

## API Documentation
Swagger interactive UI is available at `http://localhost:3000/api/docs`.
