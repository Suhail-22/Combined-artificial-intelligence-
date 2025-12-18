import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 بدء تحميل المبرمج الثلاثي...');

// تأخير قصير للتأكد من تحميل DOM
setTimeout(() => {
  try {
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      console.error('❌ لم يتم العثور على عنصر #root');
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: system-ui;">
          <h2 style="color: #ef4444">خطأ: عنصر الجذر غير موجود</h2>
          <p>تحقق من ملف index.html</p>
        </div>
      `;
      return;
    }
    
    console.log('✅ عنصر #root موجود، جاري تحميل React...');
    
    // إخفاء شاشة التحميل
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
      console.log('✅ إخفاء شاشة التحميل...');
      loadingContainer.style.opacity = '0';
      setTimeout(() => {
        if (loadingContainer.parentNode) {
          loadingContainer.parentNode.removeChild(loadingContainer);
        }
      }, 300);
    }
    
    // تحميل React
    const root = createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('🎉 React تم تحميله بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تحميل React:', error);
    
    // عرض رسالة خطأ للمستخدم
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-title">خطأ في تحميل التطبيق</div>
          <div class="error-message">
            ${error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
          </div>
          <button class="retry-button" onclick="window.location.reload()">
            إعادة المحاولة
          </button>
        </div>
      `;
    }
  }
}, 100); // تأخير 100ms للتأكد من تحميل الصفحة
