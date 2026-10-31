# HireFlow — Job Board & Hiring Management Platform

## Overview
HireFlow is a full-stack job board and hiring management application designed to simplify recruitment for both job seekers and employers.

Candidates can discover job opportunities, filter listings, submit applications with PDF resumes, and track their application status. Employers can create and manage job listings, review applicants, and move candidates through a structured hiring pipeline.

The project demonstrates full-stack development concepts, including authentication, role-based authorization, REST APIs, relational database design, file handling, server-side validation, automated testing, and cloud deployment.

---

## Live Application
**Try HireFlow:** [https://hireflow-careers-app.vercel.app/](https://hireflow-careers-app.vercel.app/)

The application is deployed on Vercel, with PostgreSQL hosted on Neon.

> **Note:** Access to certain features depends on the user's role and authentication status.

---

## Key Features

### For Candidates
* **User Authentication:** Register, log in, and access protected features.
* **Job Discovery:** Browse available job opportunities.
* **Search and Filtering:** Find relevant jobs using keywords, location, and employment type.
* **Detailed Job Listings:** View job descriptions, locations, employment types, and salary information when provided.
* **Resume-Based Applications:** Apply for jobs using PDF resumes.
* **Application Tracking:** View submitted applications and their current statuses.
* **Profile Management:** Manage candidate profile information and resume details.

### For Employers
* **Employer Accounts:** Access recruitment features through the employer role.
* **Job Posting:** Create listings with titles, locations, employment types, salary ranges, and descriptions.
* **Job Management:** Edit job listings and close positions when recruitment ends.
* **Applicant Management:** Review applications submitted for employer-owned jobs.
* **Hiring Pipeline:** Manage applicants through the following stages:
  $$\text{Applied} \longrightarrow \text{Shortlisted} \longrightarrow \text{Interview} \longrightarrow \text{Hired / Rejected}$$
* **Application Status Management:** Update application progress through the hiring workflow.
* **Employer Notes:** Maintain private notes about applicants, where supported by the implementation.

### Security and Reliability
* Server-side input validation.
* Role-based access control.
* Protected API endpoints.
* Password hashing and authenticated sessions.
* PDF resume validation and upload-size restrictions.
* Authorization checks for sensitive application and resume operations.
* Automated backend tests for important application workflows.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React | User interface and interactive application |
| **Language** | TypeScript | Type safety and maintainable code |
| **Frontend Tooling** | Vite | Development server and production builds |
| **Backend** | Node.js | Server-side JavaScript runtime |
| **API Framework** | Express.js | REST API and request handling |
| **Database** | PostgreSQL | Persistent relational data storage |
| **Database Hosting** | Neon | Managed PostgreSQL hosting |
| **ORM** | Prisma | Database queries, models, and relationships |
| **Testing** | Vitest and Supertest | Automated backend testing |
| **Frontend Deployment** | Vercel | Frontend hosting |
| **Backend Deployment** | Vercel | Backend API hosting |

---

## Architecture

HireFlow separates the frontend, backend, database, and file-storage responsibilities.

```text
┌────────────────────────┐
│         Users          │
│ Candidates & Employers │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│   React + TypeScript   │
│        Frontend        │
└────────────┬───────────┘
             │
             │ HTTP API Requests
             ▼
┌────────────────────────┐
│     Express.js API     │
│                        │
│   - Authentication     │
│   - Authorization      │
│   - Input Validation   │
│   - Job Management     │
│   - Applications       │
│   - Hiring Pipeline    │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│       Prisma ORM       │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│   PostgreSQL on Neon   │
│                        │
│   - Users              │
│   - Jobs               │
│   - Applications       │
└────────────────────────┘
```

* Resume storage is handled through the application's storage implementation and configuration.
* The frontend and backend are deployed separately, allowing the user interface and API to be managed independently.

---

## How a Job Application Works

1. A candidate logs in to HireFlow.
2. The candidate searches for a suitable job.
3. The frontend sends an application request to the backend.
4. The backend validates the request and checks authentication and authorization.
5. The application and associated resume information are processed.
6. Prisma interacts with PostgreSQL to persist the relevant records.
7. The backend returns a response to the frontend.
8. The candidate can view the application status, while the authorized employer can manage the application.

---

## Data Model

The application uses a relational database managed through Prisma ORM.

The main entities include:

* **User**
  * Represents an authenticated platform user.
  * Typical responsibilities include:
    * User identity and authentication.
    * Candidate or employer role.
    * Profile information.
    * Resume-related information, where applicable.

* **Job**
  * Represents a job opportunity posted by an employer.
  * Typical information includes:
    * Job title.
    * Description.
    * Location.
    * Employment type.
    * Salary range.
    * Employer relationship.
    * Job status.

* **Application**
  * Represents a candidate's application for a job.
  * It connects a candidate to a job and supports:
    * Application status.
    * Resume association.
    * Application tracking.
    * Employer-side applicant management.

The database schema defines the actual fields, constraints, and relationships used by the application.

---

## Security Considerations

Security is an important part of a recruitment platform because it handles account information, applications, and resumes.

HireFlow incorporates the following measures:

* **Password Security:** Passwords are hashed instead of being stored as plain text.
* **Authentication:** Protected operations require an authenticated user.
* **Role-Based Authorization:** Candidate and employer permissions are enforced by the backend.
* **Server-Side Validation:** Incoming data is validated on the server.
* **Resume Validation:** Resume uploads are restricted to PDF files and subject to a size limit.
* **Application Ownership:** Sensitive application operations should be restricted to authorized users.
* **Private Resume Access:** Resume downloads are subject to authorization checks.
* **Environment Variables:** Database credentials and application secrets should be configured outside the source code.

> **Note on Storage:** Production resume retention depends on the configured storage provider. Persistent cloud storage should be configured and verified before relying on uploaded resumes in production.

---

## Deployment

HireFlow is deployed using Vercel and Neon PostgreSQL.

### Frontend
* The frontend is deployed on Vercel.
* **Live URL:** [https://hireflow-careers-app.vercel.app/](https://hireflow-careers-app.vercel.app/)

### Backend
* The backend API is deployed separately on Vercel.
* The deployed API exposes a health-check endpoint that can be used to verify service availability.

### Database
* PostgreSQL is hosted on Neon, with Prisma ORM handling database access.

### Production Configuration
For a successful deployment:
1. Configure the required environment variables in the hosting platform.
2. Set the frontend API URL to the correct backend endpoint.
3. Configure backend CORS to allow the frontend origin.
4. Verify session-cookie and authentication settings for the deployed origins.
5. Apply database migrations using the deployment workflow.
6. Configure persistent resume storage if the application requires it.
7. Test registration, login, job management, applications, and resume access against the deployed environment.

---

## Project Structure

The repository is organized into frontend and backend applications.

```text
HireFlow/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── tests/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   └── ...
│
├── README.md
└── ...
```

*The ellipses represent additional files and directories omitted for readability.*

---

## Challenges and Learning Outcomes

Developing HireFlow provided practical experience with full-stack application development.

Key areas of learning included:
* Integrating a React frontend with an Express backend.
* Designing relational database models and relationships.
* Implementing authentication and role-based authorization.
* Building job-management and application workflows.
* Handling resume uploads and secure download operations.
* Debugging issues involving file storage and application records.
* Writing automated backend tests.
* Configuring environment variables and deploying applications.

One important debugging challenge involved ensuring that an application could correctly use a candidate's previously uploaded resume. Addressing this required examining the relationship between application records and stored files and correcting the backend resume-selection workflow.

---

## Contributing

Contributions and suggestions are welcome.
* For significant changes, consider opening an issue first to discuss the proposed improvement.
* If you submit a pull request, include a clear description of the change and relevant testing information.

---

## Author

**Utkarsh Somvanshi**  
Computer Science Engineering — Artificial Intelligence  
GitHub: [@Utkarshsomvanshi45](https://github.com/Utkarshsomvanshi45)

---

## License

No license has been specified in this repository.  
Unless a license is added, the repository should not be assumed to permit unrestricted reuse, modification, or redistribution.
