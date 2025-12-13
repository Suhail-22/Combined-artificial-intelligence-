import React, { useEffect, useRef } from 'react';
import { Play, Copy, ExternalLink, SquareTerminal } from 'lucide-react';
import { Folder } from './types';

// Declare Prism global to avoid TS errors
declare const Prism: any;

interface CodeBlockProps {
  content: string;
  folders: Folder[];
  onSaveSnippet: (folderId: string, code: string, lang: string) => void;
  onPreview: (code: string) => void;
  onOpenWorkspace: (code: string, lang: string) => void;
  t: any;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content, folders, onSaveSnippet, onPreview, onOpenWorkspace, t }) => {
  const codeRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      // Small timeout ensures DOM is ready for Prism
      setTimeout(() => {
        codeRefs.current.forEach(block => {
            if (block) Prism.highlightElement(block);
        });
      }, 10);
    }
  }, [content]);

  if (!content) return null;
  const parts = content.split(/(```[\w-]*\n[\s\S]*?```)/g);

  return (
    <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const rawLang = lines[0].replace('```', '').trim();
          const lang = rawLang || 'txt';
          const code = lines.slice(1, -1).join('\n');
          const isWeb = ['html', 'css', 'javascript', 'js'].includes(lang.toLowerCase());

          // Map simple language names to Prism classes
          const prismClass = `language-${lang === 'js' ? 'javascript' : lang === 'ts' ? 'typescript' : lang}`;

          return (
            <div key={index} className="my-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#282c34] shadow-md flex flex-col relative group" dir="ltr">
              {/* Sticky Header - Floating Toolbar */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[#21252b] border-b border-slate-700 rounded-t-lg backdrop-blur-sm bg-opacity-95">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase select-none">{lang}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpenWorkspace(code, lang)} className="p-1.5 hover:bg-slate-700 rounded text-indigo-400 transition-colors flex items-center gap-1" title={t.openWorkspace}>
                     <SquareTerminal className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold hidden sm:inline">{t.workspace}</span>
                  </button>
                  {isWeb && (
                    <button onClick={() => onOpenWorkspace(code, lang)} className="p-1.5 hover:bg-slate-700 rounded text-emerald-400 transition-colors" title={t.preview}>
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(code)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title={t.copy}>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content Area */}
              <div className="overflow-x-auto custom-scrollbar">
                <pre className={`${prismClass} !m-0 !p-4 !bg-[#282c34] !text-sm !overflow-visible`} style={{ margin: 0, minHeight: '100%' }}>
                    <code 
                        ref={el => { if (el) codeRefs.current[index] = el; }}
                        className={prismClass}
                    >
                        {code}
                    </code>
                </pre>
              </div>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap mb-2">{part}</p>;
      })}
    </div>
  );
};
