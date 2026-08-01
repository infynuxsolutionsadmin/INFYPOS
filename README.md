# INFYPOS — Enterprise Retail EPOS & SaaS Platform

INFYPOS is an enterprise-grade multi-tenant Electronic Point of Sale (EPOS) & SaaS Retail ERP system engineered for UK retail operations and multi-store management.

---

## 🚀 Key Features

- **Production UK VAT Engine**: Single-source-of-truth UK VAT calculation rules (Standard 20%, Reduced 5%, Zero 0%) with line-item VAT rate & percentage snapshotting on completed sales.
- **Executive Business Intelligence Dashboard**: Live, real-time analytics powered by single-endpoint PostgreSQL aggregations (`GET /api/v1/reports/dashboard`), featuring Revenue vs Gross Profit trends, 24h hourly sales, payment tender distribution, inventory valuations, customer activity, and catalog health alerts.
- **Multi-Tenant Architecture**: Complete tenant isolation at PostgreSQL & Prisma ORM layers.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions and role enforcement (`OWNER`, `MANAGER`, `CASHIER`).
- **Inventory & Store Management**: Real-time stock tracking, low stock reorder alerts, and multi-store product distribution.
- **Dev Sales Test Tool**: Live cashier POS checkout interface with real-time tax badges, discount processing, and instant dashboard synchronization.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 11 (Modular Monolith)
- **Language**: TypeScript 5.7+
- **Database**: PostgreSQL 17
- **ORM**: Prisma ORM 7.9
- **Authentication**: JWT & Passport Passport-JWT
- **Security & Compression**: Helmet, Compression, Cookie Parser, Class Validator
- **Documentation**: Swagger OpenAPI at `/api/docs`

### Frontend
- **Framework**: Next.js 14+ / Next.js App Router
- **Language**: TypeScript 5.7+
- **UI & Styling**: Vanilla CSS & Tailwind CSS v4, Lucide Icons, Framer Motion
- **Data Fetching & State**: TanStack React Query v5, Axios
- **Data Visualization**: Recharts (Responsive Area, Bar, and Pie Charts)

---

## 📁 Repository Structure

```
INFYPOS/
├── backend/                  # NestJS API Server
│   ├── prisma/               # Prisma Schema & Database Migrations
│   ├── src/
│   │   ├── modules/          # Auth, Products, Sales, VAT, Reports, Stores, Users, RBAC
│   │   ├── common/           # Decorators, Guards, Interceptors, Filters
│   │   └── main.ts           # Application Bootstrap & Cloud Deployment Entry
│   ├── .env.example          # Backend Environment Template
│   └── package.json
├── frontend/                 # Next.js Web Client & POS Dashboard
│   ├── src/
│   │   ├── app/              # Next.js App Router Pages (Dashboard, Reports, Products, Dev POS)
│   │   ├── components/       # Reusable UI & Recharts Components
│   │   └── services/         # API Clients (Dashboard, Sales, Products, VAT, Reports)
│   ├── .env.example          # Frontend Environment Template
│   └── package.json
├── docs/                     # Architecture & API Documentation
├── .gitignore                # Production Monorepo Git Ignore Rules
└── package.json              # Monorepo Workspace Configuration
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- Node.js >= 20.0.0
- PostgreSQL >= 15.0
- npm >= 10.0.0

### 2. Installation
Clone the repository and install dependencies in the monorepo root:
```bash
npm install
```

### 3. Environment Setup
Copy the environment templates:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with your PostgreSQL database credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/infypos?schema=public"
JWT_SECRET="your_secure_jwt_secret"
```

### 4. Database Setup & Prisma Generation
Run database migrations and seed default UK VAT rates:
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply Database Migrations (inside backend directory)
cd backend && npx prisma migrate dev && cd ..
```

---

## 💻 Development Commands

From the monorepo root:

```bash
# Run NestJS Backend API (port 3000)
npm run start:backend

# Run Next.js Frontend Dashboard (port 3001)
npm run start:frontend
```

Open your browser:
- **Frontend Dashboard**: `http://localhost:3001/dashboard`
- **Dev POS Sales Test**: `http://localhost:3001/dev/sales-test`
- **Swagger API Docs**: `http://localhost:3000/api/docs`

---

## 🏗️ Production Build & Verification

To verify full production compilation:

```bash
# Build Backend & Frontend
npm run build
```

Individual build commands:
```bash
# Build Backend
npm run build:backend

# Build Frontend
npm run build:frontend
```

---

## ☁️ Production Deployment Guide

### Deploying Backend to Render (Web Service)
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository and select `backend` as the Root Directory.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
4. Set Environment Variables on Render:
   - `NODE_ENV`: `production`
   - `PORT`: (Managed by Render automatically)
   - `DATABASE_URL`: Production PostgreSQL connection string
   - `JWT_SECRET`: Secure random string
   - `CORS_ORIGINS`: `https://your-frontend-domain.com`

### Deploying Frontend to Vercel
1. Import repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-render-app.onrender.com/api/v1`
4. Deploy!

---

## 🛡️ License

UNLICENSED — Property of INFYPOS Solutions. All rights reserved.
