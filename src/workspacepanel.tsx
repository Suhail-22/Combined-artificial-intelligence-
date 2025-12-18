import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Code2, Copy, Download, Maximize2, Minimize2 } from 'lucide-react';
import { downloadFile } from './utils';

// Declare Prism global
declare const Prism: any;

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  lang: string;
  t: any;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ isOpen, onClose, code, lang, t }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [editedCode, setEditedCode] = useState(code);
  const codeRef = useRef<HTMLElement>(null);
  
  // Is Web Code? (HTML/JS/CSS)
  const isWeb = ['html', 'css', 'javascript', 'js'].includes(lang.toLowerCase());

  useEffect(() => {
    setEditedCode(code);
    setActiveTab(isWeb ? 'preview' : 'code');
  }, [code, lang, isWeb]);

  useEffect(() => {
    if (activeTab === 'code' && codeRef.current && typeof Prism !== 'undefined') {
        // Simple highlight on switch
        Prism.highlightElement(codeRef.current);
    }
  }, [activeTab, editedCode]);

  if (!isOpen) return null;

  const prismClass = `language-${lang === 'js' ? 'javascript' : lang === 'ts' ? 'typescript' : lang}`;

  return (
    <div className={`fixed inset-y-0 z-20 w-full md:w-[45%] bg-white dark:bg-[#1e1e1e] border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 flex flex-col
        ${document.dir === 'rtl' ? 'left-0' : 'right-0'}
        ${isOpen ? 'translate-x-0' : (document.dir === 'rtl' ? '-translate-x-full' : 'translate-x-full')}
        md:relative md:translate-x-0 md:shadow-none
    `}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#252526]">
        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('code')}
             className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'code' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             <Code2 className="w-3.5 h-3.5" /> {t.code}
           </button>
           {isWeb && (
             <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-600 shadow text-emerald-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                <Play className="w-3.5 h-3.5" /> {t.preview}
             </button>
           )}
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={() => navigator.clipboard.writeText(editedCode)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400" title={t.copy}>
                <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => downloadFile('code.txt', editedCode)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400" title={t.download}>
                <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-500 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
         {activeTab === 'code' ? (
            <div className="h-full w-full overflow-auto custom-scrollbar relative group">
                {/* Editable Area (Simplified as textarea overlaying code block for now, or just display) */}
                {/* For true editing, we'd need a proper editor like Monaco. For now, we allow copying/viewing large blocks. */}
                <textarea 
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white font-mono text-sm z-10 resize-none focus:outline-none"
                    spellCheck={false}
                />
                <pre className={`${prismClass} !m-0 !p-4 !bg-transparent !text-sm pointer-events-none absolute inset-0`}>
                    <code ref={codeRef} className={prismClass}>{editedCode}</code>
                </pre>
            </div>
         ) : (
            <div className="h-full w-full bg-white relative">
               <iframe 
                  srcDoc={editedCode} 
                  title="Preview" 
                  className="w-full h-full border-0" 
                  sandbox="allow-scripts"
               />
            </div>
         )}
      </div>
    </div>
  );
};
