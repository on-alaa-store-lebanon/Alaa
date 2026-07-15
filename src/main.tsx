import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe global error boundary interception to gracefully log sandboxed environment exceptions
if (typeof window !== "undefined") {
  window.onerror = function (message, source, lineno, colno, error) {
    console.warn("Intercepted uncaught runtime exception:", message, "at", source, lineno, colno);
    return true; // Prevents default browser error bubbling and blank error screen
  };

  window.onunhandledrejection = function (event) {
    console.warn("Intercepted unhandled promise rejection:", event.reason);
    event.preventDefault(); // Prevents promise rejection from bubbling up as uncaught
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
