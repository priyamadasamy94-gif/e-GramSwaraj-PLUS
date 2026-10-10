import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { OptionsProvider } from './context/OptionsContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <OptionsProvider>
              <AuthProvider>
                <NotificationProvider>
                  {googleClientId ? (
                    <GoogleOAuthProvider clientId={googleClientId}>
                      <App />
                    </GoogleOAuthProvider>
                  ) : <App />}
                </NotificationProvider>
              </AuthProvider>
            </OptionsProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
