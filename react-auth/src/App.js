import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./components/login/LoginPage";
import { RegisterPage } from "./components/register/RegisterPage";
import HomePage from "./components/home/HomePage";
import "./App.css"


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Register" element={<RegisterPage />} />
      </Routes>
    </>
  );
}

export default App;
