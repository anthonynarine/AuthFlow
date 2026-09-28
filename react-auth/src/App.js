import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LoginPage } from "./components/login/LoginPage";
import { ForgotPassword } from "./components/forgot-password/ForgotPassword";
import { RegisterPage } from "./components/register/RegisterPage";
import { SendEmail } from "./components/mail/SendEmail";
import { EarlyAccessPage } from "./components/early-access/EarlyAccessPage";
import { ResetPassword } from "./components/reset-password/ResetPassword";
import { QRCodeSetup } from "./components/two-factor/2fa-setup/QRCodeSetup";
import { NotFound } from "./components/not-found/NotFound";
import HomePage from "./components/home/HomePage";
import GaitArchitecturePage from "./components/home/GaitArchitecturePage";
import { DevelopersPage } from "./components/developers/DevelopersPage";
import { RouteTitle } from "./app/RouteTitle";
import { SecurityObservatoryPage } from "./components/security/SecurityObservatoryPage";
import { SecurityLearnPage } from "./components/security/SecurityLearnPage";
import { SecurityCommandPage } from "./components/security-command/SecurityCommandPage";
import { SecurityExercisesPage } from "./components/security-exercises/SecurityExercisesPage";
import { FounderIssuesPage } from "./components/workspace/FounderIssuesPage";
import { FounderIssueWorkspacePage } from "./components/workspace/FounderIssueWorkspacePage";
import { SecurityTeamPage } from "./components/workspace/SecurityTeamPage";
import { WorkspaceEntry } from "./components/workspace/WorkspaceEntry";
import { OnboardingWizardPage } from "./components/workspace/onboarding/OnboardingWizardPage";
import { AppsHomePage } from "./components/workspace/AppsHomePage";
import { AppSetupPage } from "./components/workspace/AppSetupPage";
import { ConsoleLayout } from "./console/layout/ConsoleLayout";
import { ConsoleEntry } from "./console/pages/ConsoleEntry";
import { OverviewPage } from "./console/pages/overview/OverviewPage";
import { ApplicationsPage } from "./console/pages/applications/ApplicationsPage";
import { ApplicationDetailPage } from "./console/pages/applications/ApplicationDetailPage";
import { FindingsPage } from "./console/pages/findings/FindingsPage";
import { FindingDetailPage } from "./console/pages/findings/FindingDetailPage";
import { VerifyEmailPage } from "./account/VerifyEmailPage";
import { AcceptInvitePage } from "./console/invites/AcceptInvitePage";
import { AccountPage } from "./account/AccountPage";
import { TwoStepSetupPage } from "./account/TwoStepSetupPage";
import { MembersPage } from "./console/pages/members/MembersPage";
import { SettingsPage } from "./console/pages/settings/SettingsPage";
import { DocsPage } from "./docs/DocsPage";
import { DOCS_BASE, DOC_PAGES, docPath } from "./docs/manifest";
import "./App.css"
import { Footer } from "./components/footer/Footer";
import BasicAuthProvider from "./context/auth/BasicAuthContext";
import TwoFactorAuthProvider from "./context/auth/TwoFactorAuthContext";
import { UserSessionProvider } from "./context/auth/UserSessionContext";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


function App() {
  // The console is a full-height app shell; the marketing footer would sit on top of it.
  const { pathname } = useLocation();
  const isConsole = pathname === "/console" || pathname.startsWith("/console/");
  // An overflow container here (it never scrolls itself; the page does) would
  // stop the docs' sticky header and sidebar from sticking.
  const isDocs = pathname === DOCS_BASE || pathname.startsWith(`${DOCS_BASE}/`);
  return (
    <>
    <div className="app-container">
      <div className="routes-content" style={{ flex: 1, overflowY: isDocs ? 'visible' : 'auto' }}>
      <ToastContainer />
      <RouteTitle />
          <BasicAuthProvider>
            <TwoFactorAuthProvider>
                <UserSessionProvider>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/architecture" element={<GaitArchitecturePage />} />
                    <Route path="/developers" element={<DevelopersPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/send-email" element={<SendEmail />} />
                    <Route path="/early-access" element={<EarlyAccessPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/account/two-step" element={<TwoStepSetupPage />} />
                    <Route path={DOCS_BASE} element={<Navigate to={docPath(DOC_PAGES[0].slug)} replace />} />
                    <Route path={`${DOCS_BASE}/:slug`} element={<DocsPage />} />
                    <Route path="/security" element={<SecurityObservatoryPage />} />
                    <Route path="/security-command" element={<SecurityCommandPage />} />
                    <Route path="/security-observatory" element={<SecurityObservatoryPage />} />
                    <Route path="/security-exercises" element={<SecurityExercisesPage />} />
                    <Route path="/security-learn" element={<SecurityLearnPage />} />
                    <Route path="/workspace" element={<WorkspaceEntry />} />
                    <Route path="/workspace/onboarding" element={<OnboardingWizardPage />} />
                    <Route path="/workspace/apps" element={<AppsHomePage />} />
                    <Route path="/workspace/apps/:id/setup" element={<AppSetupPage />} />
                    <Route path="/workspace/issues" element={<FounderIssuesPage />} />
                    <Route path="/workspace/issues/:id" element={<FounderIssueWorkspacePage />} />
                    <Route path="/workspace/team" element={<SecurityTeamPage />} />
                    <Route path="/console" element={<ConsoleEntry />} />
                    <Route path="/console/invites/accept" element={<AcceptInvitePage />} />
                    <Route path="/console/:orgSlug" element={<ConsoleLayout />}>
                      <Route index element={<Navigate to="overview" replace />} />
                      <Route path="overview" element={<OverviewPage />} />
                      <Route path="applications" element={<ApplicationsPage />} />
                      <Route path="applications/:applicationId" element={<ApplicationDetailPage />} />
                      <Route path="security" element={<FindingsPage />} />
                      <Route path="security/findings/:findingId" element={<FindingDetailPage />} />
                      <Route path="members" element={<MembersPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
                    <Route path="/setup-2fa" element={<QRCodeSetup />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </UserSessionProvider>
            </TwoFactorAuthProvider>
          </BasicAuthProvider> 
      </div>
      {isConsole ? null : <Footer />}
    </div>
    </>
  );
}

export default App;
