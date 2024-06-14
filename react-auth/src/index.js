import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import "./interceptors/axios"


console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_DEV_URL:', process.env.REACT_APP_DEV_URL);
console.log('REACT_APP_PRODUCTION_URL:', process.env.REACT_APP_PRODUCTION_URL);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

