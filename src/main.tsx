import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // ⬅️ أضف هذا إذا كان لديك ملف CSS

const rootElement = document.getElementById('root');

// تحقق إذا كان عنصر الجذر موجود
if (!rootElement) {
  throw new Error('Root element not found. Check your index.html file.');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ⬇️ **هذا هو التعديل المهم** ⬇️
// استبدل loading-splash بـ loading-container
const loadingContainer = document.querySelector('.loading-container');
if (loadingContainer) {
  loadingContainer.style.display = 'none';
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
