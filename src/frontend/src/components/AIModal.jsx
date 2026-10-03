import React from 'react';
import { X, Sparkles, Terminal } from 'lucide-react';

export default function AIModal({ isOpen, onClose, data, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f1523] border border-slate-700 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-100 font-mono">
                  NETRA AI Security Intelligence
                </h3>
                <span className="text-[10px] text-blue-300 font-mono px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">
                  {data?.source || 'Semantic Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                {data?.title || 'Analyzing Finding...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-300 font-sans">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs font-mono text-blue-400">
                Synthesizing compliance evaluation & threat reasoning...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#090d16] border border-slate-800 rounded-md p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-200">
                {data?.explanation || 'No explanation available.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono">NTRO Sovereign Defense Framework</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
