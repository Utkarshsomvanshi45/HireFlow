import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { JobStatus, Role, ApplicationStatus } from "@prisma/client";

export async function seed() {
  console.log("[Seed] Starting database seed...");

  const demoHash = await bcrypt.hash("hireflow-demo", 10);
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create or update Demo Employer (Marcus Chen - Northwind Labs)
  const marcus = await prisma.user.upsert({
    where: { email: "marcus@northwindlabs.com" },
    update: { passwordHash: demoHash },
    create: {
      name: "Marcus Chen",
      email: "marcus@northwindlabs.com",
      passwordHash: demoHash,
      role: Role.EMPLOYER,
      companyName: "Northwind Labs",
      title: "Head of Talent",
      location: "Singapore",
    },
  });
  console.log(`[Seed] Employer ready: ${marcus.email}`);

  // 2. Create or update Demo Candidate (Priya Sharma)
  const priya = await prisma.user.upsert({
    where: { email: "priya.sharma@example.com" },
    update: { passwordHash: demoHash },
    create: {
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      passwordHash: demoHash,
      role: Role.CANDIDATE,
      title: "Senior Frontend Engineer",
      location: "Bengaluru, India",
      phone: "+91 98765 43210",
      resumeName: "priya-sharma-resume.pdf",
      resumeUpdatedAt: new Date(),
      bio: "Frontend engineer with 7 years of experience building accessible, high-performance web products in React and TypeScript.",
    },
  });
  console.log(`[Seed] Candidate ready: ${priya.email}`);

  // 3. Create or update Secondary Demo Employer (Elena Vance - Acme Corp)
  const elena = await prisma.user.upsert({
    where: { email: "elena@acme.corp" },
    update: { passwordHash },
    create: {
      name: "Elena Vance",
      email: "elena@acme.corp",
      passwordHash,
      role: Role.EMPLOYER,
      companyName: "Acme Corp",
      title: "Head of Talent",
      location: "New York, NY",
    },
  });

  // 4. Create or update Secondary Demo Candidate (Sofia Chen)
  const sofia = await prisma.user.upsert({
    where: { email: "sofia@example.com" },
    update: { passwordHash },
    create: {
      name: "Sofia Chen",
      email: "sofia@example.com",
      passwordHash,
      role: Role.CANDIDATE,
      title: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      resumeName: "sofia-chen-resume.pdf",
      resumeUpdatedAt: new Date(),
      bio: "Frontend engineer passionate about design systems, accessibility, and modern React architectures.",
    },
  });

  // 5. Seed Jobs for Northwind Labs (Marcus)
  const northwindJobs = [
    {
      title: "Lead Frontend Engineer",
      companyName: "Northwind Labs",
      location: "Remote",
      remote: true,
      employmentType: "full-time",
      currency: "USD",
      salaryMin: 145000,
      salaryMax: 190000,
      description:
        "Join Northwind Labs to lead our core web client development. You will architect high-performance frontend interfaces, design systems, and state management.",
      responsibilities: [
        "Architect and maintain core React web apps with high responsiveness.",
        "Collaborate closely with product designers and backend engineers.",
        "Ensure top-tier web performance, accessibility, and clean component APIs.",
      ],
      qualifications: [
        "5+ years of production experience with TypeScript and modern React.",
        "Deep knowledge of CSS, Tailwind, browser performance, and bundlers.",
        "Strong track record of shipping polished, accessible SaaS applications.",
      ],
      tags: ["React", "TypeScript", "Tailwind", "Architecture", "Remote"],
      status: JobStatus.OPEN,
    },
    {
      title: "Senior Backend Engineer",
      companyName: "Northwind Labs",
      location: "Singapore",
      remote: true,
      employmentType: "full-time",
      currency: "USD",
      salaryMin: 130000,
      salaryMax: 170000,
      description:
        "Scale our distributed REST APIs, asynchronous job queues, and relational data layers across multi-region cloud deployments.",
      responsibilities: [
        "Design robust database schemas in PostgreSQL with Prisma.",
        "Implement secure, authenticated REST APIs with strict input validation.",
        "Optimize query performance, indexing, and connection pooling.",
      ],
      qualifications: [
        "4+ years with Node.js, Express, TypeScript, and relational databases.",
        "Solid grounding in REST design, security protocols, and session models.",
      ],
      tags: ["Node.js", "Express", "PostgreSQL", "Prisma", "TypeScript"],
      status: JobStatus.OPEN,
    },
  ];

  for (const jobData of northwindJobs) {
    const existing = await prisma.job.findFirst({
      where: { employerId: marcus.id, title: jobData.title },
    });
    if (!existing) {
      const created = await prisma.job.create({
        data: { employerId: marcus.id, ...jobData },
      });
      console.log(`[Seed] Created Northwind job: ${created.title}`);

      // Attach Priya's application to this job
      await prisma.application.create({
        data: {
          jobId: created.id,
          candidateId: priya.id,
          candidateName: priya.name,
          candidateEmail: priya.email,
          candidateTitle: priya.title,
          status: ApplicationStatus.SHORTLISTED,
          resumeName: priya.resumeName,
          resumeAvailable: true,
        },
      });

      // Attach private note
      await prisma.applicationNote.create({
        data: {
          jobId: created.id,
          employerId: marcus.id,
          content: "Priya demonstrated deep familiarity with design systems and TypeScript during pre-screening. Move to technical interview.",
        },
      });
    }
  }

  console.log("[Seed] Database seeding completed successfully!");
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seed()
    .catch((err) => {
      console.error("[Seed Error]", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
