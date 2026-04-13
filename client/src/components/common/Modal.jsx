import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-level-3 w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-clinical-border dark:border-slate-700">
          <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-clinical-alt dark:hover:bg-slate-700 transition-colors">
            <X size={20} className="text-text-secondary dark:text-slate-400" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
