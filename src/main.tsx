import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// ✅ أبسط نسخة تعمل بدون مشاكل
const rootElement = document.getElementById('root');

if (!rootElement) {
  // Fallback بسيط
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: system-ui;">
      <h2 style="color: #2563eb">المبرمج الثلاثي</h2>
      <p>خطأ: لم يتم العثور على عنصر الجذر</p>
    </div>
  `;
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// إخفاء شاشة التحميل
setTimeout(() => {
  const loading = document.querySelector('.loading-container');
  if (loading) loading.remove();
}, 100);
