import type { User } from "@/types";

/**
 * MOCK DATA — sample users for the prototype only.
 * This is NOT production authentication data and must be replaced by the
 * real backend once the Express + Prisma + Neon API is connected.
 */

export const EMPLOYER_COMPANY = "Northwind Labs";

export const demoCandidate: User = {
  id: "user-candidate-1",
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  role: "candidate",
  title: "Senior Frontend Engineer",
  location: "Bengaluru, India",
  phone: "+91 98765 43210",
  resumeName: "priya-sharma-resume.pdf",
  resumeUpdatedAt: "2026-10-12",
  bio: "Frontend engineer with 7 years of experience building accessible, high-performance web products in React and TypeScript.",
  createdAt: "2026-05-02",
};

export const demoEmployer: User = {
  id: "user-employer-1",
  name: "Marcus Chen",
  email: "marcus@northwindlabs.com",
  role: "employer",
  companyName: EMPLOYER_COMPANY,
  title: "Head of Talent",
  location: "Singapore",
  createdAt: "2026-03-18",
};

export const mockUsers: User[] = [demoCandidate, demoEmployer];

export const DEMO_CREDENTIALS = {
  candidate: { email: demoCandidate.email, password: "hireflow-demo" },
  employer: { email: demoEmployer.email, password: "hireflow-demo" },
};
