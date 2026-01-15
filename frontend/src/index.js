import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error (benign error from Radix UI components)
// This error doesn't affect functionality and is safe to ignore
const isResizeObserverError = (message) => {
  return message?.includes?.('ResizeObserver loop') || 
         message === 'ResizeObserver loop completed with undelivered notifications.' ||
         message === 'ResizeObserver loop limit exceeded';
};

// Handle window.onerror
window.onerror = function (message, source, lineno, colno, error) {
  if (isResizeObserverError(message)) {
    return true; // Suppress the error
  }
  return false;
};

// Handle unhandled errors via event listener
window.addEventListener('error', function(event) {
  if (isResizeObserverError(event.message)) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return true;
  }
});

// Suppress console.error for ResizeObserver
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorString = args[0]?.toString?.() || '';
  if (isResizeObserverError(errorString)) {
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
