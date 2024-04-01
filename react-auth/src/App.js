import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/login/LoginPage";
import { ForgotPassword } from "./components/forgot-password/ForgotPassword";
import { RegisterPage } from "./components/register/RegisterPage";
import { ReactFeatures } from "./components/app-features/ReactFeatures";
import { SendEmail } from "./components/mail/SendEmail";
import { ResetPassword } from "./components/reset-password/ResetPassword";
import HomePage from "./components/home/HomePage";
import "./App.css"
import { Footer } from "./components/footer/Footer";
import AuthProvider from "./context/auth/AuthContext";


function App() {
  return (
    <>
    <div className="app-container">
      <div className="routes-content" style={{ flex: 1, overflowY: 'auto' }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/react-features" element={<ReactFeatures />} />
            <Route path="/send-email" element={<SendEmail />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
          </Routes>
        </AuthProvider>
      </div>
      <Footer />
    </div>
    </>
  );
}

export default App;
