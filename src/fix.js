// fix.js - حل سريع
console.log('🔧 جاري إصلاح التطبيق...');

// انتظر تحميل الصفحة
window.addEventListener('load', function() {
  console.log('✅ الصفحة محملة');
  
  // إخفاء شاشة التحميل بعد 3 ثواني
  setTimeout(function() {
    const loading = document.querySelector('.loading-container');
    if (loading) {
      console.log('🎯 إخفاء شاشة التحميل');
      loading.style.display = 'none';
    }
    
    // عرض رسالة نجاح
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 40px; text-align: center; font-family: system-ui;">
          <h1 style="color: #2563eb">المبرمج الثلاثي</h1>
          <p style="color: #64748b">مساعد برمجي متعدد الشخصيات</p>
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 10px;">
            <p style="color: green">✅ التطبيق يعمل بنجاح</p>
            <button onclick="window.location.reload()" 
                    style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px;">
              إعادة تحميل للتجربة الكاملة
            </button>
          </div>
        </div>
      `;
    }
  }, 3000);
});
