import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import JSZip from 'jszip';
import { 
  Send, Scale, Code2, BrainCircuit, MessageSquare, Trophy, X, Loader2, Sparkles,
  Save, FolderPlus, Download, Play, Copy, Folder, Trash2, FileJson, 
  Menu, Bug, FileCode, BookOpen, TestTube, Eraser, Archive, ExternalLink,
  Mic, Paperclip, Plus, History, Settings, Moon, Sun, Monitor, Languages, Eye, AlertTriangle,
  User, Bot, Clock, ChevronDown, ChevronUp, Share2, Lightbulb
} from 'lucide-react';

// --- Types ---

interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  timestamp: number;
}

interface Folder {
  id: string;
  name: string;
  snippets: Snippet[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content?: string; // For user
  modelsData?: { // For model
    [key: number]: {
      text: string;
      loading: boolean;
      error: string | null;
    }
  };
  timestamp: number;
  comparison?: any;
}

interface Tool {
    id: string;
    icon: React.ReactNode;
    label: string;
    prompt: string;
}

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const downloadFile = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Constants & Translations ---

const TRANSLATIONS = {
  en: {
    appTitle: "Tri-Coder AI",
    subTitle: "Multi-Persona Coding Assistant",
    library: "Library",
    history: "History",
    settings: "Settings",
    newChat: "New Chat",
    newFolder: "New Folder",
    folderName: "Folder Name",
    save: "Save",
    saveToFolder: "Save to Folder",
    exportBackup: "Export Backup",
    importBackup: "Import Backup",
    downloadZip: "Download Project (ZIP)",
    inputPlaceholder: "Ask a coding question...",
    deepThinking: "Deep Thinking",
    deepThinkingOn: "Deep Thinking ON",
    judge: "Judge",
    judgeVerdict: "AI Verdict",
    winner: "Winner",
    waiting: "Waiting...",
    thinking: "Thinking...",
    error: "Error",
    theme: "Theme",
    language: "Language",
    voiceListening: "Listening...",
    fileAttached: "File attached",
    folders: "Folders",
    noHistory: "No history yet",
    preview: "Preview",
    you: "You",
    ai: "Tri-Coder",
    suggestions: "Suggestions",
    copy: "Copy",
    download: "Download",
    tools: {
      debug: "Debug",
      refactor: "Refactor",
      explain: "Explain",
      test: "Unit Test",
      convert: "Convert"
    },
    suggestedPrompts: [
      "Explain logic step-by-step",
      "Optimize this code",
      "Add detailed comments",
      "Write unit tests"
    ]
  },
  ar: {
    appTitle: "المبرمج الثلاثي",
    subTitle: "مساعد برمجي متعدد الشخصيات",
    library: "المكتبة",
    history: "السجل",
    settings: "الإعدادات",
    newChat: "محادثة جديدة",
    newFolder: "مجلد جديد",
    folderName: "اسم المجلد",
    save: "حفظ",
    saveToFolder: "حفظ في مجلد",
    exportBackup: "تصدير نسخة احتياطية",
    importBackup: "استعادة نسخة احتياطية",
    downloadZip: "تنزيل المشروع (ZIP)",
    inputPlaceholder: "اسأل سؤالاً برمجياً...",
    deepThinking: "تفكير عميق",
    deepThinkingOn: "التفكير العميق مفعل",
    judge: "تحكيم",
    judgeVerdict: "حكم الذكاء الاصطناعي",
    winner: "الفائز",
    waiting: "جاري الانتظار...",
    thinking: "جاري التفكير...",
    error: "خطأ",
    theme: "المظهر",
    language: "اللغة",
    voiceListening: "جاري الاستماع...",
    fileAttached: "تم إرفاق ملف",
    folders: "المجلدات",
    noHistory: "لا يوجد سجل سابق",
    preview: "معاينة",
    you: "أنت",
    ai: "المبرمج الثلاثي",
    suggestions: "اقتراحات",
    copy: "نسخ",
    download: "تنزيل",
    tools: {
      debug: "تصحيح",
      refactor: "تحسين",
      explain: "شرح",
      test: "اختبار",
      convert: "تحويل"
    },
    suggestedPrompts: [
      "اشرح المنطق خطوة بخطوة",
      "حسن أداء الكود",
      "أضف تعليقات توضيحية",
      "اكتب اختبارات للكود"
    ]
  }
};

const AI_MODELS_CONFIG = [
  {
    id: 'deepseek_style',
    name: 'Logic Master',
    shortName: 'Logic',
    sub: 'Architect',
    icon: <BrainCircuit className="w-4 h-4" />,
    baseSystemInstruction: "You are an expert software architect acting as a 'Logic Analyst'. When asked a coding question, DO NOT just write code. First, analyze the problem, explain the algorithm step-by-step, discuss time/space complexity, and then provide the solution.",
    colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  },
  {
    id: 'qwen_style',
    name: 'Code Ninja',
    shortName: 'Code',
    sub: 'Engineer',
    icon: <Code2 className="w-4 h-4" />,
    baseSystemInstruction: "You are a senior backend engineer acting as a 'Code Generator'. Provide highly optimized, production-ready, clean code. Do not provide lengthy explanations. Focus purely on syntax, performance, and best practices.",
    colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'gemma_style',
    name: 'Mentor',
    shortName: 'Mentor',
    sub: 'Teacher',
    icon: <MessageSquare className="w-4 h-4" />,
    baseSystemInstruction: "You are a friendly coding mentor. Explain concepts simply and clearly. Provide code that is easy to read and well-commented. Balance between explanation and implementation.",
    colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
  }
];

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-4 max-w-md">Please restart the application.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-purple-600 rounded-full font-bold">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Sub-Components ---

const PreviewModal = ({ isOpen, onClose, code }: { isOpen: boolean, onClose: () => void, code: string | null }) => {
  if (!isOpen || !code) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
         <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Preview</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
         </div>
         <div className="flex-1 bg-white relative">
            <iframe 
              srcDoc={code} 
              title="Preview" 
              className="w-full h-full border-0" 
              sandbox="allow-scripts"
            />
         </div>
      </div>
    </div>
  );
};

interface CodeBlockProps {
  content: string;
  folders: Folder[];
  onSaveSnippet: (folderId: string, code: string, lang: string) => void;
  onPreview: (code: string) => void;
  t: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, folders, onSaveSnippet, onPreview, t }) => {
  if (!content) return null;
  const parts = content.split(/(```[\w-]*\n[\s\S]*?```)/g);

  return (
    <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'txt';
          const code = lines.slice(1, -1).join('\n');
          const isWeb = ['html', 'css', 'javascript', 'js'].includes(lang.toLowerCase());

          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#0d1117] shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{lang}</span>
                <div className="flex items-center gap-1">
                  {isWeb && (
                    <button onClick={() => onPreview(code)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-emerald-500" title={t.preview}>
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(code)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-200 bg-transparent scrollbar-thin">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap mb-2">{part}</p>;
      })}
    </div>
  );
};

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  lang: 'en' | 'ar';
  folders: Folder[];
  onSaveSnippet: (folderId: string, code: string, lang: string) => void;
  onPreview: (code: string) => void;
  t: any;
  onCompare: (msg: ChatMessage) => void;
  onSuggestionClick: (text: string) => void;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ msg, lang, folders, onSaveSnippet, onPreview, t, onCompare, onSuggestionClick }) => {
  const isUser = msg.role === 'user';
  const [activeTab, setActiveTab] = useState(0);

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="flex items-end gap-2 flex-row-reverse">
             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                <User className="w-5 h-5 text-white" />
             </div>
             <div className="bg-purple-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md">
                <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
             </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 mr-12 text-right flex items-center justify-end gap-1">
             <Clock className="w-3 h-3" /> {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      </div>
    );
  }

  // AI Message
  const currentModelData = msg.modelsData?.[activeTab];
  const isFinished = !currentModelData?.loading && !currentModelData?.error && currentModelData?.text;

  return (
    <div className="flex justify-start mb-8 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100 w-full">
      <div className="w-full max-w-5xl">
        <div className="flex items-start gap-3">
           <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-white flex items-center justify-center shrink-0 shadow-lg mt-1">
              <Bot className="w-5 h-5 text-white dark:text-slate-900" />
           </div>
           
           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                 <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{t.ai}</span>
                 <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              {/* TABS for Mobile/Desktop Unified View */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                 
                 {/* Tab Header */}
                 <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-x-auto scrollbar-hide">
                    {AI_MODELS_CONFIG.map((config, idx) => (
                       <button 
                         key={config.id}
                         onClick={() => setActiveTab(idx)}
                         className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === idx 
                              ? `bg-white dark:bg-slate-900 ${config.colorClass.split(' ')[0]} border-b-2 ${config.colorClass.split(' ')[0].replace('text-', 'border-')}` 
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                         }`}
                       >
                          {config.icon}
                          <span className="hidden sm:inline">{config.name}</span>
                          <span className="sm:hidden">{config.shortName}</span>
                       </button>
                    ))}
                 </div>

                 {/* Tab Content */}
                 <div className="p-4 md:p-6 min-h-[150px] bg-white dark:bg-slate-900/50 relative">
                    {AI_MODELS_CONFIG.map((config, idx) => {
                       const data = msg.modelsData?.[idx];
                       if (activeTab !== idx) return null;

                       return (
                          <div key={idx} className="animate-in fade-in duration-200">
                             {data?.loading ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                                   <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-2" />
                                   <span className="text-xs text-slate-500">{t.thinking}</span>
                                </div>
                             ) : data?.error ? (
                                <div className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">{data.error}</div>
                             ) : (
                                <CodeBlock 
                                  content={data?.text || ''} 
                                  folders={folders} 
                                  onSaveSnippet={onSaveSnippet}
                                  onPreview={onPreview}
                                  t={t}
                                />
                             )}
                          </div>
                       );
                    })}
                 </div>

                 {/* Footer Actions (Visible if content exists) */}
                 {isFinished && (
                   <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-2 flex flex-wrap items-center justify-between gap-2">
                      
                      <div className="flex items-center gap-2">
                        {/* Copy Full Text */}
                        <button 
                          onClick={() => navigator.clipboard.writeText(currentModelData?.text || '')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" /> {t.copy}
                        </button>

                        {/* Download Full Text */}
                        <button 
                           onClick={() => downloadFile(`response_${msg.id}.txt`, currentModelData?.text || '')}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                           <Download className="w-3.5 h-3.5" /> {t.download}
                        </button>
                        
                        {/* Save to Folder (Entire Message) */}
                        <div className="relative group">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <FolderPlus className="w-3.5 h-3.5" /> {t.saveToFolder}
                          </button>
                          <div className="absolute left-0 bottom-full mb-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50">
                             {folders.length === 0 ? (
                               <div className="p-2 text-[10px] text-slate-500 italic">No folders</div>
                             ) : (
                               folders.map(f => (
                                 <button 
                                   key={f.id} 
                                   onClick={() => onSaveSnippet(f.id, currentModelData?.text || '', 'txt')} 
                                   className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 truncate first:rounded-t-lg last:rounded-b-lg"
                                 >
                                   {f.name}
                                 </button>
                               ))
                             )}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => onCompare(msg)}
                        className="text-xs flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-bold transition-colors shadow-sm"
                      >
                         <Scale className="w-3.5 h-3.5" /> {t.judge}
                      </button>
                   </div>
                 )}
              </div>

              {/* Suggestions (Lamp Icon) */}
              {isFinished && (
                <div className="mt-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
                  <div className="mt-1">
                    <Lightbulb className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t.suggestedPrompts.map((prompt: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => onSuggestionClick(prompt)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Result if exists */}
              {msg.comparison && (
                 <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                       <Trophy className="w-4 h-4" /> {t.judgeVerdict}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                       <span className="font-bold">{t.winner}:</span> {msg.comparison.winner}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{msg.comparison.reasoning}</p>
                    <div className="grid grid-cols-3 gap-2">
                       {msg.comparison.scores.map((s: any, i: number) => (
                          <div key={i} className="bg-white dark:bg-slate-800 p-2 rounded border border-yellow-100 dark:border-yellow-900/20 text-center">
                             <div className="text-[10px] text-slate-500 truncate">{s.model}</div>
                             <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.performance}/10</div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  // Safe initialization of AI
  const ai = useMemo(() => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
         return new GoogleGenAI({ apiKey: process.env.API_KEY });
      } else {
         console.warn("API Key might be missing or process.env is undefined.");
         // Fallback usually not possible without key, but prevents crash
         return null; 
      }
    } catch (e) {
      console.error("AI Init Error", e);
      return null;
    }
  }, []);

  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = TRANSLATIONS[lang];

  // Core Data
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [folders, setFolders] = useState<Folder[]>(() => {
    try { return JSON.parse(localStorage.getItem('tricoder_folders') || '[]'); } catch { return []; }
  });
  
  // UI State
  const [prompt, setPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mime: string} | null>(null);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [deepThinking, setDeepThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tools
  const tools: Tool[] = useMemo(() => [
    { id: 'debug', icon: <Bug className="w-4 h-4" />, label: t.tools.debug, prompt: "Find and fix bugs in the code. Think deeply about edge cases for the following request:" },
    { id: 'refactor', icon: <FileCode className="w-4 h-4" />, label: t.tools.refactor, prompt: "Refactor this code for better performance and readability:" },
    { id: 'explain', icon: <BookOpen className="w-4 h-4" />, label: t.tools.explain, prompt: "Explain this code or concept step-by-step in simple terms:" },
    { id: 'test', icon: <TestTube className="w-4 h-4" />, label: t.tools.test, prompt: "Write comprehensive unit tests for this code:" },
    { id: 'convert', icon: <ExternalLink className="w-4 h-4" />, label: t.tools.convert, prompt: "Convert this code to a different language/framework (infer target from context or provide best alternative):" },
  ], [t]);

  // Effects
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  useEffect(() => { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }, [lang]);
  
  useEffect(() => { localStorage.setItem('tricoder_folders', JSON.stringify(folders)); }, [folders]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers
  const handleSaveSnippet = (folderId: string, code: string, snippetLang: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? {
      ...f,
      snippets: [...f.snippets, { id: generateId(), title: `Snippet ${Date.now()}`, code, language: snippetLang, timestamp: Date.now() }]
    } : f));
    alert('Saved!');
  };

  const handleNewChat = () => {
    setMessages([]);
    setPrompt('');
    setAttachedFile(null);
  };

  const executeSubmit = (text: string, file: any) => {
    if ((!text.trim() && !file) || !ai) return;

    // 1. Clear Input immediately
    setPrompt('');
    setAttachedFile(null);

    // 2. Add User Message
    const userMsgId = generateId();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: (file ? `[File: ${file.name}] ` : '') + text,
      timestamp: Date.now()
    };

    // 3. Add Placeholder AI Message
    const aiMsgId = generateId();
    const newAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      timestamp: Date.now(),
      modelsData: {
        0: { text: '', loading: true, error: null },
        1: { text: '', loading: true, error: null },
        2: { text: '', loading: true, error: null }
      }
    };

    setMessages(prev => [...prev, newUserMsg, newAiMsg]);

    // 4. Trigger Generations
    AI_MODELS_CONFIG.forEach((config, index) => {
      generateForModel(index, text, file, aiMsgId, config.baseSystemInstruction);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmit(prompt, attachedFile);
  };

  const generateForModel = async (index: number, userPrompt: string, file: any, msgId: string, baseSysInstruction: string) => {
    if (!ai) return;
    try {
      let sys = baseSysInstruction;
      if (deepThinking) sys += "\n\nCRITICAL: ENABLE DEEP THINKING. Output a <thinking> block first.";
      if (lang === 'ar') sys += "\n\nCRITICAL: Output explanation in ARABIC.";

      const activeTool = tools.find(t => t.id === activeToolId);
      const finalPrompt = (activeTool ? `[TASK: ${activeTool.label} - ${activeTool.prompt}]\n\n` : "") + userPrompt;

      const parts: any[] = [];
      if (file) parts.push({ inlineData: { mimeType: file.mime, data: file.data } });
      parts.push({ text: finalPrompt });

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { systemInstruction: sys }
      });

      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.modelsData) {
          return {
            ...m,
            modelsData: {
              ...m.modelsData,
              [index]: { text: result.text, loading: false, error: null }
            }
          };
        }
        return m;
      }));

    } catch (err) {
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.modelsData) {
          return {
            ...m,
            modelsData: {
              ...m.modelsData,
              [index]: { text: '', loading: false, error: 'Failed to generate.' }
            }
          };
        }
        return m;
      }));
    }
  };

  const handleCompare = async (msg: ChatMessage) => {
    if (!ai || !msg.modelsData) return;
    try {
      const promptText = `
        Compare these 3 solutions:
        1: ${msg.modelsData[0].text}
        2: ${msg.modelsData[1].text}
        3: ${msg.modelsData[2].text}
        
        Pick a winner based on code quality and logic.
        ${lang === 'ar' ? 'Reasoning MUST be in Arabic.' : ''}
      `;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              winner: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              scores: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    model: { type: Type.STRING },
                    performance: { type: Type.NUMBER },
                    cleanliness: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      const comparison = JSON.parse(res.text || '{}');
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, comparison } : m));

    } catch (e) {
      alert("Comparison failed.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const b64 = await blobToBase64(file);
        setAttachedFile({ name: file.name, data: b64.split(',')[1], mime: file.type });
      } catch (e) { alert("File error"); }
    }
  };

  const handleBackupZip = async () => {
    const zip = new JSZip();
    folders.forEach(f => {
       f.snippets.forEach(s => {
          zip.file(`${f.name}/${s.title}.${s.language}`, s.code);
       });
    });
    const blob = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tricoder-backup.zip';
    a.click();
  };

  // Render
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans">
        
        {/* Header */}
        <header className="h-14 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
               <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
             </button>
             <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h1 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">{t.appTitle}</h1>
             </div>
           </div>
           <button onClick={handleNewChat} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
           </button>
        </header>

        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
             <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                   <span className="font-bold">{t.settings}</span>
                   <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">{t.language}</h3>
                      <div className="flex gap-2">
                         <button onClick={() => setLang('en')} className={`flex-1 py-2 text-xs rounded border ${lang === 'en' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'border-slate-200 dark:border-slate-700'}`}>English</button>
                         <button onClick={() => setLang('ar')} className={`flex-1 py-2 text-xs rounded border ${lang === 'ar' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'border-slate-200 dark:border-slate-700'}`}>العربية</button>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">{t.theme}</h3>
                      <div className="flex gap-2">
                         <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded border flex justify-center ${theme === 'light' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-slate-200 dark:border-slate-700'}`}><Sun className="w-4 h-4" /></button>
                         <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded border flex justify-center ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}><Moon className="w-4 h-4" /></button>
                         <button onClick={() => setTheme('system')} className={`flex-1 py-2 rounded border flex justify-center ${theme === 'system' ? 'border-slate-500 bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700'}`}><Monitor className="w-4 h-4" /></button>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">{t.folders}</h3>
                      <div className="space-y-2">
                        {folders.map(f => (
                           <div key={f.id} className="text-sm flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                              <Folder className="w-4 h-4 text-yellow-500" /> {f.name} <span className="text-xs text-slate-400">({f.snippets.length})</span>
                           </div>
                        ))}
                        {folders.length === 0 && <p className="text-xs text-slate-500 italic">Empty</p>}
                      </div>
                   </div>
                   
                   <button onClick={handleBackupZip} className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200">
                      <Archive className="w-4 h-4" /> {t.downloadZip}
                   </button>
                </div>
             </div>
             <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
           {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 pointer-events-none">
                 <BrainCircuit className="w-24 h-24 mb-4" />
                 <p className="text-xl font-bold">{t.appTitle}</p>
                 <p className="text-sm">{t.subTitle}</p>
              </div>
           ) : (
             messages.map(msg => (
               <ChatMessageBubble 
                  key={msg.id} 
                  msg={msg} 
                  lang={lang} 
                  folders={folders} 
                  onSaveSnippet={handleSaveSnippet} 
                  onPreview={setPreviewContent}
                  onCompare={handleCompare}
                  onSuggestionClick={(txt) => executeSubmit(txt, null)}
                  t={t} 
               />
             ))
           )}
           <div ref={scrollEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-20">
           <div className="max-w-4xl mx-auto">
              
              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                 {tools.map(tool => (
                    <button 
                      key={tool.id} 
                      onClick={() => setActiveToolId(activeToolId === tool.id ? null : tool.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${activeToolId === tool.id ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                    >
                       {tool.icon} {tool.label}
                    </button>
                 ))}
                 <button 
                    onClick={() => setDeepThinking(!deepThinking)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${deepThinking ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                 >
                    <BrainCircuit className="w-3.5 h-3.5" /> {deepThinking ? t.deepThinkingOn : t.deepThinking}
                 </button>
              </div>

              {/* Input Box */}
              <form onSubmit={handleSubmit} className="relative group">
                 {attachedFile && (
                    <div className="absolute -top-10 left-0 flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-t-lg text-xs text-slate-700 dark:text-slate-300 border border-b-0 border-slate-300 dark:border-slate-700">
                       <Paperclip className="w-3 h-3" /> <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                       <button type="button" onClick={() => setAttachedFile(null)}><X className="w-3 h-3 hover:text-red-500" /></button>
                    </div>
                 )}
                 
                 <div className="relative">
                    <input 
                      type="text" 
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder={isListening ? t.voiceListening : t.inputPlaceholder}
                      className={`w-full bg-slate-100 dark:bg-slate-900 border text-slate-900 dark:text-slate-100 rounded-2xl pl-12 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${attachedFile ? 'rounded-tl-none' : ''} ${isListening ? 'border-red-500 animate-pulse' : 'border-slate-200 dark:border-slate-800'}`}
                    />
                    
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
                       <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                          <Paperclip className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                       <button type="button" onClick={() => setIsListening(!isListening)} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Mic className="w-5 h-5" />
                       </button>
                       <button disabled={(!prompt.trim() && !attachedFile) || !ai} type="submit" className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 transition-all active:scale-95">
                          <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </form>
           </div>
        </div>

        {/* Preview Modal */}
        <PreviewModal isOpen={!!previewContent} onClose={() => setPreviewContent(null)} code={previewContent} />

      </div>
    </ErrorBoundary>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);