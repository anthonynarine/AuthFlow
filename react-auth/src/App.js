import { Route, Routes, useLocation } from "react-router-dom";
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
import { FounderHomePage } from "./components/workspace/FounderHomePage";
import { FounderIssuesPage } from "./components/workspace/FounderIssuesPage";
import { FounderIssueWorkspacePage } from "./components/workspace/FounderIssueWorkspacePage";
import { SecurityTeamPage } from "./components/workspace/SecurityTeamPage";
import { AppShell } from "./components/app-shell/AppShell";
import "./App.css"
import { Footer } from "./components/footer/Footer";
import BasicAuthProvider from "./context/auth/BasicAuthContext";
import TwoFactorAuthProvider from "./context/auth/TwoFactorAuthContext";
import { UserSessionProvider } from "./context/auth/UserSessionContext";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


// Signed-in pages render inside AppShell (sidebar layout) and skip the
// public site's footer and top padding.
const APP_PATH_PREFIXES = ["/workspace", "/security"];

function isAppPath(pathname) {
  return APP_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function App() {
  const { pathname } = useLocation();
  const inApp = isAppPath(pathname);

  return (
    <>
    <div className="app-container">
      <div className={`routes-content${inApp ? " routes-content--app" : ""}`} style={{ flex: 1, overflowY: 'auto' }}>
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
                    <Route element={<AppShell />}>
                      <Route path="/security" element={<SecurityObservatoryPage />} />
                      <Route path="/security-command" element={<SecurityCommandPage />} />
                      <Route path="/security-observatory" element={<SecurityObservatoryPage />} />
                      <Route path="/security-exercises" element={<SecurityExercisesPage />} />
                      <Route path="/security-learn" element={<SecurityLearnPage />} />
                      <Route path="/workspace" element={<FounderHomePage />} />
                      <Route path="/workspace/issues" element={<FounderIssuesPage />} />
                      <Route path="/workspace/issues/:id" element={<FounderIssueWorkspacePage />} />
                      <Route path="/workspace/team" element={<SecurityTeamPage />} />
                    </Route>
                    <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
                    <Route path="/setup-2fa" element={<QRCodeSetup />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </UserSessionProvider>
            </TwoFactorAuthProvider>
          </BasicAuthProvider> 
      </div>
      {!inApp && <Footer />}
    </div>
    </>
  );
}

export default App;
