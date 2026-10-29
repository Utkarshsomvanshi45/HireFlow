import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../db/prisma.js";

describe("HireFlow Backend API Automated Test Suite", () => {
  const timestamp = Date.now();
  const testCandidateEmail = `candidate_${timestamp}@test.com`;
  const testEmployerEmail = `employer_${timestamp}@test.com`;
  const testOtherEmployerEmail = `other_employer_${timestamp}@test.com`;
  const password = "securePassword123!";

  let candidateCookie: string;
  let employerCookie: string;
  let otherEmployerCookie: string;
  let createdJobId: string;
  let createdApplicationId: string;

  beforeAll(async () => {
    // Clean up any test users if they happen to exist
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testCandidateEmail, testEmployerEmail, testOtherEmployerEmail],

        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testCandidateEmail, testEmployerEmail, testOtherEmployerEmail],

        },
      },
    });
    await prisma.$disconnect();
  });

  // 1. Health check
  describe("GET /api/health", () => {
    it("should return 200 OK and health status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.service).toBe("hireflow-api");
    });
  });

  // 2. Authentication & Role Validation
  describe("Authentication & Role Authorization", () => {
    it("should reject candidate registration when password is under 8 characters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "shortpass@test.com",
        password: "short",
        role: "candidate",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("at least 8 characters");
    });

    it("should reject employer registration when company name is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Elena Boss",
        email: testEmployerEmail,
        password,
        role: "employer",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Company name is required");
    });

    it("should successfully register an employer and return session cookie", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Elena Boss",
        email: testEmployerEmail,
        password,
        role: "employer",
        companyName: "TechCorp Global",
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("employer");
      expect(res.body.user.email).toBe(testEmployerEmail);
      expect(res.body.user.passwordHash).toBeUndefined();

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      employerCookie = (cookies as unknown as string[])[0].split(";")[0];
    });

    it("should successfully register a candidate and return session cookie", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Alex Dev",
        email: testCandidateEmail,
        password,
        role: "candidate",
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("candidate");
      expect(res.body.user.email).toBe(testCandidateEmail);

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      candidateCookie = (cookies as unknown as string[])[0].split(";")[0];
    });

    it("should register a second employer for multi-tenant ownership tests", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Other Boss",
        email: testOtherEmployerEmail,
        password,
        role: "employer",
        companyName: "Rival Corp",
      });
      expect(res.status).toBe(201);
      const cookies = res.headers["set-cookie"];
      otherEmployerCookie = (cookies as unknown as string[])[0].split(";")[0];
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testCandidateEmail,
        password: "wrongPassword999!",
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("should reject /api/auth/me when unauthenticated", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should return authenticated profile on /api/auth/me with valid session cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", candidateCookie);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testCandidateEmail);
      expect(res.body.role).toBe("candidate");
    });
  });

  // 3. Job Creation, Ownership & Validation
  describe("Job Creation & Authorization", () => {
    it("should forbid a candidate from posting a job", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .set("Cookie", candidateCookie)
        .send({
          title: "Malicious Candidate Post",
          companyName: "Fake Co",
          location: "Remote",
          description: "Not allowed",
        });
      expect(res.status).toBe(403);
    });

    it("should reject job creation if salaryMin exceeds salaryMax", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .set("Cookie", employerCookie)
        .send({
          title: "Staff Engineer",
          companyName: "TechCorp Global",
          location: "Remote",
          description: "Great role",
          salaryMin: 200000,
          salaryMax: 100000, // Invalid!
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Minimum salary cannot exceed maximum salary");
    });

    it("should allow an employer to create an active job", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .set("Cookie", employerCookie)
        .send({
          title: "Lead TypeScript Architect",
          companyName: "TechCorp Global",
          location: "Austin, TX",
          remote: true,
          employmentType: "full-time",
          salaryMin: 150000,
          salaryMax: 190000,
          description: "Lead our next-generation architecture initiatives.",
          responsibilities: ["Build scalable backends", "Lead migrations"],
          qualifications: ["5+ years TypeScript", "PostgreSQL expertise"],
          tags: ["TypeScript", "Node.js", "Architecture"],
          status: "active",
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Lead TypeScript Architect");
      expect(res.body.status).toBe("active");
      createdJobId = res.body.id;
    });

    it("should prevent another employer from modifying the first employer's job", async () => {
      const res = await request(app)
        .patch(`/api/jobs/${createdJobId}`)
        .set("Cookie", otherEmployerCookie)
        .send({
          title: "Hijacked Job Title",
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("only edit your own listings");
    });
  });

  // 4. Applications & Status Restrictions
  describe("Application Submission & Workflow", () => {
    it("should prevent an employer from applying to a job", async () => {
      const res = await request(app)
        .post("/api/applications")
        .set("Cookie", employerCookie)
        .send({
          jobId: createdJobId,
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("requires candidate access");
    });

    it("should allow candidate to submit application", async () => {
      const res = await request(app)
        .post("/api/applications")
        .set("Cookie", candidateCookie)
        .send({
          jobId: createdJobId,
          candidateTitle: "Senior TypeScript Specialist",
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("applied");
      expect(res.body.jobId).toBe(createdJobId);
      createdApplicationId = res.body.id;
    });

    it("should reject duplicate application to the same job", async () => {
      const res = await request(app)
        .post("/api/applications")
        .set("Cookie", candidateCookie)
        .send({
          jobId: createdJobId,
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already applied");
    });

    it("should prevent candidate from modifying their own application status", async () => {
      const res = await request(app)
        .patch(`/api/applications/${createdApplicationId}/status`)
        .set("Cookie", candidateCookie)
        .send({
          status: "hired",
        });
      expect(res.status).toBe(403);
    });

    it("should allow owning employer to advance status: applied -> shortlisted -> interview", async () => {
      const res = await request(app)
        .patch(`/api/applications/${createdApplicationId}/status`)
        .set("Cookie", employerCookie)
        .send({
          status: "interview",
        });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("interview");
    });
  });

  // 5. Private Employer Notes
  describe("Private Employer Notes Isolation", () => {
    it("should prevent candidate from reading private employer notes", async () => {
      const res = await request(app)
        .get(`/api/jobs/${createdJobId}/private-notes`)
        .set("Cookie", candidateCookie);
      expect(res.status).toBe(403);
    });

    it("should allow owning employer to save and retrieve private notes", async () => {
      const noteContent = "Candidate performed exceptionally in algorithmic review.";
      const saveRes = await request(app)
        .put(`/api/jobs/${createdJobId}/private-notes`)
        .set("Cookie", employerCookie)
        .send({ notes: noteContent });
      expect(saveRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/jobs/${createdJobId}/private-notes`)
        .set("Cookie", employerCookie);
      expect(getRes.status).toBe(200);
      expect(getRes.body.notes).toBe(noteContent);
    });
  });
  // 6. Resume Upload Validation & Access Restrictions
  describe('Resume Upload Validation & Access Restrictions', () => {
    it('should reject non-PDF resume uploads', async () => {
      const fakeFile = Buffer.from('this is a text file pretending to be a pdf');
      const res = await request(app)
        .post('/api/candidate/resume')
        .set('Cookie', candidateCookie)
        .attach('resume', fakeFile, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not a valid PDF document');
    });

    it('should accept valid PDF resume with %PDF- magic bytes for candidate', async () => {
      const validPdf = Buffer.from('%PDF-1.5 test pdf resume buffer content');
      const res = await request(app)
        .post('/api/candidate/resume')
        .set('Cookie', candidateCookie)
        .attach('resume', validPdf, { filename: 'alex_resume.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Resume uploaded successfully');
      expect(res.body.resumeName).toBe('alex_resume.pdf');
    });

    it('should reject unauthenticated resume download', async () => {
      const res = await request(app).get('/api/applications/' + createdApplicationId + '/resume');
      expect(res.status).toBe(401);
    });

    it('should forbid another employer from downloading candidate resume', async () => {
      const res = await request(app)
        .get('/api/applications/' + createdApplicationId + '/resume')
        .set('Cookie', otherEmployerCookie);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });
  });

  // 7. Closed Job Applications & Job Lifecycle Restrictions
  describe('Job Lifecycle Restrictions & Applying to Closed Jobs', () => {
    let closedJobId;

    it('should allow employer to close their active job', async () => {
      const res = await request(app)
        .patch('/api/jobs/' + createdJobId)
        .set('Cookie', employerCookie)
        .send({ status: 'closed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
      closedJobId = res.body.id;
    });

    it('should reject application to a closed job', async () => {
      // Register a fresh candidate who hasn't applied to this job yet
      const freshEmail = 'fresh_candidate_' + Date.now() + '@test.com';
      const regRes = await request(app).post('/api/auth/register').send({
        name: 'Fresh Candidate',
        email: freshEmail,
        password: 'securePassword123!',
        role: 'candidate',
      });
      const freshCookie = regRes.headers['set-cookie'][0].split(';')[0];

      const res = await request(app)
        .post('/api/applications')
        .set('Cookie', freshCookie)
        .send({ jobId: closedJobId });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('closed and no longer accepting applications');

      // Immediately delete this temporary test candidate
      await prisma.user.deleteMany({ where: { email: freshEmail } });
    });
  });

  // 8. Application Deletion & Resume Download Tests
  describe('Application Deletion & Resume Download', () => {
    it('should allow hiring employer to download resume PDF', async () => {
      const res = await request(app)
        .get('/api/applications/' + createdApplicationId + '/resume')
        .set('Cookie', employerCookie);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('should allow candidate to withdraw/delete their application', async () => {
      const res = await request(app)
        .delete('/api/applications/' + createdApplicationId)
        .set('Cookie', candidateCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('should return 404 when trying to delete already deleted application', async () => {
      const res = await request(app)
        .delete('/api/applications/' + createdApplicationId)
        .set('Cookie', candidateCookie);

      expect(res.status).toBe(404);
    });
  });

  // 9. Session Invalidation & Logout Workflow
  describe('Session Invalidation on Logout', () => {
    it('should invalidate session upon logout and reject subsequent authenticated requests', async () => {
      // 1. Verify candidate is authenticated
      const beforeRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', candidateCookie);
      expect(beforeRes.status).toBe(200);

      // 2. Perform logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', candidateCookie);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toContain('Signed out successfully');

      // 3. Ensure subsequent request with that session cookie is rejected with 401
      const afterRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', candidateCookie);
      expect(afterRes.status).toBe(401);
    });
  });

});
