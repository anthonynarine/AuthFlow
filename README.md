# 🔐 React Auth Client — Frontend for Django Authentication API

### 🌐 Live Demo  
**[onevone.net](https://onevone.net)**  

Modern React frontend for the **Django Auth API**, providing secure JWT-based authentication, two-factor (2FA) setup, password management, and session validation with an elegant, modular design.

---

## 🧱 Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend Framework | **React (Hooks + Context API)** |
| API Integration | **Axios** with interceptors for JWT & CSRF handling |
| Styling | **Vanilla CSS** |
| Authentication | **JWT (Simple JWT)** + **Two-Factor Authentication (2FA)** |
| Session Management | **Cookies (js-cookie)** |
| Backend | [**Django REST Framework Auth API**](https://github.com/anthonynarine/auth_api) |
| Deployment | Works seamlessly with production or dev URLs via `.env` configuration |

---

## ✨ Key Features

✅ **User Registration & Login** — Secure login and registration via Django Auth API.  
✅ **JWT Authentication** — Access/Refresh token flow with auto-refresh interceptors.  
✅ **Two-Factor Authentication (2FA)** — QR code setup and OTP verification.  
✅ **Forgot & Reset Password** — Email-based password recovery flow.  
✅ **Session Validation** — Automatically checks and maintains session state.  
✅ **Context-Driven Architecture** — Modular logic separation (BasicAuth, TwoFactorAuth, UserSession).  
✅ **Production-Safe** — Handles CSRF, token expiry, and environment-based URLs.

---

## ⚙️ Environment Variables

Create a `.env` file in your project root:

```bash
REACT_APP_USE_PRODUCTION_API=true
REACT_APP_PRODUCTION_URL=https://ant-django-auth-62cf01255868.herokuapp.com/api
REACT_APP_DEV_URL=http://127.0.0.1:8000/api
```

---

## 📂 Folder Structure

```
src/
│
├── components/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── SendEmail.jsx
│   ├── QRCodeSetup.jsx
│   ├── DropdownMenu.jsx
│   └── ReactFeatures.jsx
│
├── context/auth/
│   ├── BasicAuthContext.jsx
│   ├── TwoFactorAuthContext.jsx
│   └── UserSessionContext.jsx
│
├── hooks/
│   ├── useBasicAuth.jsx
│   ├── useTwoFactorAuth.jsx
│   ├── useUserSession.jsx
│   └── useGptRequest.jsx
│
├── interceptors/
│   └── axios.js
│
└── styles/
    └── ChatComponent.css
```

---

## 🔄 Authentication Flow

1. **Login** → `useBasicAuth` sends credentials → JWT issued.  
2. **2FA Check** → If required, user redirected to `QRCodeSetup` or `OTP` verification.  
3. **Token Management** → Axios interceptors store tokens in cookies and refresh automatically.  
4. **Session Validation** → `useUserSession` confirms active session with backend.  
5. **Logout** → Clears cookies and resets context state.

---

## 🧩 Context Architecture

| Context | Purpose |
|----------|----------|
| **BasicAuthContext** | Handles registration, login, logout, password reset |
| **TwoFactorAuthContext** | Manages QR code setup and OTP verification |
| **UserSessionContext** | Maintains authenticated session state and validation |

---

## 🚀 Getting Started

```bash
# 1️⃣ Install dependencies
npm install

# 2️⃣ Create .env file
touch .env

# 3️⃣ Start development server
npm start
```

Visit:  
👉 `http://localhost:3000`

---

## 🧠 Developer Notes

- All API URLs are centralized in `/interceptors/axios.js`.
- CSRF tokens and JWTs are auto-handled through cookies.
- The system gracefully handles refresh tokens and session expiry.
- Ideal for integration with multiple Django backends or microservices.

---

## 🛡️ License

© 2025 Anthony Narine. All rights reserved.  
This project is part of the **Lumen ecosystem** of authentication and reporting tools.

---

## 🧾 Related Repositories

| Project | Description |
|----------|-------------|
| [auth_integration](https://github.com/anthonynarine/auth_integration) | Django package for verifying external JWTs |
| [django_auth](https://github.com/anthonynarine/django_auth) | Central authentication API used by this frontend |
| [Lumen](https://github.com/anthonynarine/Lumen) | Full vascular reporting platform (production suite) |
