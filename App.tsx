import React, { useState, useEffect, useRef } from 'react';

// ========== خدمة DeepSeek API ==========
class DeepSeekService {
  private apiKey: string = '';
  private readonly endpoint: string = 'https://api.deepseek.com/v1/chat/completions';

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('deepseek_api_key', key);
  }

  getApiKey(): string {
    return this.apiKey || localStorage.getItem('deepseek_api_key') || '';
  }

  clearApiKey(): void {
    this.apiKey = '';
    localStorage.removeItem('deepseek_api_key');
  }

  private getSystemMessage(mode: string): string {
    const messages: Record<string, string> = {
      'تفكير عميق': 'أنت مساعد برمجي خبير في التحليل العميق. فكر خطوة بخطوة، حلل المشكلة من جميع الجوانب، قدم حلولاً شاملة ومفصلة.',
      'تصحيح': 'أنت خبير في تصحيح الأخطاء البرمجية. ابحث عن الأخطاء بدقة، حدد نوع الخطأ (منطقي، تركيب، وقت التشغيل)، اشرح السبب، ثم قدم الحل الأمثل.',
      'تحسين': 'أنت خبير في تحسين الكود. قم بتحليل الكود الحالي، اقترح تحسينات للأداء، الكفاءة، القراءة، الأمان، وقابلية الصيانة.',
      'شرح': 'أنت معلم برمجة صبور. اشرح المفاهيم بطريقة مبسطة، استخدم التشبيهات من الحياة اليومية، قدم أمثلة عملية.',
      'اختبار': 'أنت خبير في كتابة الاختبارات. قم بتحليل الكود، حدد الحالات الحدية، اكتب اختبارات شاملة (unit tests، integration tests).',
      'تحويل': 'أنت خبير في تحويل الكود بين اللغات. حافظ على المنطق الأصلي، تأكد من صحة التحويل، اشرح الاختلافات بين اللغات.'
    };
    return messages[mode] || 'أنت مساعد برمجي مفيد ومتعاون.';
  }

  async sendMessage(message: string, mode: string = 'تفكير عميق'): Promise<any> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      return {
        error: true,
        message: '❌ مفتاح DeepSeek API مفقود!',
        details: 'يرجى إضافة مفتاح API في الإعدادات'
      };
    }

    if (!apiKey.startsWith('sk-')) {
      return {
        error: true,
        message: '❌ مفتاح API غير صالح!',
        details: 'مفتاح DeepSeek يجب أن يبدأ بـ sk-'
      };
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: this.getSystemMessage(mode) },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false
        })
      });

      if (!response.ok) {
        let errorMessage = 'فشل الاتصال بالخادم';
        if (response.status === 401) errorMessage = 'مفتاح API غير صالح';
        if (response.status === 429) errorMessage = 'تم تجاوز الحد المسموح';
        if (response.status === 404) errorMessage = 'رابط API غير صحيح';
        
        return {
          error: true,
          message: `❌ ${errorMessage}`,
          details: `رمز الخطأ: ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        return {
          error: false,
          message: data.choices[0].message.content,
          tokens: data.usage?.total_tokens || 0,
          model: data.model || 'deepseek-chat'
        };
      } else {
        return {
          error: true,
          message: '❌ لم يتم استقبال رد من الذكاء الاصطناعي',
          details: 'الاستجابة كانت فارغة'
        };
      }
    } catch (error: any) {
      return {
        error: true,
        message: '❌ فشل الاتصال بالإنترنت',
        details: error.message,
        networkError: true
      };
    }
  }

  async testConnection(): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, message: 'لا يوجد مفتاح API' };
    }
    
    const testResponse = await this.sendMessage('Hello', 'شرح');
    return {
      success: !testResponse.error,
      message: testResponse.error ? 'فشل الاختبار' : '✅ الاتصال ناجح!',
      details: testResponse
    };
  }
}

const deepSeekService = new DeepSeekService();

// ========== المكون الرئيسي ==========
const App: React.FC = () => {
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'ai', time?: string, loading?: boolean}>>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('تفكير عميق');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modes = ['تفكير عميق', 'تصحيح', 'تحسين', 'شرح', 'اختبار', 'تحويل'];

  // CSS داخلي ككائن JavaScript
  const styles = {
    appContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      direction: 'rtl' as const,
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    container: {
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      minHeight: 'calc(100vh - 40px)'
    },
    header: {
      background: 'linear-gradient(to right, #4a90e2, #5d6afb)',
      color: 'white',
      padding: '25px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '3px solid #357ae8'
    },
    headerContent: {
      flex: 1
    },
    headerTitle: {
      fontSize: '32px',
      margin: '0 0 8px 0',
      fontWeight: 'bold'
    },
    headerSubtitle: {
      fontSize: '16px',
      opacity: 0.9,
      margin: 0
    },
    settingsButton: {
      backgroundColor: 'white',
      color: '#4a90e2',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '25px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
    },
    settingsPanel: {
      backgroundColor: '#f8f9fa',
      padding: '25px',
      borderBottom: '2px solid #e3f2fd'
    },
    settingsTitle: {
      color: '#2c3e50',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '2px solid #4a90e2'
    },
    apiKeyInput: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      alignItems: 'center',
      flexWrap: 'wrap' as const
    },
    apiInput: {
      flex: 1,
      minWidth: '300px',
      padding: '15px',
      border: '2px solid #ddd',
      borderRadius: '10px',
      fontSize: '16px',
      transition: 'border 0.3s'
    },
    apiButtons: {
      display: 'flex',
      gap: '10px'
    },
    button: {
      padding: '15px 25px',
      border: 'none',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '14px'
    },
    buttonPrimary: {
      backgroundColor: '#4a90e2',
      color: 'white'
    },
    buttonSecondary: {
      backgroundColor: '#e74c3c',
      color: 'white'
    },
    buttonSuccess: {
      backgroundColor: '#28a745',
      color: 'white'
    },
    instructions: {
      backgroundColor: '#e3f2fd',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      borderRight: '5px solid #4a90e2'
    },
    instructionsList: {
      paddingRight: '20px',
      margin: '15px 0',
      lineHeight: 1.8
    },
    features: {
      backgroundColor: '#e8f5e9',
      padding: '15px',
      borderRadius: '10px',
      marginTop: '15px'
    },
    featuresList: {
      paddingRight: '20px',
      listStyleType: 'none'
    },
    statusBox: {
      backgroundColor: '#fff3cd',
      padding: '15px',
      borderRadius: '10px',
      textAlign: 'center' as const,
      border: '2px solid #ffc107',
      marginTop: '15px'
    },
    modesContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #e0e0e0'
    },
    modeButton: {
      padding: '12px 25px',
      border: '2px solid #4a90e2',
      backgroundColor: 'white',
      color: '#4a90e2',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s',
      fontSize: '14px'
    },
    modeButtonActive: {
      backgroundColor: '#4a90e2',
      color: 'white',
      boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)'
    },
    currentMode: {
      textAlign: 'center' as const,
      padding: '15px',
      backgroundColor: '#e3f2fd',
      fontSize: '18px',
      fontWeight: 'bold'
    },
    chatContainer: {
      height: '500px',
      overflowY: 'auto' as const,
      padding: '20px',
      backgroundColor: '#fafafa'
    },
    welcomeMessage: {
      textAlign: 'center' as const,
      padding: '50px 20px',
      color: '#666'
    },
    welcomeTitle: {
      color: '#4a90e2',
      marginBottom: '20px'
    },
    examples: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginTop: '30px',
      border: '2px dashed #4a90e2'
    },
    messagesList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px'
    },
    message: {
      padding: '20px',
      borderRadius: '15px',
      maxWidth: '85%',
      animation: 'fadeIn 0.3s ease'
    },
    userMessage: {
      backgroundColor: '#e3f2fd',
      marginRight: 'auto',
      borderBottomRightRadius: '5px'
    },
    aiMessage: {
      backgroundColor: '#f5f5f5',
      marginLeft: 'auto',
      borderBottomLeftRadius: '5px',
      borderRight: '5px solid #4a90e2'
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px',
      fontSize: '14px',
      color: '#666'
    },
    messageContent: {
      fontSize: '16px',
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const
    },
    loadingDots: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      padding: '20px'
    },
    dot: {
      animation: 'bounce 1.4s infinite ease-in-out both',
      fontSize: '24px',
      color: '#4a90e2'
    },
    inputContainer: {
      display: 'flex',
      gap: '15px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e0e0e0'
    },
    messageInput: {
      flex: 1,
      padding: '20px',
      border: '2px solid #ddd',
      borderRadius: '15px',
      fontSize: '16px',
      fontFamily: 'inherit',
      resize: 'none' as const,
      transition: 'border 0.3s',
      minHeight: '80px'
    },
    sendButton: {
      padding: '0 40px',
      background: 'linear-gradient(to right, #4a90e2, #5d6afb)',
      color: 'white',
      border: 'none',
      borderRadius: '15px',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      minWidth: '120px'
    },
    sendButtonDisabled: {
      background: '#cccccc',
      cursor: 'not-allowed'
    },
    footer: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderTop: '2px solid #e0e0e0',
      color: '#666'
    },
    testResult: {
      padding: '15px',
      borderRadius: '8px',
      marginTop: '15px',
      backgroundColor: '#e8f5e9',
      border: '2px solid #4caf50'
    },
    testResultError: {
      backgroundColor: '#ffebee',
      border: '2px solid #f44336'
    }
  };

  // تحميل المفتاح عند البدء
  useEffect(() => {
    const savedKey = deepSeekService.getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // التمرير للأسفل عند إضافة رسائل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) {
      alert('⚠️ يرجى إدخال رسالة');
      return;
    }

    if (!deepSeekService.getApiKey()) {
      alert('⚠️ يرجى إضافة مفتاح DeepSeek API أولاً في الإعدادات');
      setShowSettings(true);
      return;
    }

    const userMessage = input;
    setInput('');
    
    // إضافة رسالة المستخدم
    setMessages(prev => [...prev, {
      text: userMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsLoading(true);

    // الحصول على الرد
    const response = await deepSeekService.sendMessage(userMessage, mode);

    setIsLoading(false);

    // إزالة رسالة التحميل السابقة إن وجدت
    setMessages(prev => prev.filter(m => !m.loading));

    if (response.error) {
      setMessages(prev => [...prev, {
        text: `${response.message}\n\n${response.details || ''}`,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } else {
      setMessages(prev => [...prev, {
        text: response.message,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      alert('⚠️ يرجى إدخال مفتاح API');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      alert('⚠️ مفتاح DeepSeek يجب أن يبدأ بـ sk-');
      return;
    }

    deepSeekService.setApiKey(apiKey);
    alert('✅ تم حفظ مفتاح API بنجاح!');
    setTestResult(null);
  };

  const handleClearApiKey = () => {
    if (confirm('⚠️ هل تريد مسح مفتاح API؟ سيتم تعطيل التطبيق حتى تضيف مفتاحاً جديداً.')) {
      deepSeekService.clearApiKey();
      setApiKey('');
      setTestResult(null);
      setMessages([]);
      alert('🗑️ تم مسح المفتاح');
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      alert('⚠️ يرجى إدخال مفتاح API أولاً');
      return;
    }

    // حفظ المفتاح أولاً
    deepSeekService.setApiKey(apiKey);
    
    setTestResult({ message: '⏳ يجري اختبار الاتصال...' });
    
    const result = await deepSeekService.testConnection();
    setTestResult(result);
    
    if (result.success) {
      alert('✅ الاتصال بـ DeepSeek ناجح! يمكنك استخدام التطبيق الآن.');
    } else {
      alert('❌ فشل الاتصال. تحقق من المفتاح واتصالك بالإنترنت.');
    }
  };

  const copyDeepSeekLink = () => {
    navigator.clipboard.writeText('https://platform.deepseek.com/api_keys');
    alert('📋 تم نسخ رابط DeepSeek! قم بزيارة الموقع للحصول على المفتاح.');
  };

  // إضافة CSS للرسوم المتحركة
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    .message {
      animation: fadeIn 0.3s ease;
    }
    
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
  `;

  return (
    <div style={styles.appContainer}>
      <style>{animationStyles}</style>
      
      <div style={styles.container}>
        {/* الشريط العلوي */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.headerTitle}>🤖 المبرمج الثلاثي</h1>
            <p style={styles.headerSubtitle}>
              مساعد برمجي متعدد الشخصيات - مع <strong>DeepSeek AI المجاني</strong>
            </p>
          </div>
          <button 
            style={styles.settingsButton}
            onClick={() => setShowSettings(!showSettings)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ⚙️ {showSettings ? 'إغلاق الإعدادات' : 'الإعدادات'}
          </button>
        </header>

        {/* إعدادات API */}
        {showSettings && (
          <div style={styles.settingsPanel}>
            <h3 style={styles.settingsTitle}>🔧 إعدادات DeepSeek API</h3>
            
            <div style={styles.apiKeyInput}>
              <input
                type="text"
                placeholder="أدخل مفتاح DeepSeek API هنا (يبدأ بـ sk-...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={styles.apiInput}
                onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              
              <div style={styles.apiButtons}>
                <button 
                  onClick={handleSaveApiKey}
                  style={{ ...styles.button, ...styles.buttonPrimary }}
                >
                  💾 حفظ المفتاح
                </button>
                
                <button 
                  onClick={handleTestApiKey}
                  style={{ ...styles.button, ...styles.buttonSuccess }}
                >
                  🔗 اختبار الاتصال
                </button>
                
                <button 
                  onClick={handleClearApiKey}
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                >
                  🗑️ مسح المفتاح
                </button>
              </div>
            </div>

            {testResult && (
              <div style={{
                ...styles.testResult,
                ...(testResult.success ? {} : styles.testResultError)
              }}>
                <p><strong>{testResult.success ? '✅ نجح الاختبار' : '❌ فشل الاختبار'}</strong></p>
                <p>{testResult.message}</p>
              </div>
            )}

            <div style={styles.instructions}>
              <h4>📋 كيفية الحصول على المفتاح المجاني:</h4>
              <ol style={styles.instructionsList}>
                <li>اذهب إلى: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" style={{color: '#4a90e2', fontWeight: 'bold'}}>منصة DeepSeek</a></li>
                <li>سجل دخولك أو أنشئ حساب جديد (بالبريد الإلكتروني)</li>
                <li>من القائمة الجانبية، اختر <strong>API Keys</strong></li>
                <li>اضغط على <strong>Create new key</strong></li>
                <li>انسخ المفتاح (سيبدو مثل: <code>sk-xxxxxxxxxxxxxxxx</code>)</li>
                <li>الصقه في المربع أعلاه ثم اضغط "💾 حفظ المفتاح"</li>
              </ol>
              
              <button 
                onClick={copyDeepSeekLink}
                style={{ ...styles.button, ...styles.buttonPrimary, marginTop: '10px' }}
              >
                📋 نسخ رابط DeepSeek
              </button>
            </div>

            <div style={styles.features}>
              <h4>⭐ مميزات DeepSeek:</h4>
              <ul style={styles.featuresList}>
                <li>✅ <strong>مجاني بالكامل</strong>: 10 مليون رمز شهرياً (كثير جداً!)</li>
                <li>✅ <strong>يدعم العربية</strong>: يفهم ويجيب بالعربية بطلاقة</li>
                <li>✅ <strong>ممتاز في البرمجة</strong>: يفهم جميع لغات البرمجة</li>
                <li>✅ <strong>لا حاجة لبطاقة ائتمان</strong>: سجل واستخدم فوراً</li>
                <li>✅ <strong>سرعة عالية</strong>: يستجيب بسرعة</li>
              </ul>
            </div>

            <div style={styles.statusBox}>
              <p>الحالة: <strong>{deepSeekService.getApiKey() ? '✅ متصل' : '❌ غير متصل'}</strong></p>
              {deepSeekService.getApiKey() && (
                <p style={{marginTop: '10px', fontSize: '14px', color: '#856404'}}>
                  الحصة المجانية: <strong>10,000,000 رمز/شهر</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* خيارات الوضع */}
        <div style={styles.modesContainer}>
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                ...styles.modeButton,
                ...(mode === m ? styles.modeButtonActive : {})
              }}
              onMouseEnter={(e) => {
                if (mode !== m) e.currentTarget.style.backgroundColor = '#e3f2fd';
              }}
              onMouseLeave={(e) => {
                if (mode !== m) e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* عرض الوضع الحالي */}
        <div style={styles.currentMode}>
          <span style={{color: '#666', marginLeft: '10px'}}>الوضع الحالي:</span>
          <span style={{color: '#4a90e2'}}>{mode}</span>
        </div>

        {/* منطقة المحادثة */}
        <div style={styles.chatContainer}>
          {messages.length === 0 ? (
            <div style={styles.welcomeMessage}>
              <h2 style={styles.welcomeTitle}>👋 مرحباً بك في المبرمج الثلاثي!</h2>
              <p>💡 اختر وضعاً من الأعلى ثم اكتب سؤالك البرمجي</p>
              <p>🔧 <strong>يستخدم التطبيق DeepSeek AI المجاني</strong> (10 مليون رمز شهرياً)</p>
              
              <div style={styles.examples}>
                <p>🌐 أمثلة للاستخدام:</p>
                <ul style={{paddingRight: '20px', marginTop: '15px', textAlign: 'right'}}>
                  <li style={{marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderRight: '3px solid #4a90e2'}}>
                    "كيف أصلح هذا الخطأ في JavaScript: 'Uncaught TypeError'?"
                  </li>
                  <li style={{marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderRight: '3px solid #4a90e2'}}>
                    "حول هذا الكود من Python إلى Java"
                  </li>
                  <li style={{marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderRight: '3px solid #4a90e2'}}>
                    "اشرح مفهوم الـ async/await في JavaScript"
                  </li>
                  <li style={{marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderRight: '3px solid #4a90e2'}}>
                    "حسن من كفاءة هذا الخوارزم لفرز المصفوفات"
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.message,
                    ...(msg.sender === 'user' ? styles.userMessage : styles.aiMessage)
                  }}
                >
                  <div style={styles.messageHeader}>
                    <span style={{fontWeight: 'bold'}}>
                      {msg.sender === 'user' ? '👤 أنت' : '🤖 المساعد'}
                    </span>
                    <span style={{fontSize: '12px', color: '#888'}}>{msg.time}</span>
                  </div>
                  <div style={styles.messageContent}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div style={{...styles.message, ...styles.aiMessage}}>
                  <div style={styles.messageHeader}>
                    <span style={{fontWeight: 'bold'}}>🤖 المساعد</span>
                  </div>
                  <div style={styles.loadingDots}>
                    <span style={styles.dot}>●</span>
                    <span style={styles.dot}>●</span>
                    <span style={styles.dot}>●</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* إدخال الرسالة */}
        <div style={styles.inputContainer}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`اكتب سؤالك البرمجي هنا... (وضع: ${mode})`}
            style={styles.messageInput}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !deepSeekService.getApiKey() || isLoading}
            style={{
              ...styles.sendButton,
              ...((!input.trim() || !deepSeekService.getApiKey() || isLoading) ? styles.sendButtonDisabled : {}),
              opacity: (!input.trim() || !deepSeekService.getApiKey() || isLoading) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (input.trim() && deepSeekService.getApiKey() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 7px 20px rgba(74, 144, 226, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? '⏳ جاري الإرسال...' : '🚀 إرسال'}
          </button>
        </div>

        {/* تذييل الصفحة */}
        <footer style={styles.footer}>
          <p>⚡ يستخدم <strong>DeepSeek AI</strong> - مجاني 10 مليون رمز شهرياً</p>
          <p>🔗 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" style={{color: '#4a90e2', textDecoration: 'none', fontWeight: 'bold'}}>
            احصل على مفتاح API مجاني من هنا
          </a></p>
          <p style={{marginTop: '10px', fontSize: '12px', color: '#999'}}>
            المبرمج الثلاثي - مساعد برمجي متعدد الشخصيات
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;