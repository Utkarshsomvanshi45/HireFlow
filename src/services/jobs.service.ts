import { api, mockDelay, USE_MOCKS } from "./api-client";
import { mockJobs } from "@/data/mock/jobs";
import type { Job, JobInput } from "@/types";

/**
 * Job listing service.
 *
 * Typed functions for the public job board and the employer's job management.
 * Mock branch: an in-memory store seeded from src/data/mock/jobs, so actions
 * taken in the prototype (publishing, closing, editing) persist for the
 * session. Real branch: the Express endpoints noted in each function.
 */

let store: Job[] = mockJobs.map((job) => structuredClone(job));

function cloneJob(job: Job): Job {
  return structuredClone(job);
}

/** GET /jobs */
export async function listJobs(): Promise<Job[]> {
  if (!USE_MOCKS) return api.get<Job[]>("/jobs");
  await mockDelay();
  return store.filter((job) => job.status !== "draft").map(cloneJob);
}

/** GET /jobs/:id */
export async function getJob(id: string): Promise<Job | null> {
  if (!USE_MOCKS) {
    try {
      return await api.get<Job>(`/jobs/${id}`);
    } catch (error) {
      if ((error as { status?: number }).status === 404) return null;
      throw error;
    }
  }
  await mockDelay(250);
  const job = store.find((candidate) => candidate.id === id);
  return job ? cloneJob(job) : null;
}

/** GET /jobs?company=... — the signed-in employer's own listings. */
export async function listEmployerJobs(companyName: string): Promise<Job[]> {
  if (!USE_MOCKS) return api.get<Job[]>(`/jobs?company=${encodeURIComponent(companyName)}`);
  await mockDelay(250);
  return store
    .filter((job) => job.companyName === companyName)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .map(cloneJob);
}

/** POST /jobs */
export async function createJob(input: JobInput, applicantCount = 0): Promise<Job> {
  if (!USE_MOCKS) return api.post<Job>("/jobs", input);
  await mockDelay(450);
  const job: Job = {
    id: `job-${Date.now()}`,
    postedAt: new Date().toISOString().slice(0, 10),
    applicantCount,
    ...input,
  };
  store = [job, ...store];
  return cloneJob(job);
}

/** PATCH /jobs/:id */
export async function updateJob(id: string, patch: Partial<JobInput>): Promise<Job> {
  if (!USE_MOCKS) return api.patch<Job>(`/jobs/${id}`, patch);
  await mockDelay(400);
  const index = store.findIndex((job) => job.id === id);
  if (index === -1) throw new Error("Job not found.");
  store[index] = { ...store[index], ...patch };
  return cloneJob(store[index]);
}

/** PATCH /jobs/:id/status — used by the close-job action. */
export async function setJobStatus(id: string, status: Job["status"]): Promise<Job> {
  if (!USE_MOCKS) return api.patch<Job>(`/jobs/${id}/status`, { status });
  await mockDelay(300);
  const index = store.findIndex((job) => job.id === id);
  if (index === -1) throw new Error("Job not found.");
  store[index] = { ...store[index], status };
  return cloneJob(store[index]);
}

/** GET /jobs/:id/related */
export async function listRelatedJobs(job: Job, limit = 3): Promise<Job[]> {
  if (!USE_MOCKS) return api.get<Job[]>(`/jobs/${job.id}/related`);
  await mockDelay(200);
  const scored = store
    .filter((candidate) => candidate.id !== job.id && candidate.status === "active")
    .map((candidate) => {
      let score = 0;
      if (candidate.companyName === job.companyName) score += 2;
      if (candidate.employmentType === job.employmentType) score += 1;
      score += candidate.tags.filter((tag) => job.tags.includes(tag)).length;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => cloneJob(entry.candidate));
}
