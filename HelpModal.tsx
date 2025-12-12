import React from 'react';
import { X, BrainCircuit, Code2, MessageSquare, Scale, Users, CheckCircle } from 'lucide-react';
import { TRANSLATIONS } from './constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}>
         
         <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-indigo-600" />
                {t.help.title}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            <section>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                   <Users className="w-5 h-5 text-purple-500" /> {t.help.modelsTitle}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300 mb-2">
                            <BrainCircuit className="w-4 h-4" /> Logic Master
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {lang === 'ar' ? 'مهندس معماري يركز على تحليل المشكلة وتوضيح الخوارزميات قبل كتابة الكود.' : 'Software Architect focusing on problem analysis and algorithm explanation before coding.'}
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                         <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300 mb-2">
                            <Code2 className="w-4 h-4" /> Code Ninja
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {lang === 'ar' ? 'مبرمج محترف يكتب كوداً نظيفاً، سريعاً، وجاهزاً للإنتاج بدون شرح مطول.' : 'Senior Engineer providing optimized, clean, and production-ready code instantly.'}
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                         <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                            <MessageSquare className="w-4 h-4" /> Mentor
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {lang === 'ar' ? 'معلم يشرح الأكواد بتبسيط ويوازن بين التعليم والتنفيذ.' : 'A friendly teacher explaining concepts simply and balancing code with education.'}
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                   <Scale className="w-5 h-5 text-yellow-500" /> {t.help.judgeTitle}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                   {lang === 'ar' 
                    ? 'يقوم هذا النظام بإرسال إجابات النماذج الثلاثة إلى نموذج رابع محايد ليحكم بينها بناءً على الصحة، الأداء، والأمان، ويعلن الفائز مع تعليل مفصل.'
                    : 'This system sends the three model responses to a fourth impartial judge model to evaluate them based on correctness, performance, and security.'}
                </p>
            </section>

             <section>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                   <Users className="w-5 h-5 text-indigo-500" /> {t.help.consensusTitle}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                   {lang === 'ar' 
                    ? 'بعد التحكيم، يمكنك طلب "توحيد الحلول". يقوم الذكاء الاصطناعي بدمج أفضل أجزاء كل كود لإنتاج حل "ماستر" مثالي.'
                    : 'After judgment, you can request "Consensus". AI combines the best parts of each code to generate a perfect "Master Solution".'}
                </p>
            </section>

         </div>
         
         <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
             <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors">
                {lang === 'ar' ? 'فهمت' : 'Got it'}
             </button>
         </div>
      </div>
    </div>
  );
};
