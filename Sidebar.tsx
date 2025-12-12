import React, { useRef } from 'react';
import { BrainCircuit, X, History, Settings, MessageCircle, Plus, Trash2, Folder, Moon, Languages, FileJson, Upload, Info, AlertOctagon } from 'lucide-react';
import { ChatSession, Folder as FolderType } from './types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  tab: 'history' | 'settings';
  setTab: (t: 'history' | 'settings') => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string) => void;
  createNewChat: () => void;
  deleteSession: (id: string, e: React.MouseEvent) => void;
  folders: FolderType[];
  showNewFolderInput: boolean;
  setShowNewFolderInput: (v: boolean) => void;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  handleCreateFolder: () => void;
  handleExportBackup: () => void;
  handleImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleOpenHelp: () => void;
  handleReportBug: () => void;
  t: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen, setIsOpen, lang, setLang, theme, setTheme, tab, setTab,
    sessions, currentSessionId, setCurrentSessionId, createNewChat, deleteSession,
    folders, showNewFolderInput, setShowNewFolderInput, newFolderName, setNewFolderName, handleCreateFolder,
    handleExportBackup, handleImportBackup, handleOpenHelp, handleReportBug, t
}) => {
    
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
    {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)} />}
    <div className={`fixed inset-y-0 z-30 w-72 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 flex flex-col 
            ${lang === 'ar' ? 'right-0 border-l border-slate-200 dark:border-slate-800' : 'left-0 border-r border-slate-200 dark:border-slate-800'}
            ${isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}
            md:relative md:translate-x-0 md:shadow-none
        `}>
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                    <BrainCircuit className="w-8 h-8 text-indigo-500" />
                    {t.appTitle}
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5"/></button>
             </div>

             {/* Sidebar Tabs */}
             <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-950/50">
                <button 
                  onClick={() => setTab('history')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${tab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`}
                >
                    <History className="w-3.5 h-3.5" />
                    {t.history}
                </button>
                <button 
                  onClick={() => setTab('settings')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${tab === 'settings' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`}
                >
                    <Settings className="w-3.5 h-3.5" />
                    {t.settings}
                </button>
             </div>

             <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
                {tab === 'history' ? (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MessageCircle className="w-3 h-3"/> {t.chatHistory}</h3>
                                <button onClick={createNewChat} className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-500 rounded transition-colors" title={t.newChat}><Plus className="w-3.5 h-3.5"/></button>
                            </div>
                            <div className="space-y-1">
                                {sessions.map(s => (
                                    <div key={s.id} className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${currentSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`} onClick={() => { setCurrentSessionId(s.id); if(window.innerWidth < 768) setIsOpen(false); }}>
                                        <span className="truncate flex-1">{s.title}</span>
                                        <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                {sessions.length === 0 && <p className="text-xs text-slate-400 px-2 italic">{t.noHistory}</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Folder className="w-3 h-3"/> {t.folders}</h3>
                                <button onClick={() => setShowNewFolderInput(!showNewFolderInput)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500"><Plus className="w-3 h-3"/></button>
                            </div>
                            
                            {showNewFolderInput && (
                                    <div className="mb-2 px-2 flex gap-1">
                                        <input 
                                            type="text" 
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs"
                                            placeholder={t.folderName}
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                        />
                                        <button onClick={handleCreateFolder} className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700"><Plus className="w-3 h-3" /></button>
                                    </div>
                            )}

                            <div className="space-y-1">
                                {folders.map(f => (
                                    <div key={f.id} className="text-sm">
                                        <div className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-600 dark:text-slate-400">
                                            <span className="flex items-center gap-2"><Folder className="w-3.5 h-3.5 fill-slate-300 dark:fill-slate-700" /> {f.name}</span>
                                            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 rounded-full">{f.snippets.length}</span>
                                        </div>
                                    </div>
                                ))}
                                {folders.length === 0 && <p className="text-xs text-slate-500 px-2 italic">No folders</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                         <div className="space-y-3">
                             <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"><Moon className="w-4 h-4" /> {t.theme}</label>
                                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative transition-colors">
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`} />
                                </button>
                             </div>
                             <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2"><Languages className="w-4 h-4" /> {t.language}</label>
                                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-xs font-bold bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors">
                                {lang.toUpperCase()}
                                </button>
                             </div>
                         </div>

                         <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                             <p className="text-xs font-bold text-slate-400 uppercase px-1 mb-2">Data Management</p>
                            <button onClick={handleExportBackup} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium flex items-center justify-start px-4 gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                                <FileJson className="w-4 h-4" /> {t.exportBackup}
                            </button>
                            
                            <div className="relative">
                                <input type="file" ref={importInputRef} onChange={handleImportBackup} className="hidden" accept=".json" />
                                <button onClick={() => importInputRef.current?.click()} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium flex items-center justify-start px-4 gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                                    <Upload className="w-4 h-4" /> {t.importBackup}
                                </button>
                            </div>

                            <button onClick={handleReportBug} className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-xs font-medium flex items-center justify-start px-4 gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors">
                                <AlertOctagon className="w-4 h-4" /> {t.reportBug}
                            </button>
                         </div>
                         
                         <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                             <button onClick={handleOpenHelp} className="w-full py-2 mb-2 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                                 <Info className="w-3.5 h-3.5" /> {t.aboutApp}
                             </button>
                            <p className="text-[10px] text-slate-400 text-center">Tri-Coder AI v2.2</p>
                         </div>
                    </div>
                )}
             </div>
        </div>
    </>
  );
};
