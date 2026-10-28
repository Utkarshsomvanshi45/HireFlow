import { api, mockDelay, USE_MOCKS } from "./api-client";
import { mockApplications, nextId } from "@/data/mock/applications";
import type { Application, ApplicationStatus, ApplyInput } from "@/types";

/**
 * Application service.
 *
 * Covers the candidate's own applications and the employer's applicant
 * management (status changes + private hiring-team notes). Mock branch keeps
 * everything in memory for the session; real branch calls the Express API.
 */

let store: Application[] = mockApplications.map((application) =>
  structuredClone(application),
);

/** Private notes live outside the Application type on purpose: they are
 * employer-only data and never shown to candidates. */
const privateNotes: Record<string, string> = {
  "job-101": "Final round scheduled for Sofia and Daniel. Rahul's portfolio lacked TypeScript depth — keep on file for mid-level roles.",
};

/** GET /applications/me */
export async function listMyApplications(candidateId: string): Promise<Application[]> {
  if (!USE_MOCKS) return api.get<Application[]>("/applications/me");
  await mockDelay(300);
  return store
    .filter((application) => application.candidateId === candidateId)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .map((application) => structuredClone(application));
}

/** GET /jobs/:id/applications (employer) */
export async function listApplicationsForJob(jobId: string): Promise<Application[]> {
  if (!USE_MOCKS) return api.get<Application[]>(`/jobs/${jobId}/applications`);
  await mockDelay(300);
  return store
    .filter((application) => application.jobId === jobId)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .map((application) => structuredClone(application));
}

/** GET /applications?company=... — pipeline across all of an employer's jobs. */
export async function listApplicationsForCompany(companyName: string): Promise<Application[]> {
  if (!USE_MOCKS) return api.get<Application[]>(`/applications?company=${encodeURIComponent(companyName)}`);
  await mockDelay(350);
  return store.map((application) => structuredClone(application));
}

/** POST /applications */
export async function applyToJob(input: ApplyInput): Promise<Application> {
  if (!USE_MOCKS) return api.post<Application>("/applications", input);
  await mockDelay(500);

  const duplicate = store.find(
    (application) =>
      application.jobId === input.jobId && application.candidateId === input.candidateId,
  );
  if (duplicate) throw new Error("You have already applied to this job.");

  const application: Application = {
    id: nextId(),
    ...input,
    appliedAt: new Date().toISOString().slice(0, 10),
    status: "applied",
  };
  store = [application, ...store];
  return structuredClone(application);
}

/** PATCH /applications/:id/status (employer) */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<Application> {
  if (!USE_MOCKS)
    return api.patch<Application>(`/applications/${applicationId}/status`, { status });
  await mockDelay(250);
  const index = store.findIndex((application) => application.id === applicationId);
  if (index === -1) throw new Error("Application not found.");
  store[index] = { ...store[index], status };
  return structuredClone(store[index]);
}

/** GET /jobs/:id/private-notes (employer-only data) */
export async function getPrivateNotes(jobId: string): Promise<string> {
  if (!USE_MOCKS) return api.get<{ notes: string }>(`/jobs/${jobId}/private-notes`).then((data) => data.notes);
  await mockDelay(150);
  return privateNotes[jobId] ?? "";
}

/** PUT /jobs/:id/private-notes (employer-only data) */
export async function savePrivateNotes(jobId: string, notes: string): Promise<void> {
  if (!USE_MOCKS) return api.put<void>(`/jobs/${jobId}/private-notes`, { notes });
  await mockDelay(250);
  privateNotes[jobId] = notes;
}
