import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/login/LoginPage";
import { RegisterPage } from "./components/register/RegisterPage";
import { Features } from "./components/app-features/Features";
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
          <Route path="/features" element={<Features />} />
        </Routes>
      </div>
      <Footer />
    </div>
    </>
  );
}

export default App;
