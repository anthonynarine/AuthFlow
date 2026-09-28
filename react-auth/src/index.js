import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from "@tanstack/react-query";
import App from './App';
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./theme/palette.css";
import "./interceptors/axios"
import { queryClient } from "./app/queryClient";
import { purgeLegacyTokenCookies } from "./interceptors/tokenStorage";

// Tokens used to live in JS-readable cookies; nothing reads them any more.
purgeLegacyTokenCookies();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
