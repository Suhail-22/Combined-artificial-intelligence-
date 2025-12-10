import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import JSZip from 'jszip';
import { 
  Send, Scale, Code2, BrainCircuit, MessageSquare, Trophy, X, Loader2, Sparkles,
  Save, FolderPlus, Download, Play, Copy, Folder, Trash2, FileJson, 
  Menu, Bug, FileCode, BookOpen, TestTube, Eraser, Archive, ExternalLink,
  Mic, Paperclip, Plus, History, Settings, Moon, Sun, Monitor, Languages, Eye
} from 'lucide-react';

// --- Constants & Translations ---

const TRANSLATIONS = {
  en: {
    appTitle: "Tri-Coder AI",
    subTitle: "Powered by Gemini • Multi-Persona Simulation",
    library: "Library",
    history: "History",
    settings: "Settings",
    newChat: "New Chat",
    newFolder: "New Folder",
    folderName: "Folder Name",
    save: "Save",
    exportBackup: "Export Backup",
    importBackup: "Import Backup",
    downloadZip: "Download Project (ZIP)",
    inputPlaceholder: "Ask a coding question or upload a file...",
    deepThinking: "Deep Thinking",
    deepThinkingOn: "Deep Thinking ON",
    judge: "Smart Judge",
    judgeVerdict: "AI Judge Verdict",
    winner: "Winner",
    performance: "Performance",
    cleanliness: "Code Cleanliness",
    waiting: "Waiting for prompt...",
    thinking: "Thinking...",
    error: "Error generating response",
    theme: "Theme",
    language: "Language",
    voiceListening: "Listening...",
    fileAttached: "File attached",
    folders: "Folders",
    noHistory: "No history yet",
    preview: "Preview",
    tools: {
      debug: "Debug",
      refactor: "Refactor",
      explain: "Explain",
      test: "Unit Test",
      convert: "Convert"
    }
  },
  ar: {
    appTitle: "المبرمج الثلاثي",
    subTitle: "مدعوم بواسطة Gemini • محاكاة شخصيات متعددة",
    library: "المكتبة",
    history: "السجل",
    settings: "الإعدادات",
    newChat: "محادثة جديدة",
    newFolder: "مجلد جديد",
    folderName: "اسم المجلد",
    save: "حفظ",
    exportBackup: "تصدير نسخة احتياطية",
    importBackup: "استعادة نسخة احتياطية",
    downloadZip: "تنزيل المشروع (ZIP)",
    inputPlaceholder: "اسأل سؤالاً برمجياً أو ارفع ملفاً...",
    deepThinking: "تفكير عميق",
    deepThinkingOn: "التفكير العميق مفعل",
    judge: "الحاكم الذكي",
    judgeVerdict: "حكم الذكاء الاصطناعي",
    winner: "الفائز",
    performance: "الأداء",
    cleanliness: "نظافة الكود",
    waiting: "بانتظار السؤال...",
    thinking: "جاري التفكير...",
    error: "حدث خطأ أثناء التوليد",
    theme: "المظهر",
    language: "اللغة",
    voiceListening: "جاري الاستماع...",
    fileAttached: "تم إرفاق ملف",
    folders: "المجلدات",
    noHistory: "لا يوجد سجل سابق",
    preview: "معاينة",
    tools: {
      debug: "تصحيح",
      refactor: "تحسين",
      explain: "شرح",
      test: "اختبار",
      convert: "تحويل"
    }
  }
};

const AI_MODELS_CONFIG = [
  {
    id: 'deepseek_style',
    name: 'Logic Master',
    sub: '(DeepSeek Style)',
    icon: <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    baseSystemInstruction: "You are an expert software architect acting as a 'Logic Analyst'. When asked a coding question, DO NOT just write code. First, analyze the problem, explain the algorithm step-by-step, discuss time/space complexity, and then provide the solution.",
    color: 'border-purple-500/30 bg-purple-50 dark:bg-purple-900/10'
  },
  {
    id: 'qwen_style',
    name: 'Code Ninja',
    sub: '(Qwen Coder Style)',
    icon: <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    baseSystemInstruction: "You are a senior backend engineer acting as a 'Code Generator'. Provide highly optimized, production-ready, clean code. Do not provide lengthy explanations. Focus purely on syntax, performance, and best practices.",
    color: 'border-blue-500/30 bg-blue-50 dark:bg-blue-900/10'
  },
  {
    id: 'gemma_style',
    name: 'Helpful Mentor',
    sub: '(Phi/Gemma Style)',
    icon: <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    baseSystemInstruction: "You are a friendly coding mentor. Explain concepts simply and clearly. Provide code that is easy to read and well-commented. Balance between explanation and implementation.",
    color: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10'
  }
];

// Initialize GenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  responses: { 0: string; 1: string; 2: string };
}

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const downloadFile = (filename, content) => {
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

// --- Components ---

const PreviewModal = ({ isOpen, onClose, code }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl transition-colors">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-500" /> Live Preview
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500 dark:text-slate-400 hover:text-red-500" /></button>
        </div>
        <div className="flex-1 bg-white relative">
          <iframe 
            srcDoc={code}
            className="w-full h-full border-none"
            title="Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose, folders, setFolders, history, setHistory, onLoadHistory, onRestore, onBackupZip, lang, setLang, theme, setTheme, t }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'history'>('library');
  const [newFolderName, setNewFolderName] = useState('');

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders([...folders, { id: generateId(), name: newFolderName, snippets: [] }]);
    setNewFolderName('');
  };

  const deleteFolder = (id) => {
    if (confirm('Delete this folder?')) setFolders(folders.filter(f => f.id !== id));
  };

  const deleteSnippet = (folderId, snippetId) => {
    setFolders(folders.map(f => {
      if (f.id !== folderId) return f;
      return { ...f, snippets: f.snippets.filter(s => s.id !== snippetId) };
    }));
  };

  const handleExportBackup = () => {
    const data = JSON.stringify({ folders, history });
    downloadFile(`tricoder_backup_${new Date().toISOString().slice(0,10)}.json`, data);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result as string);
        if (data.folders) onRestore(data.folders);
        if (data.history) setHistory(data.history);
        alert('Restored successfully!');
      } catch (err) { alert('Error parsing backup.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`fixed inset-y-0 ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} w-80 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}>
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Menu className="w-5 h-5" /> Menu
        </h2>
        <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'library' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
        >
          <Folder className="w-4 h-4" /> {t.library}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
        >
          <History className="w-4 h-4" /> {t.history}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">
        
        {activeTab === 'library' ? (
          <>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t.folderName}
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
              />
              <button onClick={createFolder} className="bg-purple-600 text-white p-1 rounded hover:bg-purple-500">
                <FolderPlus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
               {folders.map(folder => (
                <div key={folder.id} className="space-y-1">
                   <div className="flex items-center justify-between font-medium text-sm group">
                     <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                       <Folder className="w-4 h-4 text-yellow-500" /> {folder.name}
                     </div>
                     <button onClick={() => deleteFolder(folder.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                   </div>
                   <div className="pl-4 space-y-1">
                     {folder.snippets.map(s => (
                       <div key={s.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs flex justify-between items-center group">
                         <span className="truncate w-24">{s.title}</span>
                         <div className="flex gap-2 opacity-50 group-hover:opacity-100">
                           <button onClick={() => downloadFile(`${s.title}.${s.language}`, s.code)}><Download className="w-3 h-3 text-blue-500" /></button>
                           <button onClick={() => deleteSnippet(folder.id, s.id)}><X className="w-3 h-3 text-red-500" /></button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
               ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {history.length === 0 && <p className="text-center text-slate-500 text-xs">{t.noHistory}</p>}
            {history.slice().reverse().map(item => (
              <button 
                key={item.id} 
                onClick={() => onLoadHistory(item)}
                className="w-full text-left bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="font-medium text-xs text-slate-700 dark:text-slate-300 mb-1 line-clamp-2">{item.prompt}</div>
                <div className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Settings Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3">
         
         <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2"><Languages className="w-4 h-4" /> {t.language}</span>
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded p-1">
              <button onClick={() => setLang('en')} className={`px-2 rounded ${lang === 'en' ? 'bg-white dark:bg-slate-700 shadow text-black dark:text-white' : ''}`}>EN</button>
              <button onClick={() => setLang('ar')} className={`px-2 rounded ${lang === 'ar' ? 'bg-white dark:bg-slate-700 shadow text-black dark:text-white' : ''}`}>عربي</button>
            </div>
         </div>

         <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> {t.theme}</span>
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded p-1">
               <button onClick={() => setTheme('light')} className={`p-1 rounded ${theme === 'light' ? 'bg-white shadow text-yellow-500' : ''}`}><Sun className="w-3 h-3" /></button>
               <button onClick={() => setTheme('dark')} className={`p-1 rounded ${theme === 'dark' ? 'bg-slate-700 shadow text-blue-300' : ''}`}><Moon className="w-3 h-3" /></button>
               <button onClick={() => setTheme('system')} className={`p-1 rounded ${theme === 'system' ? 'bg-slate-600 shadow text-white' : ''}`}><Monitor className="w-3 h-3" /></button>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={handleExportBackup} className="bg-slate-200 dark:bg-slate-800 text-xs py-2 rounded flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">
              <Save className="w-3 h-3" /> {t.exportBackup}
            </button>
            <label className="bg-slate-200 dark:bg-slate-800 text-xs py-2 rounded flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer">
              <FileJson className="w-3 h-3" /> {t.importBackup}
              <input type="file" onChange={handleImportBackup} accept=".json" className="hidden" />
            </label>
         </div>
         <button onClick={onBackupZip} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded text-xs flex items-center justify-center gap-2 font-semibold">
           <Archive className="w-3 h-3" /> {t.downloadZip}
         </button>
      </div>
    </div>
  );
};

const SmartToolbar = ({ onAction, t }) => {
  const tools = [
    { icon: <Bug className="w-4 h-4" />, label: t.tools.debug, prompt: "Find and fix bugs in the code. Think deeply about edge cases: " },
    { icon: <FileCode className="w-4 h-4" />, label: t.tools.refactor, prompt: "Refactor this code for better performance and readability: " },
    { icon: <BookOpen className="w-4 h-4" />, label: t.tools.explain, prompt: "Explain this code step-by-step in simple terms: " },
    { icon: <TestTube className="w-4 h-4" />, label: t.tools.test, prompt: "Write comprehensive unit tests for this code: " },
    { icon: <ExternalLink className="w-4 h-4" />, label: t.tools.convert, prompt: "Convert this code to [LANGUAGE]: " },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tools.map((tool, idx) => (
        <button
          key={idx}
          onClick={() => onAction(tool.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all active:scale-95 shadow-sm"
        >
          {tool.icon}
          <span>{tool.label}</span>
        </button>
      ))}
    </div>
  );
};

const CodeBlockRenderer = ({ content, folders, onSaveSnippet, onPreview, t }) => {
  const parts = content.split(/(```[\w-]*\n[\s\S]*?```)/g);

  return (
    <div className="prose prose-sm max-w-none font-sans text-slate-800 dark:text-slate-200">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'txt';
          const code = lines.slice(1, -1).join('\n');
          const isWeb = ['html', 'css', 'javascript', 'js'].includes(lang.toLowerCase());

          return (
            <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0d1117] shadow-md">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">{lang}</span>
                <div className="flex items-center gap-1">
                  {isWeb && (
                    <button 
                      onClick={() => onPreview(code)} 
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-emerald-600 dark:text-emerald-400"
                      title={t.preview}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(code)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400" title="Copy">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => downloadFile(`code.${lang}`, code)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="relative group">
                    <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400" title="Save">
                      <Save className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl hidden group-hover:block z-50">
                      <div className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider">{t.save} to...</div>
                      {folders.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-slate-500 italic">No folders</div>
                      ) : (
                        folders.map(f => (
                          <button
                            key={f.id}
                            onClick={() => onSaveSnippet(f.id, code, lang)}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Folder className="w-3 h-3" /> {f.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-white dark:bg-transparent text-slate-800 dark:text-slate-200">
                <code className="bg-transparent">{code}</code>
              </pre>
            </div>
          );
        } else {
          return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        }
      })}
    </div>
  );
};

const ComparisonModal = ({ isOpen, onClose, comparison, loading, folders, onSaveSnippet, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.judgeVerdict}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex-1 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
              <p className="text-slate-500 dark:text-slate-300 animate-pulse">{t.thinking}</p>
            </div>
          ) : comparison ? (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4 relative group">
                <div className="flex items-start gap-4">
                    <Trophy className="w-8 h-8 text-yellow-500 shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-200 mb-1">{t.winner}: {comparison.winner}</h3>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comparison.reasoning}</p>
                    </div>
                </div>

                {/* Actions for Reasoning */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 dark:bg-black/50 rounded-lg p-1 backdrop-blur-sm">
                    <button 
                        onClick={() => navigator.clipboard.writeText(comparison.reasoning)} 
                        className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded text-yellow-700 dark:text-yellow-200 transition-colors"
                        title="Copy Analysis"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    
                    <div className="relative group/save">
                        <button 
                            className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded text-yellow-700 dark:text-yellow-200 transition-colors"
                            title={t.save}
                        >
                            <Save className="w-4 h-4" />
                        </button>
                        {/* Dropdown */}
                         <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl hidden group-hover/save:block z-50">
                            <div className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider">{t.save} to...</div>
                            {folders.length === 0 ? (
                                <div className="px-2 py-2 text-xs text-slate-500 italic">No folders</div>
                            ) : (
                                folders.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => onSaveSnippet(f.id, comparison.reasoning, 'txt')}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Folder className="w-3 h-3" /> {f.name}
                                </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparison.scores.map((score, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{score.model}</h4>
                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
                      <span>{t.performance}</span>
                      <span className="text-slate-900 dark:text-white">{score.performance}/10</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mb-3">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${score.performance * 10}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
                      <span>{t.cleanliness}</span>
                      <span className="text-slate-900 dark:text-white">{score.cleanliness}/10</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${score.cleanliness * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">No data.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResponseCard = ({ config, content, loading, error, folders, onSaveSnippet, onPreview, t }) => {
  return (
    <div className={`flex flex-col h-full border rounded-xl overflow-hidden ${config.color} border-slate-200 dark:border-transparent transition-colors shadow-sm`}>
      <div className="p-3 border-b border-black/5 dark:border-white/5 flex items-center gap-2 bg-white/50 dark:bg-black/20">
        {config.icon}
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{config.name}</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{config.sub}</p>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto min-h-[300px] text-sm md:text-base bg-white/30 dark:bg-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-70">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <span className="text-xs text-slate-500">{t.thinking}</span>
          </div>
        ) : error ? (
          <div className="text-red-500 p-2 text-center text-sm">{error}</div>
        ) : content ? (
          <CodeBlockRenderer 
            content={content} 
            folders={folders}
            onSaveSnippet={onSaveSnippet}
            onPreview={onPreview}
            t={t}
          />
        ) : (
          <div className="text-slate-400 dark:text-slate-600 italic text-center mt-10 text-xs">{t.waiting}</div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  // Settings State
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = TRANSLATIONS[lang];

  // Core State
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState({ 0: '', 1: '', 2: '' });
  const [loading, setLoading] = useState({ 0: false, 1: false, 2: false });
  const [errors, setErrors] = useState({ 0: null, 1: null, 2: null });
  const [folders, setFolders] = useState<Folder[]>(() => JSON.parse(localStorage.getItem('tricoder_folders') || '[]'));
  const [history, setHistory] = useState<HistoryItem[]>(() => JSON.parse(localStorage.getItem('tricoder_history') || '[]'));
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Advanced Features State
  const [deepThinking, setDeepThinking] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mime: string} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (th) => {
      if (th === 'dark') { root.classList.add('dark'); root.style.colorScheme = 'dark'; }
      else { root.classList.remove('dark'); root.style.colorScheme = 'light'; }
    };
    
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches ? 'dark' : 'light');
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Persist Data
  useEffect(() => { localStorage.setItem('tricoder_folders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('tricoder_history', JSON.stringify(history)); }, [history]);
  
  // Direction for Arabic
  useEffect(() => { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }, [lang]);

  const allFinished = Object.values(loading).every(l => !l) && Object.values(responses).some(r => (r as string).length > 0);

  // Save to history when all finished
  useEffect(() => {
    if (allFinished && prompt) {
      // Check if this specific response set is already saved (simple check)
      const lastHistory = history[history.length - 1];
      if (!lastHistory || lastHistory.prompt !== prompt) {
         setHistory(prev => [...prev, { id: generateId(), timestamp: Date.now(), prompt, responses }]);
      }
    }
  }, [allFinished]);

  const handleNewChat = () => {
    setPrompt('');
    setResponses({ 0: '', 1: '', 2: '' });
    setAttachedFile(null);
    setDeepThinking(false);
  };

  const handleHistoryLoad = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setResponses(item.responses);
    setIsSidebarOpen(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await blobToBase64(file);
      const base64Data = base64.split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64Data,
        mime: file.type || 'application/octet-stream'
      });
    } catch (err) { alert('File load error'); }
  };

  const toggleVoice = () => {
    if (isListening) { setIsListening(false); return; }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Browser does not support voice.'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPrompt(prev => prev + (prev ? ' ' : '') + transcript);
    };
    
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !attachedFile) return;

    setResponses({ 0: '', 1: '', 2: '' });
    setErrors({ 0: null, 1: null, 2: null });
    setComparisonResult(null);
    setLoading({ 0: true, 1: true, 2: true });

    AI_MODELS_CONFIG.forEach((config, index) => {
      generateForModel(index, config.baseSystemInstruction);
    });
  };

  const generateForModel = async (index, baseSystemInstruction) => {
    try {
      let finalSystemInstruction = baseSystemInstruction;
      if (deepThinking) {
        finalSystemInstruction += "\n\nCRITICAL: ENABLE DEEP THINKING MODE. Before providing the final code or answer, you must output a <thinking> block where you break down the problem step-by-step, consider edge cases, and plan the architecture. Close the </thinking> block, then provide the solution.";
      }
      if (lang === 'ar') {
        finalSystemInstruction += "\n\nCRITICAL RULE: The user has selected ARABIC language. You MUST provide all explanations, analysis, and non-code text in ARABIC. Do NOT use English for explanations. Only use English for code blocks and specific technical terms.";
      }

      const parts: any[] = [];
      if (attachedFile) {
        parts.push({ inlineData: { mimeType: attachedFile.mime, data: attachedFile.data } });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { systemInstruction: finalSystemInstruction }
      });
      
      const text = response.text;
      setResponses(prev => ({ ...prev, [index]: text }));
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, [index]: t.error }));
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleCompare = async () => {
    setShowComparison(true);
    setIsComparing(true);
    setComparisonResult(null);

    try {
      const languageInstruction = lang === 'ar' 
        ? "CRITICAL: The user interface is in Arabic. You MUST provide the 'reasoning' field strictly in ARABIC. Do not write the reasoning in English." 
        : "";

      const comparisonPrompt = `
        User Question: "${prompt}"
        
        Solution 1 (${AI_MODELS_CONFIG[0].name}): ${responses[0]}
        Solution 2 (${AI_MODELS_CONFIG[1].name}): ${responses[1]}
        Solution 3 (${AI_MODELS_CONFIG[2].name}): ${responses[2]}
        
        Act as a "Supreme Code Judge". Compare these 3 solutions.
        Evaluate based on: Logic Quality, Code Efficiency, and Clarity.
        Decide a winner.
        ${languageInstruction}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: comparisonPrompt,
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

      const result = JSON.parse(response.text);
      setComparisonResult(result);
    } catch (err) {
      console.error("Comparison failed", err);
      setComparisonResult({ winner: "Error", reasoning: "Comparison failed.", scores: [] });
    } finally {
      setIsComparing(false);
    }
  };

  const handleSaveSnippet = (folderId, code, snippetLang) => {
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          snippets: [...f.snippets, {
            id: generateId(),
            title: `Snippet ${new Date().toLocaleTimeString()}`,
            code,
            language: snippetLang,
            timestamp: Date.now()
          }]
        };
      }
      return f;
    }));
    alert('Saved!');
  };

  const handleBackupZip = async () => {
    const zip = new JSZip();
    zip.file("project_meta.json", JSON.stringify({ exportDate: new Date().toISOString(), appName: "Tri-Coder AI" }));
    folders.forEach(folder => {
      const folderRef = zip.folder(folder.name || "Untitled");
      if (folderRef) {
        folder.snippets.forEach(snippet => {
          const fileName = `${snippet.title.replace(/[^a-z0-9]/gi, '_')}.${snippet.language || 'txt'}`;
          folderRef.file(fileName, snippet.code);
        });
      }
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "TriCoder_Project.zip";
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        folders={folders}
        setFolders={setFolders}
        history={history}
        setHistory={setHistory}
        onLoadHistory={handleHistoryLoad}
        onRestore={setFolders}
        onBackupZip={handleBackupZip}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />

      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600 dark:text-purple-500 w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <p className="text-[10px] text-slate-500 hidden md:block">{t.subTitle}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleNewChat} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t.newChat}</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col p-4 md:p-6 gap-4">
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex space-x-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-lg border border-slate-300 dark:border-slate-800">
          {AI_MODELS_CONFIG.map((config, idx) => (
            <button
              key={config.id}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                activeTab === idx 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-500'
              }`}
            >
              {config.name}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 relative">
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {AI_MODELS_CONFIG.map((config, idx) => (
              <div key={config.id} className={`h-full ${activeTab === idx ? 'block' : 'hidden md:block'}`}>
                <ResponseCard 
                  config={config} 
                  content={responses[idx]} 
                  loading={loading[idx]} 
                  error={errors[idx]}
                  folders={folders}
                  onSaveSnippet={handleSaveSnippet}
                  onPreview={setPreviewContent}
                  t={t}
                />
              </div>
            ))}
          </div>

          {allFinished && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleCompare}
                className="group flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold py-2 px-6 rounded-full shadow-lg hover:bg-yellow-300 transition-all active:scale-95 border border-yellow-500/20"
              >
                <Scale className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {t.judge}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-20 transition-colors">
        <div className="max-w-5xl mx-auto space-y-3">
          
          <div className="flex justify-between items-end">
             <SmartToolbar onAction={(txt) => setPrompt(prev => txt + prev)} t={t} />
             <button 
               onClick={() => setDeepThinking(!deepThinking)} 
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors mb-2 ${deepThinking ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
               <BrainCircuit className="w-4 h-4" /> {deepThinking ? t.deepThinkingOn : t.deepThinking}
             </button>
          </div>

          <form onSubmit={handleSubmit} className="relative">
             {attachedFile && (
                <div className="absolute -top-10 left-0 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-t-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 border border-b-0 border-slate-300 dark:border-slate-700">
                  <Paperclip className="w-3 h-3" /> {attachedFile.name}
                  <button type="button" onClick={() => setAttachedFile(null)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
             )}
            
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isListening ? t.voiceListening : t.inputPlaceholder}
                className={`w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border rounded-xl pl-12 pr-24 py-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm ${attachedFile ? 'rounded-tl-none' : ''} ${isListening ? 'border-red-500 animate-pulse' : 'border-slate-300 dark:border-slate-700'}`}
              />
              
              {/* Left Actions */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.txt,.js,.py,.html,.css,.json,.md" />
                 <button 
                   type="button" 
                   onClick={() => fileInputRef.current?.click()}
                   className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                   title="Attach file"
                 >
                   <Paperclip className="w-5 h-5" />
                 </button>
              </div>

              {/* Right Actions */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <button 
                   type="button" 
                   onClick={toggleVoice}
                   className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                   title="Voice Input"
                 >
                   <Mic className="w-5 h-5" />
                 </button>
                 <button 
                   type="submit" 
                   disabled={Object.values(loading).some(l => l) || (!prompt.trim() && !attachedFile)}
                   className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-900/10"
                 >
                   {Object.values(loading).some(l => l) ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <Send className="w-5 h-5" />
                   )}
                 </button>
              </div>
            </div>
          </form>
        </div>
      </footer>

      {/* Modals */}
      <ComparisonModal 
        isOpen={showComparison} 
        onClose={() => setShowComparison(false)} 
        comparison={comparisonResult}
        loading={isComparing}
        folders={folders}
        onSaveSnippet={handleSaveSnippet}
        t={t}
      />
      
      <PreviewModal 
        isOpen={!!previewContent}
        onClose={() => setPreviewContent(null)}
        code={previewContent}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);