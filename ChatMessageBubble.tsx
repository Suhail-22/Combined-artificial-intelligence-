import React, { useState, useEffect, useRef } from 'react';
import { User, Clock, Bot, Loader2, Copy, Download, FolderPlus, RotateCcw, Scale, Lightbulb, Trophy, Users, Star, Check, ChevronDown, AlertTriangle } from 'lucide-react';
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

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ msg, lang, folders, onSaveSnippet, onPreview, t, onCompare, onConsensus, onSuggestionClick, onRetry }) => {
  const isUser = msg.role === 'user';
  const [activeTab, setActiveTab] = useState(0);
  
  // Feedback States
  const [mainCopied, setMainCopied] = useState(false);
  const [judgeCopied, setJudgeCopied] = useState(false);
  const [consensusCopied, setConsensusCopied] = useState(false);
  
  // Menu States
  const [showMainSaveMenu, setShowMainSaveMenu] = useState(false);
  const [showConsensusSaveMenu, setShowConsensusSaveMenu] = useState(false);

  const currentModelData = msg.modelsData?.[activeTab];
  const isFinished = !currentModelData?.loading && !currentModelData?.error && currentModelData?.text;
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
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex flex-col gap-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-relaxed">
                                            {formatError(data.error, lang)}
                                        </p>
                                    </div>
                                    <button onClick={() => onRetry(msg)} className="self-end text-xs bg-white dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-red-50 transition-colors shadow-sm font-bold">
                                        <RotateCcw className="w-3.5 h-3.5" /> {t.retry}
                                    </button>
                                </div>
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

                 {/* Footer Actions */}
                 {(isFinished || hasError) && (
                   <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-2 flex flex-wrap items-center justify-between gap-2">
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleCopyMain}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          disabled={hasError}
                        >
                          {mainCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {mainCopied ? t.copied : t.copy}
                        </button>

                        <button 
                           onClick={handleDownload}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                           disabled={hasError}
                        >
                           <Download className="w-3.5 h-3.5" /> {t.download}
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowMainSaveMenu(!showMainSaveMenu); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                            disabled={hasError}
                          >
                            <FolderPlus className="w-3.5 h-3.5" /> {t.saveToFolder} <ChevronDown className="w-3 h-3" />
                          </button>
                          {showMainSaveMenu && !hasError && (
                              <div className="absolute left-0 bottom-full mb-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {folders.length === 0 ? (
                                <div className="p-2 text-[10px] text-slate-500 italic">No folders</div>
                                ) : (
                                folders.map(f => (
                                    <button 
                                    key={f.id} 
                                    onClick={(e) => { e.stopPropagation(); onSaveSnippet(f.id, currentModelData?.text || '', 'txt'); setShowMainSaveMenu(false); }} 
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                                    >
                                    {f.name}
                                    </button>
                                ))
                                )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onRetry(msg)}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-bold transition-colors shadow-sm"
                            title={t.retry}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => onCompare(msg)}
                            disabled={hasError}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Scale className="w-3.5 h-3.5" /> {t.judge}
                        </button>
                      </div>
                   </div>
                 )}
              </div>

              {/* Suggestions */}
              {(isFinished && !hasError) && (
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

              {/* Comparison Result */}
              {msg.comparison && (
                 <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 animate-in slide-in-from-top-2 relative group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                           <Trophy className="w-4 h-4" /> {t.judgeVerdict}
                        </div>
                        
                        <button 
                            onClick={handleCopyJudge}
                            className="flex items-center gap-1 p-1.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 text-xs transition-colors"
                            title={t.copy}
                        >
                            {judgeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {judgeCopied && <span className="text-[10px] font-bold">{t.copied}</span>}
                        </button>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                       <span className="font-bold">{t.winner}:</span> {msg.comparison.winner}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 whitespace-pre-wrap">{msg.comparison.reasoning}</p>
                    <div className="grid grid-cols-3 gap-2">
                       {msg.comparison.scores.map((s: any, i: number) => (
                          <button 
                            key={i} 
                            onClick={() => setActiveTab(i)}
                            className={`bg-white dark:bg-slate-800 p-2 rounded border border-yellow-100 dark:border-yellow-900/20 text-center transition-all hover:scale-105 active:scale-95 hover:border-yellow-300 dark:hover:border-yellow-600 ${activeTab === i ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}`}
                            title="Click to view this model's answer"
                          >
                             <div className="text-[10px] text-slate-500 truncate pointer-events-none">{s.model}</div>
                             <div className="text-xs font-bold text-slate-800 dark:text-slate-200 pointer-events-none">{s.performance}/10</div>
                          </button>
                       ))}
                    </div>

                    {!msg.consensus && (
                      <div className="mt-4 border-t border-yellow-200 dark:border-yellow-700/30 pt-4 flex justify-center">
                        <button 
                          onClick={() => onConsensus(msg)}
                          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-full font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                          <Users className="w-4 h-4" />
                          {t.consensusBtn}
                        </button>
                      </div>
                    )}
                 </div>
              )}

              {/* Consensus Result */}
              {msg.consensus && (
                <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 flex items-center gap-2 text-white">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    <span className="font-bold text-sm">{t.consensusTitle}</span>
                  </div>
                  
                  <div className="p-4 bg-white/50 dark:bg-black/20">
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4">{t.consensusDesc}</p>
                    
                    {msg.consensus.loading ? (
                      <div className="flex flex-col items-center justify-center py-8 opacity-60">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                         <span className="text-xs text-indigo-600 dark:text-indigo-400">{t.thinking}</span>
                      </div>
                    ) : msg.consensus.error ? (
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex flex-col gap-2">
                             <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                                    {formatError(msg.consensus.error, lang)}
                                </p>
                             </div>
                        </div>
                    ) : (
                       <div className="consensus-content">
                          <CodeBlock 
                            content={msg.consensus.text || ''} 
                            folders={folders} 
                            onSaveSnippet={onSaveSnippet}
                            onPreview={onPreview}
                            t={t}
                          />
                          <div className="mt-2 flex justify-end gap-2">
                             <button 
                                onClick={handleCopyConsensus}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                             >
                                {consensusCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} 
                                {consensusCopied ? t.copied : t.copy}
                             </button>

                             <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowConsensusSaveMenu(!showConsensusSaveMenu); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                >
                                   <FolderPlus className="w-3.5 h-3.5" /> {t.save} <ChevronDown className="w-3 h-3" />
                                </button>
                                {showConsensusSaveMenu && (
                                    <div className="absolute right-0 bottom-full mb-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {folders.map(f => (
                                          <button 
                                              key={f.id} 
                                              onClick={(e) => { 
                                                  e.stopPropagation(); 
                                                  onSaveSnippet(f.id, msg.consensus?.text || '', 'txt'); 
                                                  setShowConsensusSaveMenu(false); 
                                              }} 
                                              className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                                          >
                                              {f.name}
                                          </button>
                                        ))}
                                    </div>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
