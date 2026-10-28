import type { Application } from "@/types";
import { demoCandidate, mockUsers } from "./users";

/**
 * MOCK DATA — sample applications for the prototype only.
 * Includes the demo candidate's own applications (candidate dashboard) and a
 * pipeline of applicant records against Northwind Labs jobs (employer
 * dashboard). Replaced by the real API later.
 */

interface MockApplicationSeed {
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidateTitle?: string;
  appliedAt: string;
  status: Application["status"];
  resumeAvailable: boolean;
}

const seeds: MockApplicationSeed[] = [
  // The demo candidate's own applications across the public board.
  {
    jobId: "job-201",
    candidateName: demoCandidate.name,
    candidateEmail: demoCandidate.email,
    candidateTitle: demoCandidate.title,
    appliedAt: "2026-10-18",
    status: "interview",
    resumeAvailable: true,
  },
  {
    jobId: "job-203",
    candidateName: demoCandidate.name,
    candidateEmail: demoCandidate.email,
    candidateTitle: demoCandidate.title,
    appliedAt: "2026-10-11",
    status: "shortlisted",
    resumeAvailable: true,
  },
  {
    jobId: "job-206",
    candidateName: demoCandidate.name,
    candidateEmail: demoCandidate.email,
    candidateTitle: demoCandidate.title,
    appliedAt: "2026-10-07",
    status: "applied",
    resumeAvailable: true,
  },
  {
    jobId: "job-202",
    candidateName: demoCandidate.name,
    candidateEmail: demoCandidate.email,
    candidateTitle: demoCandidate.title,
    appliedAt: "2026-09-30",
    status: "rejected",
    resumeAvailable: true,
  },
  {
    jobId: "job-207",
    candidateName: demoCandidate.name,
    candidateEmail: demoCandidate.email,
    candidateTitle: demoCandidate.title,
    appliedAt: "2026-09-24",
    status: "hired",
    resumeAvailable: true,
  },
  // Incoming applicants for the demo employer's jobs.
  {
    jobId: "job-101",
    candidateName: "Daniel Okafor",
    candidateEmail: "daniel.okafor@example.com",
    candidateTitle: "Frontend Engineer",
    appliedAt: "2026-10-17",
    status: "shortlisted",
    resumeAvailable: true,
  },
  {
    jobId: "job-101",
    candidateName: "Sofia Almeida",
    candidateEmail: "sofia.almeida@example.com",
    candidateTitle: "Senior Frontend Engineer",
    appliedAt: "2026-10-16",
    status: "interview",
    resumeAvailable: true,
  },
  {
    jobId: "job-101",
    candidateName: "Rahul Verma",
    candidateEmail: "rahul.verma@example.com",
    candidateTitle: "Full-stack Developer",
    appliedAt: "2026-10-15",
    status: "applied",
    resumeAvailable: false,
  },
  {
    jobId: "job-102",
    candidateName: "Emma Lindqvist",
    candidateEmail: "emma.lindqvist@example.com",
    candidateTitle: "Product Designer",
    appliedAt: "2026-10-14",
    status: "applied",
    resumeAvailable: true,
  },
  {
    jobId: "job-102",
    candidateName: "James Carter",
    candidateEmail: "james.carter@example.com",
    candidateTitle: "UX Designer",
    appliedAt: "2026-10-13",
    status: "rejected",
    resumeAvailable: true,
  },
  {
    jobId: "job-103",
    candidateName: "Wei Zhang",
    candidateEmail: "wei.zhang@example.com",
    candidateTitle: "Backend Engineer",
    appliedAt: "2026-10-13",
    status: "applied",
    resumeAvailable: true,
  },
  {
    jobId: "job-103",
    candidateName: "Ana Petrova",
    candidateEmail: "ana.petrova@example.com",
    candidateTitle: "Platform Engineer",
    appliedAt: "2026-10-10",
    status: "hired",
    resumeAvailable: true,
  },
  {
    jobId: "job-104",
    candidateName: "Kofi Mensah",
    candidateEmail: "kofi.mensah@example.com",
    candidateTitle: "CS Graduate",
    appliedAt: "2026-10-18",
    status: "applied",
    resumeAvailable: true,
  },
  {
    jobId: "job-104",
    candidateName: "Lucia Romano",
    candidateEmail: "lucia.romano@example.com",
    candidateTitle: "Final-year Student",
    appliedAt: "2026-10-19",
    status: "shortlisted",
    resumeAvailable: false,
  },
];

let counter = 0;
const nextId = () => `app-${++counter}`.padStart(8, "0");

export const mockApplications: Application[] = seeds.map((seed, index) => ({
  id: `app-${String(index + 1).padStart(3, "0")}`,
  jobId: seed.jobId,
  candidateId: mockUsers.find((u) => u.email === seed.candidateEmail)?.id ?? "user-external",
  ...seed,
}));

export { nextId };
