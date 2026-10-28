import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { CandidateLayout } from "./layouts/CandidateLayout";
import { EmployerLayout } from "./layouts/EmployerLayout";

import { LandingPage } from "./pages/public/LandingPage";
import { JobListingsPage } from "./pages/public/JobListingsPage";
import { JobDetailsPage } from "./pages/public/JobDetailsPage";
import { NotFoundPage } from "./pages/public/NotFoundPage";

import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

import { CandidateOverviewPage } from "./pages/candidate/CandidateOverviewPage";
import { CandidateApplicationsPage } from "./pages/candidate/CandidateApplicationsPage";
import { CandidateProfilePage } from "./pages/candidate/CandidateProfilePage";

import { EmployerOverviewPage } from "./pages/employer/EmployerOverviewPage";
import { EmployerJobsPage } from "./pages/employer/EmployerJobsPage";
import { EmployerNewJobPage } from "./pages/employer/EmployerNewJobPage";
import { EmployerPipelinePage } from "./pages/employer/EmployerPipelinePage";
import { EmployerApplicantsPage } from "./pages/employer/EmployerApplicantsPage";
import { EmployerEditJobPage } from "./pages/employer/EmployerEditJobPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs" element={<JobListingsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Candidate dashboard routes */}
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route index element={<CandidateOverviewPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
          </Route>

          {/* Employer dashboard routes */}
          <Route path="/employer" element={<EmployerLayout />}>
            <Route index element={<EmployerOverviewPage />} />
            <Route path="jobs" element={<EmployerJobsPage />} />
            <Route path="jobs/new" element={<EmployerNewJobPage />} />
            <Route path="jobs/:id/pipeline" element={<EmployerPipelinePage />} />
            <Route path="jobs/:id/applicants" element={<EmployerApplicantsPage />} />
            <Route path="jobs/:id/edit" element={<EmployerEditJobPage />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

