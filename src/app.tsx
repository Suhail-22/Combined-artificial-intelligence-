import React from 'react';
import './index.css';

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <h1 style={{ color: '#2563eb' }}>المبرمج الثلاثي</h1>
      <p style={{ color: '#64748b' }}>مساعد برمجي متعدد الشخصيات</p>
      <div style={{ 
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p>✅ التطبيق يعمل بنجاح!</p>
      </div>
    </div>
  );
}

export default App;
