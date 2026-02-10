import React from 'react';
import { IdeaBatch, Language } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BatchDrawerProps {
  batches: IdeaBatch[];
  onRestore: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  lang: Language;
}

const formatBatchDate = (timestamp: number, locale: Language) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  } catch (error) {
    return new Date(timestamp).toLocaleString();
  }
};

const BatchDrawer: React.FC<BatchDrawerProps> = ({ batches, onRestore, isOpen, onToggle, lang }) => {
  const empty = batches.length === 0;

  return (
    <>
      <aside
      className={`fixed top-0 right-0 bottom-0 z-40 flex flex-col w-full max-w-[min(100%,28rem)] bg-black/95 border-l border-white/10 shadow-2xl transition-transform duration-300 sm:w-80 lg:w-96 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-300">Saved batches</p>
            <p className="text-[10px] text-gray-500">Restore earlier ideation runs.</p>
          </div>
          <button
            onClick={onToggle}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Toggle batch drawer"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {empty && (
            <p className="text-xs text-gray-500">
              You do not have any saved batches yet. Generate some protocols to populate this list.
            </p>
          )}

          {batches.map(batch => (
            <button
              key={batch.id}
              onClick={() => onRestore(batch.id)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-white">{batch.label}</span>
                <span className="text-[10px] text-gray-400">{batch.ideas.length} ideas</span>
              </div>
              <p className="text-[11px] text-gray-400">{formatBatchDate(batch.createdAt, lang)}</p>
              <p className="text-[10px] text-gray-500">Tap to restore into the protocols list.</p>
            </button>
          ))}
        </div>
      </aside>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-3 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/40 transition hover:bg-[#7C3AED]"
          aria-label="Open saved batches"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default BatchDrawer;
