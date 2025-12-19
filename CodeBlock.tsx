import React, { useEffect } from 'react';
import { Play, Copy } from 'lucide-react';
import { Folder } from './types';

// Declare Prism global to avoid TS errors since we load it from CDN
declare const Prism: any;

interface CodeBlockProps {
  content: string;
  folders: Folder[];
  onSaveSnippet: (folderId: string, code: string, lang: string) => void;
  onPreview: (code: string) => void;
  t: any;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content, folders, onSaveSnippet, onPreview, t }) => {
  useEffect(() => {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
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
            <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#282c34] shadow-md flex flex-col max-h-[500px]" dir="ltr">
              {/* Sticky Header - Floating Toolbar */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[#21252b] border-b border-slate-700 backdrop-blur-sm bg-opacity-95">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase select-none">{lang}</span>
                <div className="flex items-center gap-2">
                  {isWeb && (
                    <button onClick={() => onPreview(code)} className="p-1.5 hover:bg-slate-700 rounded text-emerald-400 transition-colors" title={t.preview}>
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(code)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content Area */}
              <div className="relative overflow-y-auto custom-scrollbar">
                <pre className={`${prismClass} !m-0 !p-4 !bg-[#282c34] !text-sm`} style={{ margin: 0, minHeight: '100%' }}>
                    <code className={prismClass}>{code}</code>
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
