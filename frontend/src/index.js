import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error (benign error from Radix UI components)
const resizeObserverErr = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (message === 'ResizeObserver loop completed with undelivered notifications.' ||
      message === 'ResizeObserver loop limit exceeded') {
    return true; // Suppress the error
  }
  if (resizeObserverErr) {
    return resizeObserverErr(message, source, lineno, colno, error);
  }
  return false;
};

// Also suppress the error from being caught by React error boundary
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('ResizeObserver loop') || 
      (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop'))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
