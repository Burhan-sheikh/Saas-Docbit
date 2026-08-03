import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { VerifiedRoute } from '@/routes/VerifiedRoute';

import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';

import { OverviewPage } from '@/pages/OverviewPage';
import { WorkspacesPage } from '@/pages/workspaces/WorkspacesPage';
import { WorkspaceDetailPage } from '@/pages/workspaces/WorkspaceDetailPage';
import { ProjectLayout } from '@/pages/projects/ProjectLayout';
import { ProjectOverviewTab } from '@/pages/projects/ProjectOverviewTab';
import { ProjectDataTab } from '@/pages/projects/ProjectDataTab';
import { ProjectSharingTab } from '@/pages/projects/ProjectSharingTab';
import { ProjectMembersTab } from '@/pages/projects/ProjectMembersTab';
import { ProjectAnalyticsTab } from '@/pages/projects/ProjectAnalyticsTab';
import { ProjectSettingsTab } from '@/pages/projects/ProjectSettingsTab';
import { AccessDeniedPage } from '@/pages/projects/AccessDeniedPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { BillingPage } from '@/pages/BillingPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PublicSharePage } from '@/pages/PublicSharePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public share links */}
      <Route path="/s/:slug" element={<PublicSharePage />} />

      {/* Guest-only routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Routes reachable by authenticated users regardless of verification state */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<VerifiedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />

            <Route path="/projects/:projectId" element={<ProjectLayout />}>
              <Route index element={<ProjectOverviewTab />} />
              <Route path="data" element={<ProjectDataTab />} />
              <Route path="sharing" element={<ProjectSharingTab />} />
              <Route path="members" element={<ProjectMembersTab />} />
              <Route path="analytics" element={<ProjectAnalyticsTab />} />
              <Route path="settings" element={<ProjectSettingsTab />} />
            </Route>
            <Route path="/projects/:projectId/access-denied" element={<AccessDeniedPage />} />

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<GuestRoute />}>
        <Route index element={<LoginPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
