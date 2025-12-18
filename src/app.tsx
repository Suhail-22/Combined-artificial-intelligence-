import React from 'react';
import './App.css';

function App() {
  console.log('✅ App component loaded');
  
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🎉 المبرمج الثلاثي يعمل!
      </h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>
        مساعد برمجي متعدد الشخصيات
      </p>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h3 style={{ color: '#10b981' }}>✅ التطبيق يعمل بنجاح</h3>
        <p>يمكنك الآن البدء في إضافة الميزات</p>
      </div>
    </div>
  );
}

export default App;  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setShowPreview(true);
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <Sidebar 
          onHelpClick={() => setShowHelp(true)}
          onNewChat={handleNewChat}
        />
        
        <main className="main-content">
          <WorkspacePanel 
            messages={messages}
            onPreview={handlePreview}
          />
          
          <div className="chat-container">
            <div className="messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <div className="welcome-icon">🤖</div>
                  <h2>مرحباً بك في المبرمج الثلاثي</h2>
                  <p>مساعد برمجي متعدد الشخصيات للتفكير العميق والتحليل</p>
                  <div className="welcome-tips">
                    <p>💡 <strong>ابدأ بـ:</strong></p>
                    <ul>
                      <li>"شرح هذا الكود..."</li>
                      <li>"صحح لي الخطأ في..."</li>
                      <li>"حول هذا الكود إلى..."</li>
                    </ul>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessageBubble
                    key={index}
                    message={msg.text}
                    sender={msg.sender}
                    avatar={msg.avatar}
                    onCopy={() => navigator.clipboard.writeText(msg.text)}
                  />
                ))
              )}
              
              {isLoading && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
                rows={3}
                dir="rtl"
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()}
                className="send-button"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    جاري الإرسال...
                  </>
                ) : 'إرسال'}
              </button>
            </div>
          </div>
        </main>

        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
        
        {showPreview && (
          <PreviewModal 
            content={previewContent}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
