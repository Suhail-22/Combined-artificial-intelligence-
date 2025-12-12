import React from 'react';
import { Play, Copy } from 'lucide-react';
import { Folder } from './types';

interface CodeBlockProps {
  content: string;
  folders: Folder[];
  onSaveSnippet: (folderId: string, code: string, lang: string) => void;
  onPreview: (code: string) => void;
  t: any;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content, folders, onSaveSnippet, onPreview, t }) => {
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
