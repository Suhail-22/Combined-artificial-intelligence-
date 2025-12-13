import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, BrainCircuit, Menu, Bug, FileCode, BookOpen, TestTube, ExternalLink,
  Mic, Paperclip, Plus, X, AlertTriangle, Key
} from 'lucide-react';

import { TRANSLATIONS, AI_MODELS_CONFIG } from './constants';
import { dbHelper } from './db';
import { generateId, blobToBase64 } from './utils';
import { ChatSession, ChatMessage, Folder, Snippet, Tool } from './types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { Sidebar } from './Sidebar';
import { PreviewModal } from './PreviewModal';
import { HelpModal } from './HelpModal';
import { ErrorBoundary } from './ErrorBoundary';

const App = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'en' | 'ar'>('ar'); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'settings'>('history');
  const [deepThinking, setDeepThinking] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [input, setInput] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mime: string} | null>(null);

  // API Key Management
  const [userApiKey, setUserApiKey] = useState<string>(() => localStorage.getItem('USER_API_KEY') || '');
  const systemApiKey = process.env.API_KEY;
  const finalApiKey = (systemApiKey && !systemApiKey.includes('undefined') && systemApiKey.length > 5) ? systemApiKey : userApiKey;

  // Error logging state
  const [errorLog, setErrorLog] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = TRANSLATIONS[lang];
  const currentSession = sessions.find(s => s.id === currentSessionId);
  
  const tools: Tool[] = useMemo(() => [
    { id: 'debug', icon: <Bug className="w-4 h-4" />, label: t.tools.debug, prompt: "Find and fix bugs in the code. Think deeply about edge cases for the following request:" },
    { id: 'refactor', icon: <FileCode className="w-4 h-4" />, label: t.tools.refactor, prompt: "Refactor this code for better performance and readability:" },
    { id: 'explain', icon: <BookOpen className="w-4 h-4" />, label: t.tools.explain, prompt: "Explain this code or concept step-by-step in simple terms:" },
    { id: 'test', icon: <TestTube className="w-4 h-4" />, label: t.tools.test, prompt: "Write comprehensive unit tests for this code:" },
    { id: 'convert', icon: <ExternalLink className="w-4 h-4" />, label: t.tools.convert, prompt: "Convert this code to a different language/framework (infer target from context or provide best alternative):" },
  ], [t]);

  // Global Error Handler
  useEffect(() => {
     const handleError = (event: ErrorEvent) => {
         const msg = `[${new Date().toISOString()}] ERROR: ${event.message} at ${event.filename}:${event.lineno}`;
         setErrorLog(prev => [msg, ...prev].slice(0, 50));
     };
     const handleRejection = (event: PromiseRejectionEvent) => {
         const msg = `[${new Date().toISOString()}] PROMISE_REJECT: ${event.reason}`;
         setErrorLog(prev => [msg, ...prev].slice(0, 50));
     };
     window.addEventListener('error', handleError);
     window.addEventListener('unhandledrejection', handleRejection);
     return () => {
         window.removeEventListener('error', handleError);
         window.removeEventListener('unhandledrejection', handleRejection);
     }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const storedSessions = await dbHelper.getAll('sessions');
        const storedFolders = await dbHelper.getAll('folders');
        setSessions(storedSessions.sort((a, b) => b.timestamp - a.timestamp));
        setFolders(storedFolders);
        if (storedSessions.length > 0) {
          setCurrentSessionId(storedSessions[0].id);
        } else {
          createNewChat();
        }
      } catch (e: any) {
        console.error("DB Error", e);
        setErrorLog(prev => [`DB Init Error: ${e.message}`, ...prev]);
      }
    };
    init();

    const savedTheme = localStorage.getItem('theme') as any;
    if (savedTheme) setTheme(savedTheme);
    const savedLang = localStorage.getItem('lang') as any;
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleUpdateApiKey = (key: string) => {
      setUserApiKey(key);
      localStorage.setItem('USER_API_KEY', key);
  };

  const createNewChat = async () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: t.newChat,
      messages: [],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    await dbHelper.put('sessions', newSession);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const updateSession = async (updatedSession: ChatSession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    await dbHelper.put('sessions', updatedSession);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Delete this chat?')) {
        await dbHelper.delete('sessions', id);
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
           const remaining = sessions.filter(s => s.id !== id);
           if(remaining.length > 0) setCurrentSessionId(remaining[0].id);
           else createNewChat();
        }
    }
  };

  const runModelGeneration = async (
      sessionId: string, 
      aiMsgId: string, 
      userContent: string, 
      historyMsgs: ChatMessage[],
      attachment?: {data: string, mime: string}
    ) => {
    
    if (!finalApiKey) {
        const errorMsg = lang === 'ar' ? 'مفتاح API مفقود. يرجى إضافته في الإعدادات.' : 'API Key missing. Please add it in Settings.';
        setSessions(prev => {
            const sess = prev.find(s => s.id === sessionId);
            if (!sess) return prev;
            const msgs = [...sess.messages];
            const msgIdx = msgs.findIndex(m => m.id === aiMsgId);
            if (msgIdx === -1) return prev;
            const lastMsg = msgs[msgIdx];
            const newModelsData = { ...lastMsg.modelsData };
            [0,1,2].forEach(i => newModelsData[i] = { ...newModelsData[i], loading: false, error: errorMsg });
            msgs[msgIdx] = { ...lastMsg, modelsData: newModelsData };
            return prev.map(s => s.id === sessionId ? { ...sess, messages: msgs } : s);
        });
        setSidebarOpen(true);
        setSidebarTab('settings');
        return;
    }

    AI_MODELS_CONFIG.forEach(async (modelConfig, index) => {
      try {
        const ai = new GoogleGenAI({ apiKey: finalApiKey });
        const historyParts = historyMsgs.map(m => ({
            role: m.role,
            parts: [{ text: m.content || '' }]
        }));

        let modelName = 'gemini-3-pro-preview'; 
        let thinkingConfig = undefined;
        let systemInstruction = modelConfig.baseSystemInstruction;
        
        if (deepThinking) {
             modelName = 'gemini-2.5-flash';
             thinkingConfig = { thinkingBudget: 2048 };
             systemInstruction += "\n\nCRITICAL: ENABLE DEEP THINKING. Output a <thinking> block first.";
        }
        
        if (lang === 'ar') {
            systemInstruction += "\n\nCRITICAL INSTRUCTION: You MUST answer in ARABIC (العربية) only. The user is an Arabic speaker. Translate technical concepts to Arabic but keep code and keywords in English. DO NOT output English explanations unless requested.";
        }

        const chat = ai.chats.create({
            model: modelName,
            config: { systemInstruction, thinkingConfig },
            history: historyParts
        });
        
        const msgParts: any[] = [];
        if (attachment) {
            msgParts.push({ inlineData: { mimeType: attachment.mime, data: attachment.data } });
        }
        msgParts.push({ text: userContent });

        // @ts-ignore
        const resultStream = await chat.sendMessageStream({ message: msgParts });

        let fullText = '';
        for await (const chunk of resultStream) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                setSessions(prev => {
                    const sess = prev.find(s => s.id === sessionId);
                    if (!sess) return prev;
                    const msgs = [...sess.messages];
                    const msgIdx = msgs.findIndex(m => m.id === aiMsgId);
                    if (msgIdx === -1) return prev;
                    
                    const lastMsg = msgs[msgIdx];
                    const newModelsData = { ...lastMsg.modelsData };
                    newModelsData[index] = { ...newModelsData[index], text: fullText, loading: true, error: null };
                    
                    msgs[msgIdx] = { ...lastMsg, modelsData: newModelsData };
                    return prev.map(s => s.id === sessionId ? { ...sess, messages: msgs } : s);
                });
            }
        }

        setSessions(prev => {
            const sess = prev.find(s => s.id === sessionId);
            if (!sess) return prev;
            const msgs = [...sess.messages];
            const msgIdx = msgs.findIndex(m => m.id === aiMsgId);
            if (msgIdx === -1) return prev;

            const lastMsg = msgs[msgIdx];
            const newModelsData = { ...lastMsg.modelsData };
            newModelsData[index] = { ...newModelsData[index], text: fullText, loading: false, error: null };
            msgs[msgIdx] = { ...lastMsg, modelsData: newModelsData };
            const nextSession = { ...sess, messages: msgs };
            dbHelper.put('sessions', nextSession);
            return prev.map(s => s.id === sessionId ? nextSession : s);
        });

      } catch (err: any) {
         setErrorLog(prev => [`Model ${index} Error: ${err.message}`, ...prev]);
         setSessions(prev => {
            const sess = prev.find(s => s.id === sessionId);
            if (!sess) return prev;
            const msgs = [...sess.messages];
            const msgIdx = msgs.findIndex(m => m.id === aiMsgId);
            if (msgIdx === -1) return prev;

            const lastMsg = msgs[msgIdx];
            const newModelsData = { ...lastMsg.modelsData };
            newModelsData[index] = { ...newModelsData[index], loading: false, error: err.message || 'Error' };
            msgs[msgIdx] = { ...lastMsg, modelsData: newModelsData };
            return prev.map(s => s.id === sessionId ? { ...sess, messages: msgs } : s);
        });
      }
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if ((!input.trim() && !attachedFile) || !currentSessionId) return;
    
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    let userContent = input;
    if (attachedFile) userContent = `[File: ${attachedFile.name}]\n` + userContent;
    
    const tool = tools.find(t => t.id === activeToolId);
    if (tool) userContent = `[TASK: ${tool.label} - ${tool.prompt}]\n\n${userContent}`;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userContent,
      timestamp: Date.now()
    };

    const aiMsgId = generateId();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      timestamp: Date.now(),
      modelsData: {
        0: { text: '', loading: true, error: null },
        1: { text: '', loading: true, error: null },
        2: { text: '', loading: true, error: null }
      }
    };

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMsg, aiMsg],
      title: session.messages.length === 0 ? input.slice(0, 30) : session.title
    };

    updateSession(updatedSession);
    setInput('');
    setAttachedFile(null);
    setActiveToolId(null);
    if(textareaRef.current) textareaRef.current.style.height = 'auto';

    runModelGeneration(session.id, aiMsgId, userContent, session.messages, attachedFile ? {data: attachedFile.data, mime: attachedFile.mime} : undefined);
  };

  const handleRetry = async (msg: ChatMessage) => {
      const session = sessions.find(s => s.id === currentSessionId);
      if (!session) return;
      
      const msgIndex = session.messages.findIndex(m => m.id === msg.id);
      if (msgIndex <= 0) return;
      const userMsg = session.messages[msgIndex - 1];
      if (userMsg.role !== 'user') return;

      const newAiMsg = {
          ...msg,
          modelsData: {
            0: { ...msg.modelsData![0], loading: true, error: null },
            1: { ...msg.modelsData![1], loading: true, error: null },
            2: { ...msg.modelsData![2], loading: true, error: null }
          }
      };
      
      const newMessages = [...session.messages];
      newMessages[msgIndex] = newAiMsg;
      const updatedSession = { ...session, messages: newMessages };
      updateSession(updatedSession);
      
      const historyBeforeUser = session.messages.slice(0, msgIndex - 1);
      runModelGeneration(session.id, msg.id, userMsg.content || '', historyBeforeUser);
  };

  const handleCompare = async (msg: ChatMessage) => {
    if(!finalApiKey) { alert("API Key missing"); return; }
    if(!msg.modelsData) return;

    // Set Loading State
    const sess = sessions.find(s => s.id === currentSessionId)!;
    const loadingMsg = { ...msg, comparisonLoading: true };
    updateSession({ ...sess, messages: sess.messages.map(m => m.id === msg.id ? loadingMsg : m) });

    const texts = Object.values(msg.modelsData).map((d, i) => `Model ${AI_MODELS_CONFIG[i].name}:\n${d.text}`).join('\n\n');
    
    let prompt = `You are an impartial senior technical judge. Evaluate these 3 solutions to the user's problem.
    Compare them on: Correctness, Performance, Readability, and Security.
    
    Solutions:
    ${texts}
    
    Output strictly valid JSON:
    {
       "winner": "Name of winning model",
       "reasoning": "Detailed explanation...",
       "scores": [
         {"model": "Model Name", "performance": 9}, ...
       ]
    }`;

    if (lang === 'ar') {
        prompt += `\n\nCRITICAL: The Output JSON values (reasoning, winner) MUST be in ARABIC. Translate your judgment to Arabic.`;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: finalApiKey });
        const resp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const json = JSON.parse(resp.text || '{}');
        
        const newMsg = { ...msg, comparison: json, comparisonLoading: false };
        updateSession({ ...sess, messages: sess.messages.map(m => m.id === msg.id ? newMsg : m) });

    } catch(e: any) {
        console.error(e);
        setErrorLog(prev => [`Comparison Error: ${e.message}`, ...prev]);
        const errorMsg = { ...msg, comparisonLoading: false }; // Clear loading on error
        updateSession({ ...sess, messages: sess.messages.map(m => m.id === msg.id ? errorMsg : m) });
        alert('Comparison failed.');
    }
  };

  const handleConsensus = async (msg: ChatMessage) => {
     if(!finalApiKey) { alert("API Key missing"); return; }
     if(!msg.modelsData || !msg.comparison) return;
     
     const newMsg = { ...msg, consensus: { text: '', loading: true, error: null } };
     const sess = sessions.find(s => s.id === currentSessionId)!;
     updateSession({ ...sess, messages: sess.messages.map(m => m.id === msg.id ? newMsg : m) });

     try {
        const ai = new GoogleGenAI({ apiKey: finalApiKey });
        let prompt = `You are a Principal Software Engineer. 
        User Question: "..." (context)
        
        We have 3 solutions and a judge's verdict.
        Judge's Reasoning: ${msg.comparison.reasoning}
        
        Solution 1: ${msg.modelsData[0].text}
        Solution 2: ${msg.modelsData[1].text}
        Solution 3: ${msg.modelsData[2].text}
        
        Create the ULTIMATE solution by combining the best parts of all 3. Explain why this version is superior.`;

        if (lang === 'ar') {
            prompt += `\n\nCRITICAL: You MUST answer in ARABIC. The explanation must be Arabic. Code remains technical.`;
        }

        const resp = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt
        });

        const finalMsg = { ...msg, consensus: { text: resp.text || '', loading: false, error: null } };
        updateSession({ ...sess, messages: sess.messages.map(m => m.id === msg.id ? finalMsg : m) });

     } catch (e: any) {
        setErrorLog(prev => [`Consensus Error: ${e.message}`, ...prev]);
        const errorMsg = { ...msg, consensus: { text: '', loading: false, error: e.message } };
        updateSession({ ...sess, messages: sess.messages.map(m => m.id === msg.id ? errorMsg : m) });
     }
  };

  const handleSaveSnippet = async (folderId: string, code: string, lang: string) => {
      const folder = folders.find(f => f.id === folderId);
      if(!folder) return;
      const snippet: Snippet = {
          id: generateId(),
          title: `Snippet ${new Date().toLocaleString()}`,
          code,
          language: lang,
          timestamp: Date.now()
      };
      const updatedFolder = { ...folder, snippets: [...folder.snippets, snippet] };
      const newFolders = folders.map(f => f.id === folderId ? updatedFolder : f);
      setFolders(newFolders);
      await dbHelper.put('folders', updatedFolder);
  };

  const handleCreateFolder = async () => {
      if(!newFolderName.trim()) return;
      const newFolder: Folder = { id: generateId(), name: newFolderName, snippets: [] };
      setFolders(prev => [...prev, newFolder]);
      await dbHelper.put('folders', newFolder);
      setNewFolderName('');
      setShowNewFolderInput(false);
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

  const handleExportBackup = async () => {
    const loadedFolders = await dbHelper.getAll('folders');
    const loadedSessions = await dbHelper.getAll('sessions');
    
    const data = {
      version: 1,
      timestamp: Date.now(),
      folders: loadedFolders,
      history: loadedSessions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tricoder_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.folders) {
           for (const f of json.folders) await dbHelper.put('folders', f);
           setFolders(json.folders);
        }
        if (json.history) {
           for (const s of json.history) await dbHelper.put('sessions', s);
           setSessions(json.history);
        }
        alert("Backup restored successfully!");
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleReportBug = () => {
     const logs = errorLog.length > 0 ? errorLog.join('\n') : t.noLogs;
     navigator.clipboard.writeText(logs).then(() => {
        alert(t.copyLogs + " (" + (errorLog.length > 0 ? errorLog.length : 0) + " items)");
     });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className={`flex h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        
        <Sidebar 
          isOpen={sidebarOpen} setIsOpen={setSidebarOpen}
          lang={lang} setLang={setLang}
          theme={theme} setTheme={setTheme}
          tab={sidebarTab} setTab={setSidebarTab}
          sessions={sessions} currentSessionId={currentSessionId} setCurrentSessionId={setCurrentSessionId}
          createNewChat={createNewChat} deleteSession={deleteSession}
          folders={folders}
          showNewFolderInput={showNewFolderInput} setShowNewFolderInput={setShowNewFolderInput}
          newFolderName={newFolderName} setNewFolderName={setNewFolderName} handleCreateFolder={handleCreateFolder}
          handleExportBackup={handleExportBackup} handleImportBackup={handleImportBackup}
          handleOpenHelp={() => setIsHelpOpen(true)}
          handleReportBug={handleReportBug}
          apiKey={userApiKey} setApiKey={handleUpdateApiKey}
          t={t}
          onViewSnippet={setPreviewCode}
        />

        <div className="flex-1 flex flex-col h-full relative w-full">
            {/* Header - REDESIGNED: Centered Logo/Title */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 relative">
               {/* Left: Menu & Mobile Title */}
               <div className="flex items-center gap-3 z-20">
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 md:hidden">
                     <Menu className="w-5 h-5" />
                  </button>
               </div>
               
               {/* Center: Logo & Title (Absolute) */}
               <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <BrainCircuit className="w-6 h-6 text-indigo-500" />
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">{t.appTitle}</h2>
               </div>
               
               {/* Right: New Chat */}
               <div className="flex items-center gap-2 z-20">
                  <button onClick={createNewChat} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
               </div>
            </div>
            
            {/* API KEY ERROR BANNER - CLICKABLE */}
            {!finalApiKey && (
                <button 
                  onClick={() => { setSidebarOpen(true); setSidebarTab('settings'); }}
                  className="w-full bg-red-600 text-white p-2 text-center text-xs md:text-sm font-bold animate-in slide-in-from-top flex items-center justify-center gap-2 hover:bg-red-700 transition-colors cursor-pointer"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {lang === 'ar' 
                      ? "مفتاح API مفقود! اضغط هنا لإضافته يدوياً في الإعدادات."
                      : "API Key missing! Click here to add it manually in Settings."
                    }
                </button>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
               {currentSession && currentSession.messages.length > 0 ? (
                  currentSession.messages.map(msg => (
                     <ChatMessageBubble 
                        key={msg.id} 
                        msg={msg} 
                        lang={lang} 
                        folders={folders} 
                        onSaveSnippet={handleSaveSnippet} 
                        onPreview={setPreviewCode}
                        t={t}
                        onCompare={handleCompare}
                        onConsensus={handleConsensus}
                        onSuggestionClick={(txt) => setInput(txt)}
                        onRetry={handleRetry}
                     />
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <BrainCircuit className="w-24 h-24 mb-6 text-indigo-500 animate-pulse-slow" />
                     <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-4 tracking-tight">{t.appTitle}</h1>
                     <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center leading-relaxed">{t.subTitle}</p>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800">
               <div className="max-w-4xl mx-auto">
                 <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide mask-fade">
                    <button 
                      type="button" 
                      onClick={() => setDeepThinking(!deepThinking)} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 ${deepThinking ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'}`}
                    >
                       <BrainCircuit className="w-3.5 h-3.5" />
                       {t.deepThinking}
                    </button>
                    
                    {tools.map(tool => (
                       <button 
                         key={tool.id} 
                         type="button" 
                         onClick={() => setActiveToolId(activeToolId === tool.id ? null : tool.id)} 
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 ${activeToolId === tool.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500'}`}
                       >
                          {tool.icon}
                          {tool.label}
                       </button>
                    ))}
                 </div>

                 {attachedFile && (
                    <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded mb-2 w-fit">
                       <Paperclip className="w-3 h-3" />
                       <span>{attachedFile.name}</span>
                       <button onClick={() => setAttachedFile(null)}><X className="w-3 h-3" /></button>
                    </div>
                 )}

                 <div className="relative">
                    <div className="flex gap-2 items-end">
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-purple-600 bg-slate-100 dark:bg-slate-900 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors h-[48px]">
                          <Paperclip className="w-5 h-5" />
                       </button>
                       <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                       
                       <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-end px-4 py-3 border border-transparent focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all min-h-[48px]">
                          <textarea 
                             ref={textareaRef}
                             value={input} 
                             onChange={e => setInput(e.target.value)}
                             onKeyDown={handleKeyDown}
                             placeholder={t.inputPlaceholder}
                             rows={1}
                             className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none max-h-32 scrollbar-thin leading-6"
                          />
                          <div className="pl-2 pb-0.5">
                             <Mic className="w-5 h-5 text-slate-400 cursor-pointer hover:text-red-500 transition-colors" />
                          </div>
                       </div>

                       <button 
                           onClick={() => handleSend()}
                           disabled={!input && !attachedFile} 
                           className="p-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-600/20 h-[48px]"
                       >
                          <Send className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               </div>
            </div>
        </div>

        <PreviewModal isOpen={!!previewCode} onClose={() => setPreviewCode(null)} code={previewCode} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} lang={lang} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
