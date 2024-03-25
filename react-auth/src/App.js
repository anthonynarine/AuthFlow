import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/login/LoginPage";
import { ForgotPassword } from "./components/forgot-password/ForgotPassword";
import { RegisterPage } from "./components/register/RegisterPage";
import { ReactFeatures } from "./components/app-features/ReactFeatures";
import { SendEmail } from "./components/mail/SendEmail";
import HomePage from "./components/home/HomePage";
import "./App.css"
import { Footer } from "./components/footer/Footer";


function App() {
  return (
    <>
    <div className="app-container">
      <div className="routes-content" style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/react-features" element={<ReactFeatures />} />
          <Route path="/send-email" element={<SendEmail />} />
        </Routes>
      </div>
      <Footer />
    </div>
    </>
  );
}

export default App;
