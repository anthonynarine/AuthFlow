import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/login/LoginPage";
import { ForgotPassword } from "./components/forgot-password/ForgotPassword";
import { RegisterPage } from "./components/register/RegisterPage";
import { ReactFeatures } from "./components/app-features/ReactFeatures";
import ChatComponent from "./components/app-features/ChatComponent";
import { SendEmail } from "./components/mail/SendEmail";
import { ResetPassword } from "./components/reset-password/ResetPassword";
import { QRCodeSetup } from "./components/two-factor/2fa-setup/QRCodeSetup";
import HomePage from "./components/home/HomePage";
import "./App.css"
import { Footer } from "./components/footer/Footer";
import BasicAuthProvider from "./context/auth/BasicAuthContext";
import TwoFactorAuthProvider from "./context/auth/TwoFactorAuthContext";
import { UserSessionProvider } from "./context/auth/UserSessionContext";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


function App() {
  return (
    <>
    <div className="app-container">
      <div className="routes-content" style={{ flex: 1, overflowY: 'auto' }}>
      <ToastContainer />
          <BasicAuthProvider>
            <TwoFactorAuthProvider>
                <UserSessionProvider>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/react-features" element={<ReactFeatures />} />
                    <Route path="/chat-completion" element={<ChatComponent />} />
                    <Route path="/send-email" element={<SendEmail />} />
                    <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
                    <Route path="/setup-2fa" element={<QRCodeSetup />} />
                  </Routes>
                </UserSessionProvider>
            </TwoFactorAuthProvider>
          </BasicAuthProvider> 
      </div>
      <Footer />
    </div>
    </>
  );
}

export default App;
