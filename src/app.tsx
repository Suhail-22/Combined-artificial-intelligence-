import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// استيراد المكونات من الجذر (باستخدام ../)
import ChatMessageBubble from '../ChatMessageBubble';
import Sidebar from '../Sidebar';
import WorkspacePanel from '../WorkspacePanel';
import HelpModal from '../HelpModal';
import PreviewModal from '../PreviewModal';
import { ErrorBoundary } from '../ErrorBoundary';
import { BOT_AVATAR, USER_AVATAR, API_URL } from '../constants';

// أنواع البيانات
interface Message {
  text: string;
  sender: 'user' | 'bot';
  avatar: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      text: input, 
      sender: 'user', 
      avatar: USER_AVATAR 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // محاكاة للرد (يمكن استبدالها بالاتصال الفعلي بالـ API)
      setTimeout(() => {
        const botMessage: Message = { 
          text: `تم استلام رسالتك: "${input}". هذا رد تجريبي.`, 
          sender: 'bot', 
          avatar: BOT_AVATAR 
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);

      // للاتصال الفعلي بالـ API (تفعيل لاحقاً):
      /*
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({ 
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: input }],
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      const botMessage: Message = { 
        text: data.choices[0].message.content, 
        sender: 'bot', 
        avatar: BOT_AVATAR 
      };
      setMessages(prev => [...prev, botMessage]);
      */
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { 
        text: 'عذراً، حدث خطأ في الاتصال. تأكد من إعداد مفتاح API.', 
        sender: 'bot', 
        avatar: BOT_AVATAR 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
