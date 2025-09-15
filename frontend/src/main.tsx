// import React from 'react' // Not needed for React 18+ JSX transform
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Filter out irrelevant console errors from browser extensions
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (
    message.includes('Host is not supported') ||
    message.includes('Host is not valid or supported') ||
    message.includes('Host is not in insights whitelist')
  ) {
    return; // Suppress these extension-related errors
  }
  originalConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)