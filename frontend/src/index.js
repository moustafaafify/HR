import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Patch ResizeObserver to prevent the "loop completed" error
// This error is benign and caused by Radix UI components
const RO = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends RO {
  constructor(callback) {
    super((entries, observer) => {
      // Use requestAnimationFrame to defer the callback
      window.requestAnimationFrame(() => {
        try {
          callback(entries, observer);
        } catch (e) {
          // Silently ignore ResizeObserver errors
        }
      });
    });
  }
};

// Suppress ResizeObserver errors from window.onerror
window.addEventListener('error', (event) => {
  if (event.message?.includes?.('ResizeObserver')) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return true;
  }
});

// Suppress console.error for ResizeObserver
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorString = String(args[0] || '');
  if (errorString.includes('ResizeObserver')) {
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
