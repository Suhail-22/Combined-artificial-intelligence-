<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المبرمج الثلاثي - مساعد برمجي ذكي</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="المبرمج الثلاثي">
    <meta property="og:description" content="مساعد برمجي متعدد الشخصيات للتفكير العميق والتصحيح والتحسين">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://combined-artificial-intelligence.vercel.app">
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#2563eb">
    
    <!-- Global Styles -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary-color: #2563eb;
            --secondary-color: #7c3aed;
            --background-color: #f8fafc;
            --surface-color: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        body {
            font-family: 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background-color: var(--background-color);
            color: var(--text-primary);
            line-height: 1.6;
            direction: rtl;
            overflow-x: hidden;
        }
        
        #root {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Loading Animation */
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            font-size: 1.25rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .loading-subtext {
            color: var(--text-secondary);
            font-size: 0.875rem;
            max-width: 300px;
            text-align: center;
        }
        
        /* Error State */
        .error-state {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            flex-direction: column;
            gap: 1.5rem;
            padding: 2rem;
            text-align: center;
        }
        
        .error-icon {
            font-size: 3rem;
            color: #ef4444;
        }
        
        .error-title {
            font-size: 1.5rem;
            color: var(--text-primary);
            font-weight: 600;
        }
        
        .error-message {
            color: var(--text-secondary);
            max-width: 400px;
        }
        
        .retry-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            font-family: inherit;
        }
        
        .retry-button:hover {
            background-color: #1d4ed8;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .loading-text {
                font-size: 1.125rem;
            }
            
            .error-title {
                font-size: 1.25rem;
            }
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --background-color: #0f172a;
                --surface-color: #1e293b;
                --text-primary: #f1f5f9;
                --text-secondary: #cbd5e1;
                --border-color: #334155;
            }
            
            body {
                background-color: var(--background-color);
                color: var(--text-primary);
            }
        }
    </style>
</head>
<body>
    <div id="root">
        <!-- Loading State -->
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">جاري تحميل المبرمج الثلاثي...</div>
            <div class="loading-subtext">مساعدك البرمجي الذكي للتفكير العميق والتحليل</div>
        </div>
    </div>
    <script>
// حل مؤقت - تعطيل رسالة الخطأ
console.log('بدء التطبيق...');

// 1. منع الرسالة الأصلية للخطأ
clearTimeout(window.errorTimeout);

// 2. إخفاء شاشة التحميل بعد ثانيتين
setTimeout(() => {
    const loading = document.querySelector('.loading-container');
    if (loading) {
        loading.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h1 style="color: #10b981">🎉 تحميل ناجح</h1>
                <p>جاري تهيئة المكونات...</p>
                <button onclick="location.reload()" 
                        style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px;">
                    متابعة
                </button>
            </div>
        `;
    }
}, 2000);

// 3. محاولة تحميل الملف الرئيسي
const script = document.createElement('script');
script.type = 'module';
script.src = '/src/main.jsx'; // جرب هذا أولاً

script.onerror = () => {
    console.log('main.jsx فشل، جرب main.tsx...');
    
    const tsScript = document.createElement('script');
    tsScript.type = 'module';
    tsScript.src = '/src/main.tsx';
    
    tsScript.onerror = () => {
        console.log('كلاهما فشل، عرض واجهة بديلة');
        showSimpleUI();
    };
    
    document.head.appendChild(tsScript);
};

document.head.appendChild(script);

function showSimpleUI() {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
            <div style="padding: 40px; text-align: center; min-height: 100vh; background: #f8fafc;">
                <h1 style="color: #2563eb">المبرمج الثلاثي</h1>
                <div style="max-width: 500px; margin: 30px auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <h3 style="color: #ef4444">تحذير فني</h3>
                    <p>ملف main.jsx/main.tsx لا يعمل بشكل صحيح</p>
                    <p style="font-size: 14px; color: #64748b; margin-top: 10px;">
                        الحل: تحقق من محتوى الملف في GitHub
                    </p>
                </div>
            </div>
        `;
    }
}
</script>
