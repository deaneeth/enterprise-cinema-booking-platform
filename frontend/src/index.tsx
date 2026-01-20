// index.tsx
// Application entry point that renders the App component to the DOM
// This file initializes the React application

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress cross-origin "Script error" from PayPal SDK in development
// These errors occur because PayPal scripts are loaded from a different origin
// and browsers mask the actual error message for security reasons
if (process.env.NODE_ENV === "development") {
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Suppress generic "Script error" from cross-origin scripts (PayPal SDK)
    if (message === "Script error." && !source) {
      console.warn("[Suppressed] Cross-origin script error (likely PayPal SDK)");
      return true; // Prevents React error overlay
    }
    // Call original handler for other errors
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root element with id="root" not found');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
