import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ChatMessageBubble from './ChatMessageBubble';
import Sidebar from './Sidebar';
import WorkspacePanel from './WorkspacePanel';
import HelpModal from './HelpModal';
import PreviewModal from './PreviewModal';
import { ErrorBoundary } from './ErrorBoundary';
import { BOT_AVATAR, USER_AVATAR, API_URL } from './constants';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { text: input, sender: 'user', avatar: USER_AVATAR };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      
      const data = await response.json();
      const botMessage = { text: data.reply, sender: 'bot', avatar: BOT_AVATAR };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { text: 'عذراً، حدث خطأ في الاتصال', sender: 'bot', avatar: BOT_AVATAR };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <Sidebar 
          onHelpClick={() => setShowHelp(true)}
          onNewChat={() => setMessages([])}
        />
        
        <main className="main-content">
          <WorkspacePanel 
            messages={messages}
            onPreview={(content) => {
              setPreviewContent(content);
              setShowPreview(true);
            }}
          />
          
          <div className="chat-container">
            <div className="messages">
              {messages.map((msg, index) => (
                <ChatMessageBubble
                  key={index}
                  message={msg.text}
                  sender={msg.sender}
                  avatar={msg.avatar}
                  onCopy={() => navigator.clipboard.writeText(msg.text)}
                />
              ))}
              {isLoading && (
                <div className="typing-indicator">
                  <span>●</span><span>●</span><span>●</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                rows="3"
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()}
                className="send-button"
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </div>
          </div>
        </main>

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
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
