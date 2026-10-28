# HireFlow — Full-Stack Job Board & Applicant Tracking System

HireFlow is a modern, full-stack recruitment platform connecting candidates with hiring companies. Candidates search listings, apply with resumes, and track their application pipeline. Employers publish jobs, review applicants, manage candidate stages via a Kanban board, and save private hiring notes.

---

## 🛠 Technology Stack

### Frontend (`/frontend`)
* **Framework**: React 19 + TypeScript + Vite 6
* **Routing**: React Router v7
* **Styling**: Tailwind CSS v4 + Radix UI + Lucide Icons
* **State & Forms**: React Hooks, Sonner notifications, Zod validation
* **Deployment**: Vercel (SPA with rewrites)

### Backend (`/backend`)
* **Runtime**: Node.js + Express.js + TypeScript (ES Modules)
* **Database & ORM**: PostgreSQL (Neon Serverless) + Prisma ORM
* **Authentication**: Server-side sessions, SHA-256 hashed tokens, HTTP-only SameSite cookies, bcrypt password hashing
* **Validation**: Zod schema validation middleware
* **Uploads**: Multer with magic-bytes PDF binary verification & storage abstraction
* **Testing**: Vitest + Supertest
* **Deployment**: Vercel Serverless Function

---

## 📁 Repository Structure

```text
HireFlow/
├── backend/
│   ├── api/
│   │   └── index.ts               # Vercel serverless entry point
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL relational schema
│   ├── src/
│   │   ├── config/env.ts          # Environment variables & runtime settings
│   │   ├── controllers/           # Auth, jobs, applications, notes
│   │   ├── db/                    # Prisma client & database seed script
│   │   ├── middlewares/           # Auth, role check, Zod validation, PDF upload
│   │   ├── routes/                # Express REST routers (/api/...)
│   │   ├── services/              # Private storage service abstraction
│   │   ├── tests/                 # Automated test suite (Vitest + Supertest)
│   │   ├── app.ts                 # Express app configuration & CORS
│   │   └── index.ts               # HTTP server listener
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json
│   └── .env.example
├── frontend/
│   ├── public/                    # Favicon, static assets
│   ├── src/
│   │   ├── components/            # UI components, layout shell, job forms
│   │   ├── data/mock/             # In-memory mock data (offline fallback)
│   │   ├── hooks/                 # Session, mobile detection
│   │   ├── layouts/               # Root, Candidate, Employer shells
│   │   ├── pages/                 # Public, Auth, Candidate, Employer pages
│   │   ├── services/              # Centralized API client & HTTP services
│   │   ├── types/                 # Shared TypeScript models
│   │   ├── App.tsx                # Client-side router definitions
│   │   ├── main.tsx               # DOM root mount
│   │   └── styles.css             # Tailwind CSS tokens
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vercel.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🗄 Database Models & Design Decisions

Defined in [`backend/prisma/schema.prisma`](file:///c:/Users/hp/Desktop/HireFlow/backend/prisma/schema.prisma):

1. **User**:
   * Supports `role` (`CANDIDATE` or `EMPLOYER`).
   * Password stored as a salted bcrypt hash, never plaintext.
   * Unique constraint on `email`.
2. **Session**:
   * Opaque random session token (32 bytes hex) generated on login/register.
   * Only the SHA-256 hash of the token is stored in the database (`tokenHash`).
   * HTTP-only, secure (in production) cookie delivered to client.
3. **Job**:
   * Associated with an owning `employerId` (`User`).
   * Status: `OPEN`, `CLOSED`, or `DRAFT`.
   * Only the owning employer can modify, publish, or close the listing.
4. **Application**:
   * Relates `candidateId` (`User`) and `jobId` (`Job`).
   * Compound unique constraint: `@@unique([jobId, candidateId])` prevents duplicate applications.
   * Lifecycle stages: `APPLIED` → `SHORTLISTED` → `INTERVIEW` → `HIRED` (or `REJECTED`).
   * Closed jobs reject incoming applications at the database and service layers.
5. **ApplicationNote**:
   * Private hiring notes attached to a job/applicant.
   * Strictly isolated to the owning employer; candidates can never view or query notes.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
# Neon PostgreSQL pooled connection (runtime queries)
DATABASE_URL="postgresql://user:password@ep-placeholder-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Neon PostgreSQL direct connection (migrations & schema pushes)
DIRECT_URL="postgresql://user:password@ep-placeholder.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SESSION_SECRET="hireflow-super-secret-session-key-change-in-production"
```

### Frontend (`frontend/.env`)
```env
# Points to Express API backend
VITE_API_BASE_URL=http://localhost:5000/api
```
*(Leave `VITE_API_BASE_URL` empty to automatically run against the built-in offline mock data).*

---

## 🚀 Running Locally

### 1. Start the Backend
```bash
cd backend
npm install
npx prisma db push
npx tsx src/db/seed.ts   # Seeds demo accounts & starter jobs
npm run dev              # Runs on http://localhost:5000
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev -- --port 3000   # Runs on http://localhost:3000
```

### 3. Demo Credentials
* **Candidate**: `sofia@example.com` / `password123`
* **Employer**: `elena@acme.corp` / `password123`

---

## 🧪 Automated Testing

The backend includes a comprehensive Vitest + Supertest suite validating authentication, RBAC authorization, multi-tenant job isolation, duplicate application rejection, and private notes isolation:

```bash
cd backend
npm test
```

---

## 🚢 Vercel Deployment Instructions

The repository is configured for dual Vercel project deployment:

### Project A: Frontend (`hireflow-frontend`)
1. Create new project in Vercel from this GitHub repository.
2. Set **Root Directory**: `frontend`.
3. Set **Framework Preset**: `Vite`.
4. Environment Variables:
   * `VITE_API_BASE_URL`: URL of the deployed backend (e.g. `https://hireflow-backend.vercel.app/api`).

### Project B: Backend (`hireflow-backend`)
1. Create new project in Vercel from this GitHub repository.
2. Set **Root Directory**: `backend`.
3. Set **Framework Preset**: `Other`.
4. Environment Variables:
   * `DATABASE_URL`: Neon pooled connection string.
   * `DIRECT_URL`: Neon unpooled connection string.
   * `FRONTEND_URL`: URL of the deployed frontend (e.g. `https://hireflow.vercel.app`).
   * `NODE_ENV`: `production`.
   * `SESSION_SECRET`: Random 32+ character key.
