import React, { useState, useEffect, useRef } from 'react';
import { User, Clock, Bot, Loader2, Copy, Download, FolderPlus, RotateCcw, Scale, Lightbulb, Trophy, Users, Star, Check, ChevronDown, AlertTriangle, ChevronRight } from 'lucide-react';
import { AI_MODELS_CONFIG } from './constants';
import { CodeBlock } from './CodeBlock';
import { ChatMessage, Folder } from './types';
import { downloadFile } from './utils';

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  lang: 'en' | 'ar';
  folders: Folder[];
  onSaveSnippet: (folderId: string, code: string, lang: string) => void;
  onPreview: (code: string) => void;
  onOpenWorkspace: (code: string, lang: string) => void;
  t: any;
  onCompare: (msg: ChatMessage) => void;
  onConsensus: (msg: ChatMessage) => void;
  onSuggestionClick: (text: string) => void;
  onRetry: (msg: ChatMessage) => void;
}

const formatError = (error: string, lang: string) => {
    if (!error) return "Unknown Error";
    
    // Check for specific Vercel/API Key issues
    if (error.includes('API key not valid') || error.includes('400')) {
        return lang === 'ar' 
            ? "⚠️ تنبيه إعدادات: مفتاح API غير صالح أو لم يتم تحديثه. يرجى التأكد من إضافة المفتاح في Vercel ثم عمل (Redeploy) لتحديث الموقع."
            : "⚠️ Setup Error: API Key is invalid or outdated. Please check Vercel Settings and trigger a 'Redeploy' to apply changes.";
    }

    // Try parsing raw JSON error from Google
    try {
        // Extract JSON if it's wrapped in text
        const jsonMatch = error.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : error;
        const parsed = JSON.parse(jsonStr);
        if (parsed.error?.message) return `Google API Error: ${parsed.error.message}`;
    } catch (e) {
        // Raw text
    }

    return error.length > 200 ? error.substring(0, 200) + "..." : error;
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ msg, lang, folders, onSaveSnippet, onPreview, onOpenWorkspace, t, onCompare, onConsensus, onSuggestionClick, onRetry }) => {
  const isUser = msg.role === 'user';
  const [activeTab, setActiveTab] = useState(0);
  
  // Feedback States
  const [mainCopied, setMainCopied] = useState(false);
  const [judgeCopied, setJudgeCopied] = useState(false);
  const [consensusCopied, setConsensusCopied] = useState(false);
  
  // Menu States
  const [showMainSaveMenu, setShowMainSaveMenu] = useState(false);
  const [showConsensusSaveMenu, setShowConsensusSaveMenu] = useState(false);

  // Collapsible State (DeepSeek Style) - Default to FALSE (Collapsed) for speed
  const [isExpanded, setIsExpanded] = useState(false);

  const currentModelData = msg.modelsData?.[activeTab];
  const isFinished = !currentModelData?.loading && !currentModelData?.error && currentModelData?.text;
  const isLoading = currentModelData?.loading;
  const hasError = !!currentModelData?.error;

  // --- Handlers ---

  const handleCopyMain = () => {
      if (!currentModelData?.text) return;
      navigator.clipboard.writeText(currentModelData.text).then(() => {
          setMainCopied(true);
          setTimeout(() => setMainCopied(false), 2000);
      });
  };

  const handleCopyJudge = () => {
      if (!msg.comparison) return;
      const text = `${msg.comparison.winner}\n\n${msg.comparison.reasoning}`;
      navigator.clipboard.writeText(text).then(() => {
          setJudgeCopied(true);
          setTimeout(() => setJudgeCopied(false), 2000);
      });
  };

  const handleCopyConsensus = () => {
      if (!msg.consensus?.text) return;
      navigator.clipboard.writeText(msg.consensus.text).then(() => {
          setConsensusCopied(true);
          setTimeout(() => setConsensusCopied(false), 2000);
      });
  };

  const handleDownload = () => {
      if (!currentModelData?.text) return;
      downloadFile(`tricoder_response_${msg.id}.txt`, currentModelData.text);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const closeMenus = () => {
        setShowMainSaveMenu(false);
        setShowConsensusSaveMenu(false);
    };
    if(showMainSaveMenu || showConsensusSaveMenu) document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, [showMainSaveMenu, showConsensusSaveMenu]);

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

              {/* TABS */}
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
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-