export type UserRole = "candidate" | "employer";

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "temporary";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected";

export type JobStatus = "active" | "closed" | "draft";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Candidate headline, or the employer user's internal title. */
  title?: string;
  location?: string;
  phone?: string;
  /** Employer only: company the user hires for. */
  companyName?: string;
  /** Candidate only: attached resume file name. */
  resumeName?: string;
  resumeUpdatedAt?: string;
  bio?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  currency: string;
  salaryMin?: number;
  salaryMax?: number;
  /** ISO date string. */
  postedAt: string;
  status: JobStatus;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  tags: string[];
  remote: boolean;
  applicantCount?: number;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateTitle?: string;
  /** ISO date string. */
  appliedAt: string;
  status: ApplicationStatus;
  resumeAvailable: boolean;
}

export interface JobInput {
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  currency: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  tags: string[];
  remote: boolean;
  status: JobStatus;
}

export interface Session {
  user: User;
}

export interface ApplyInput {
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateTitle?: string;
  resumeAvailable: boolean;
}

export type RegisterInput = {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  companyName?: string;
};
