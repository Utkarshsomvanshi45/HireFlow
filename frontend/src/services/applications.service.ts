import { api, mockDelay, USE_MOCKS, API_BASE_URL } from "./api-client";
import { mockApplications, nextId } from "@/data/mock/applications";
import { mockJobs } from "@/data/mock/jobs";
import type { Application, ApplicationStatus, ApplyInput } from "@/types";

export type { Application };

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
  const companyJobIds = new Set(
    mockJobs.filter((job) => job.companyName === companyName).map((job) => job.id),
  );
  return store
    .filter((application) => companyJobIds.has(application.jobId))
    .map((application) => structuredClone(application));
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

/** DELETE /applications/:id (candidate withdraws or employer deletes applicant) */
export async function deleteApplication(applicationId: string): Promise<void> {
  if (!USE_MOCKS) return api.delete<void>(`/applications/${applicationId}`);
  await mockDelay(300);
  store = store.filter((application) => application.id !== applicationId);
}

/** GET /applications/:id/resume — downloads or streams the candidate's resume PDF */
export async function downloadApplicationResume(
  applicationId: string,
  candidateName = "candidate",
): Promise<void> {
  if (USE_MOCKS) {
    const dummyBlob = new Blob(
      ["%PDF-1.5 Sample Resume Document for " + candidateName],
      { type: "application/pdf" },
    );
    const dummyUrl = URL.createObjectURL(dummyBlob);
    const a = document.createElement("a");
    a.href = dummyUrl;
    a.download = `${candidateName.toLowerCase().replace(/\s+/g, "_")}_resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dummyUrl);
    return;
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("hireflow_token") : null;
  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/resume`, {
    method: "GET",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const errorText = await res.json().catch(() => null);
    throw new Error(errorText?.message || "Failed to download resume.");
  }

  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;

  const disposition = res.headers.get("content-disposition");
  let filename = `${candidateName.toLowerCase().replace(/\s+/g, "_")}_resume.pdf`;
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
