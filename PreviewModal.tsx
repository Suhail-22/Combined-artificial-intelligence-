import React from 'react';
import { X } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string | null;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, code }) => {
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
