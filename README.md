# HireFlow — Full-Stack Job Board & Applicant Tracking System

HireFlow is an enterprise-grade full-stack recruitment platform connecting candidates with hiring companies. Candidates search listings, apply with resumes, and track their application pipeline. Employers publish jobs, review applicants, advance candidates through a Kanban pipeline, access authorized resumes, and manage private hiring notes.

---

## 📋 Table of Contents
1. [Key Features](#-key-features)
2. [Technology Stack](#-technology-stack)
3. [Architecture & System Design](#-architecture--system-design)
4. [Folder Structure](#-folder-structure)
5. [Database Design & Schema](#-database-design--schema)
6. [Authentication & Authorization Model](#-authentication--authorization-model)
7. [API Endpoints Overview](#-api-endpoints-overview)
8. [Local Development Setup](#-local-development-setup)
9. [Environment Variable Configuration](#-environment-variable-configuration)
10. [Database Migrations & Seed Data](#-database-migrations--seed-data)
11. [Demo Accounts](#-demo-accounts)
12. [Resume Storage Setup (Local & Cloud S3/R2)](#-resume-storage-setup)
13. [Automated Testing & Results](#-automated-testing--results)
14. [Production Builds & Verification](#-production-builds--verification)
15. [Vercel Deployment Guide](#-vercel-deployment-guide)
16. [Known Limitations & Architecture Decisions](#-known-limitations--architecture-decisions)
17. [AI Tools Used & Attributions](#-ai-tools-used--attributions)
18. [Video Demonstration Plan & Narration](#-video-demonstration-plan--narration)

---

## 🌟 Key Features

### Candidate Experience
* **Account Management**: Registration, login, session persistence, and profile editing (headline, location, phone, bio).
* **Job Discovery**: Keyword search across title, description, company, and tags; filtering by location and employment type (`full-time`, `part-time`, `contract`, `internship`).
* **Job Details**: Comprehensive listing view including responsibilities, qualifications, tags, salary range, and company details.
* **Resume Handling**: Server-validated PDF resume upload (binary magic-bytes inspection `%PDF-` and 5MB ceiling).
* **Job Applications**: One-click application with attached or profile resume; duplicate application prevention.
* **Application Tracker**: Real-time status visibility across the hiring lifecycle (`applied` → `shortlisted` → `interview` → `hired` or `rejected`).

### Employer Workspace
* **Job Publishing**: Rich job creation form (title, company, location, remote toggle, employment type, salary range with validation that min ≤ max, tags, responsibilities, qualifications).
* **Listing Management**: View active and draft jobs, edit listings, and close open listings. Closed jobs instantly reject new applications.
* **Applicant Pipeline**: Interactive hiring pipeline / Kanban workflow to transition candidates through each stage.
* **Resume Access**: Secure, backend-authorized resume streaming / presigned download strictly restricted to the employer owning that job.
* **Private Hiring Notes**: Employer-only internal evaluation notes on candidates; strictly isolated from candidates.

---

## 🛠 Technology Stack

### Frontend (`/frontend`)
* **Framework**: React 19 + TypeScript + Vite 6
* **Routing**: React Router v7 (SPA with client-side history)
* **Styling**: Tailwind CSS v4 + Radix UI accessible primitives + Lucide Icons
* **Forms & Validation**: Controlled forms, Sonner toast notifications, Zod schema validation
* **Deployment Target**: Vercel (Single-Page Application with routing rewrites)

### Backend (`/backend`)
* **Runtime**: Node.js v22+ / Express.js + TypeScript (ES Modules)
* **Database & ORM**: PostgreSQL (Neon Serverless) + Prisma ORM 6
* **Authentication**: Server-side sessions, SHA-256 hashed token storage, HTTP-only SameSite cookies, Bearer token fallback for cross-origin environments, bcrypt password hashing (12 rounds)
* **Security & Hardening**: `express-rate-limit` brute-force protection, Multer memory storage with binary magic-bytes validation, strict role authorization middleware
* **Object Storage**: Pluggable storage abstraction supporting local private disk and AWS S3 / Cloudflare R2 / Supabase Storage with AES256 encryption
* **Testing**: Vitest + Supertest automated integration test suite

---

## 📐 Architecture & System Design

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite)               │
│  - Public Board (/jobs, /jobs/:id)                     │
│  - Candidate Portal (/candidate, /candidate/apps)      │
│  - Employer Workspace (/employer, /employer/jobs)      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON + Cookies / Bearer)
┌───────────────────────────▼────────────────────────────┐
│              Backend (Express + TypeScript)            │
│  - Rate Limiting & Security Middlewares                │
│  - Authentication & Session Verification               │
│  - Role-Based Access Control (RBAC)                    │
│  - Controllers (Auth, Jobs, Applications, Notes)       │
└─────────────┬────────────────────────────┬─────────────┘
              │ Prisma ORM                 │ S3 SDK
┌─────────────▼─────────────┐ ┌────────────▼─────────────┐
│  Neon PostgreSQL (Cloud)  │ │ Object Storage (Private) │
│  - Pooled (Runtime)       │ │ - AWS S3 / Cloudflare R2 │
│  - Direct (Migrations)    │ │ - Local Dev /tmp Disk    │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 📁 Folder Structure

```text
HireFlow/
├── backend/
│   ├── api/
│   │   └── index.ts                 # Vercel serverless entry point
│   ├── prisma/
│   │   ├── migrations/              # Version-controlled Prisma migration files
│   │   │   └── 0_init/migration.sql # Baseline schema migration
│   │   └── schema.prisma            # Relational database schema
│   ├── src/
│   │   ├── config/env.ts            # Environment validation & settings
│   │   ├── controllers/             # Auth, jobs, applications, notes
│   │   ├── db/                      # Prisma client instance & idempotent seed script
│   │   ├── middlewares/             # Auth, role check, Zod validator, PDF inspection
│   │   ├── routes/                  # Express API routes (/api/...)
│   │   ├── services/                # Pluggable storage service (Local + S3 adapter)
│   │   ├── tests/                   # 27 automated tests (Vitest + Supertest)
│   │   ├── app.ts                   # Express application setup & CORS
│   │   └── index.ts                 # Standalone development server listener
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json                  # Backend Vercel serverless configuration
│   └── .env.example
├── frontend/
│   ├── public/                      # Static assets & favicon
│   ├── src/
│   │   ├── components/              # Radix UI primitives, guards, job forms
│   │   ├── data/mock/               # Offline fallback mock data
│   │   ├── hooks/                   # useSession hook
│   │   ├── layouts/                 # Candidate & Employer dashboard shells
│   │   ├── pages/                   # Auth, Public, Candidate, Employer views
│   │   ├── services/                # Centralized typed API client & services
│   │   ├── types/                   # Shared TypeScript models
│   │   ├── App.tsx                  # Client router
│   │   └── main.tsx                 # DOM root mount
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vercel.json                  # Frontend SPA rewrite rules
│   └── .env.example
├── .gitignore
├── package.json                     # Monorepo workspace helper scripts
└── README.md
```

---

## 🗄 Database Design & Schema

Defined in [`backend/prisma/schema.prisma`](file:///c:/Users/hp/Desktop/HireFlow/backend/prisma/schema.prisma):

* **User**: `id`, `email` (unique), `name`, `passwordHash`, `role` (`CANDIDATE` or `EMPLOYER`), profile attributes (`title`, `location`, `phone`, `companyName`, `bio`, `resumeName`, `resumeUpdatedAt`).
* **Session**: `id`, `tokenHash` (unique, SHA-256), `userId`, `expiresAt`, `createdAt`.
* **Job**: `id`, `employerId` (foreign key to `User`), `title`, `companyName`, `location`, `remote`, `employmentType`, `currency`, `salaryMin`, `salaryMax`, `description`, `responsibilities`, `qualifications`, `tags`, `status` (`OPEN`, `CLOSED`, `DRAFT`).
* **Application**: `id`, `jobId`, `candidateId`, `candidateName`, `candidateEmail`, `candidateTitle`, `status` (`APPLIED`, `SHORTLISTED`, `INTERVIEW`, `HIRED`, `REJECTED`), `resumeName`, `resumeUrl`, `resumeAvailable`. Compound unique index `@@unique([jobId, candidateId])` enforces single application per candidate per job.
* **ApplicationNote**: `id`, `jobId`, `employerId`, `content`, `createdAt`, `updatedAt`. Private notes accessible strictly to the employer who posted the job.

---

## 🔒 Authentication & Authorization Model

1. **Password Hashing**: Passwords are never stored in plaintext; salted bcrypt hashes with cost factor 12 (10 for demo seeds) are used.
2. **Session Security**: Upon login/registration, a cryptographically strong 32-byte hexadecimal token is generated. Only the SHA-256 hash is persisted in the database.
3. **Hybrid Transport**:
   * **HTTP-only Cookie**: Secure SameSite cookie (`hireflow_session`) prevents JavaScript XSS access.
   * **Bearer Fallback**: A token is returned in the auth JSON response and stored in frontend `localStorage`, sent as `Authorization: Bearer <token>`. This guarantees 100% reliable cross-domain/cross-port communication when browsers block third-party cookies.
4. **Role Enforcement**: Middleware checks `req.user.role` strictly on the server:
   * Candidates cannot post jobs, modify application statuses, or view private notes (`403 Forbidden`).
   * Employers cannot apply for jobs or access another employer's jobs/notes/resumes (`403 Forbidden`).

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service health probe |
| `POST` | `/api/auth/register` | Public (Rate-limited) | Register candidate or employer account |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Sign in and receive session |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate server session & clear cookies |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PATCH` | `/api/auth/profile` | Authenticated | Update user profile fields |
| `GET` | `/api/jobs` | Public | List open jobs with query filters (`q`, `location`, `employmentType`, `sort`, `page`) |
| `GET` | `/api/jobs/:id` | Public | Fetch job details and applicant count |
| `POST` | `/api/jobs` | Employer | Publish a new job listing |
| `PATCH` | `/api/jobs/:id` | Owning Employer | Edit or close a job listing |
| `GET` | `/api/jobs/:id/private-notes` | Owning Employer | Retrieve private hiring notes |
| `PUT` | `/api/jobs/:id/private-notes` | Owning Employer | Save/update private hiring notes |
| `POST` | `/api/applications` | Candidate | Submit job application (with optional PDF) |
| `GET` | `/api/applications/me` | Candidate | List authenticated candidate's applications |
| `POST` | `/api/candidate/resume` | Candidate | Upload candidate profile resume (PDF only) |
| `GET` | `/api/employer/applications` | Employer | List applications across all jobs of the employer |
| `PATCH` | `/api/applications/:id/status`| Owning Employer | Move applicant through hiring pipeline |
| `GET` | `/api/applications/:id/resume`| Authorized Only | Stream / presign download resume PDF |

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v20 or later (`node -v`)
* **Package Manager**: npm v10+

### Step-by-Step Instructions

**1. Clone the repository:**
```bash
git clone https://github.com/Utkarshsomvanshi45/HireFlow.git
cd HireFlow
```

**2. Configure Backend Environment:**
Create `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@ep-your-pooler.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://user:password@ep-your-direct.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SESSION_SECRET="hireflow-local-development-secret-key"
```

**3. Configure Frontend Environment:**
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**4. Install Dependencies:**
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

**5. Apply Database Migrations & Seed:**
```bash
cd backend
npx prisma migrate deploy
npx tsx src/db/seed.ts
cd ..
```

**6. Start Development Servers:**
Open two terminals:

* **Terminal 1 (Backend)**:
  ```bash
  cd backend && npm run dev
  ```
* **Terminal 2 (Frontend)**:
  ```bash
  cd frontend && npm run dev -- --port 3000
  ```

Open your browser at `http://localhost:3000`.

---

## 👥 Demo Accounts

The database seed provides ready-to-use accounts for immediate evaluation:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Candidate** | `priya.sharma@example.com` | `hireflow-demo` | Senior Frontend Engineer with pre-loaded applications |
| **Employer** | `marcus@northwindlabs.com` | `hireflow-demo` | Head of Talent at Northwind Labs with active job postings |
| **Candidate (Secondary)** | `sofia@example.com` | `password123` | Sofia Chen (San Francisco) |
| **Employer (Secondary)** | `elena@acme.corp` | `password123` | Elena Vance at Acme Corp |

*(In the login UI, clicking "Use candidate demo" or "Use employer demo" auto-fills these credentials).*

---

## 🗄 Resume Storage Setup

### Local Storage (Default)
In development, resumes are safely written to `backend/storage/resumes/` (or `os.tmpdir()` in serverless environments). Files are never publicly accessible and are streamed through authorization-checked endpoints.

### Cloud Storage (AWS S3, Cloudflare R2, Supabase Storage)
For production deployments on Vercel where the local filesystem is ephemeral and read-only, configure the following variables in `backend/.env` (and Vercel Project Settings):

```env
STORAGE_BUCKET="hireflow-resumes-bucket"
AWS_ACCESS_KEY_ID="your-s3-access-key-id"
AWS_SECRET_ACCESS_KEY="your-s3-secret-access-key"
AWS_REGION="us-east-1"
# STORAGE_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com" # For Cloudflare R2 / Supabase
```
When configured, `backend/src/services/storage.service.ts` automatically activates `S3ObjectStorageService`, uploading files with AES256 server-side encryption and issuing 15-minute expiring presigned URLs for authorized downloads.

---

## 🧪 Automated Testing & Results

The backend includes a comprehensive Vitest automated test suite:

```bash
cd backend
npm test
```

### Verified Test Results: 27 / 27 Passed (100%)
* **Health Check**: Validates `GET /api/health` response structure.
* **Authentication Validation**: Validates password length (<8 chars rejected) and employer company name presence.
* **Session Handling**: Tests candidate and employer registration, cookie and token delivery, and session persistence on `/api/auth/me`.
* **Login & Bad Credentials**: Rejects invalid passwords with `401 Unauthorized`.
* **Role Authorization**: Forbids candidates from posting jobs (`403`); forbids employers from applying (`403`).
* **Salary Range Validation**: Rejects job creation when `salaryMin > salaryMax`.
* **Job Management & Ownership**: Confirms employer job creation and blocks other employers from modifying it.
* **Job Lifecycle & Closed Jobs**: Confirms employer can close a job and verifies candidate application to a closed job is rejected with `400`.
* **Application Integrity**: Confirms candidate application submission and verifies duplicate applications are rejected with `400`.
* **Status Progression**: Verifies candidate cannot modify application status (`403`); verifies owning employer can transition `applied` → `shortlisted` → `interview`.
* **Private Notes**: Verifies candidates cannot read employer notes (`403`); verifies owning employer can save and read notes.
* **Resume Security**: Rejects non-PDF files (`400`); verifies valid PDF `%PDF-` binary magic bytes; rejects unauthenticated downloads (`401`); forbids unauthorized employers from downloading candidate resumes (`403`).
* **Session Invalidation**: Verifies `POST /api/auth/logout` revokes session and subsequent authenticated calls fail with `401`.

---

## 🚢 Production Builds & Verification

* **Backend Typecheck**: `cd backend && npx tsc --noEmit` &mdash; **0 errors**
* **Frontend Typecheck & Build**: `cd frontend && npm run build` &mdash; **0 errors** (2,169 modules transformed, `dist/` generated cleanly)

---

## 🌐 Vercel Deployment Guide

Deploy as two separate projects from the same GitHub repository:

### 1. Frontend Project (`hireflow-frontend`)
1. In Vercel, click **Add New Project** and select this repository.
2. Set **Root Directory**: `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variable:
   * `VITE_API_BASE_URL`: `https://hireflow-backend.vercel.app/api` (URL of your deployed backend).
5. Deploy.

### 2. Backend Project (`hireflow-backend`)
1. In Vercel, click **Add New Project** and select this repository.
2. Set **Root Directory**: `backend`.
3. Framework Preset: **Other**.
4. Configure Environment Variables:
   * `DATABASE_URL`: Neon pooled connection string (`-pooler`).
   * `DIRECT_URL`: Neon direct unpooled connection string.
   * `FRONTEND_URL`: URL of the deployed frontend (e.g. `https://hireflow.vercel.app`).
   * `NODE_ENV`: `production`.
   * `SESSION_SECRET`: Random 32+ character key.
   * `STORAGE_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (if using cloud object storage).
5. Deploy.

---

## ⚙️ Known Limitations & Architecture Decisions

1. **Third-Party Browser Cookie Partitioning**: Modern browsers (Safari ITP and Chrome CHIPS) block cross-domain cookies when the frontend (`vercel.app`) and backend (`backend.vercel.app`) reside on different domains without custom domain alignment. HireFlow solves this by implementing **Hybrid Authentication**: the server delivers HTTP-only cookies and a Bearer token in the auth response, which `api-client.ts` automatically attaches via `Authorization: Bearer <token>`.
2. **Ephemeral Local Storage on Serverless**: Local disk uploads are supported for development, but serverless environments discard `/tmp` when cold-booting. Production deployments should configure S3/R2 credentials for persistent resume storage.

---

## 🤖 AI Tools Used & Attributions

* **Google Antigravity**: Primary full-stack autonomous coding agent utilized for backend architecture, Prisma schema design, hybrid session authentication implementation, Vitest automated testing suite, security hardening, and Vercel serverless integration.
* **Lovable**: Provided initial frontend prototype UI layouts, components, and Tailwind styling tokens.

---

## 🎥 Video Demonstration Plan & Narration

For submission, record a 3–5 minute video walking through:
1. **Introduction (30s)**: Introduce HireFlow as a full-stack job board and applicant tracking system built with React 19, Express, Prisma, and Neon PostgreSQL.
2. **Candidate Workflow (60s)**: Sign in as Priya Sharma (`priya.sharma@example.com`), browse listings with keyword and location filters, inspect job details, upload a PDF resume, submit an application, and show the updated candidate overview.
3. **Employer Workflow (60s)**: Sign in as Marcus Chen (`marcus@northwindlabs.com`), post a new job listing, review candidate applications, download the authorized applicant resume, transition applicant from `Applied` to `Shortlisted` to `Interview`, and add private hiring notes.
4. **Code Highlights & Architecture (60s)**:
   * Showcase Prisma schema models, compound unique constraint `@@unique([jobId, candidateId])`, and migrations.
   * Highlight the hybrid authentication architecture (HTTP-only cookies + Bearer token fallback) in `auth.controller.ts` and `auth.ts`.
5. **Difficult Technical Problem & Resolution (60s)**: Explain the cross-origin session loss across localhost/Vercel domains, how cookie-only flows fail across subdomains without HTTPS, and how the hybrid cookie + Bearer token architecture with `%PDF-` magic-bytes validation was designed and tested with 27 automated tests.
