import React from 'react';
import { Idea } from '../types';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, Languages } from 'lucide-react';
import { Language } from '../types';

interface IdeaCardProps {
  idea: Idea;
  onVerify: (idea: Idea) => void;
  onViewBlueprint: (idea: Idea) => void;
  onTranslate?: (idea: Idea) => void;
  isTranslating?: boolean;
  currentLang?: Language;
  t: any;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onVerify, onViewBlueprint, onTranslate, isTranslating, currentLang, t }) => {
  const getDegenColor = (score: number) => {
    if (score < 40) return 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20';
    if (score < 80) return 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20';
    return 'bg-[#6D28D9]/10 text-[#6D28D9] border-[#6D28D9]/20';
  };

  return (
    <div className="group relative bg-[#0F0F0F] border border-white/5 hover:border-white/20 rounded-xl p-5 transition-all hover:-translate-y-1 duration-300 flex flex-col h-full min-h-0">
      {/* Top Meta */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getDegenColor(idea.degenScore)}`}>
            {t.degen}: {idea.degenScore}%
          </span>
          <span className="text-[10px] font-mono text-gray-500 border border-white/5 px-2 py-0.5 rounded">
            {idea.ecosystem}
          </span>
        </div>
        {idea.status === 'VERIFIED' && idea.verificationResult?.isUnique && (
          <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
        )}
        {idea.status === 'VERIFIED' && !idea.verificationResult?.isUnique && (
          <AlertTriangle className="w-5 h-5 text-[#A78BFA]" />
        )}
        {idea.status === 'VERIFYING' && (
          <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#8B5CF6] transition-colors">{idea.title}</h3>
        <p className="text-xs text-gray-500 mb-3 font-mono">{idea.tagline}</p>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">{idea.description}</p>

        {/* Features Preview */}
        <div className="flex flex-wrap gap-1 mb-4">
          {idea.features.slice(0, 3).map((f, i) => (
            <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-white/5 mt-auto flex gap-2">
        {idea.status === 'GENERATED' || idea.status === 'FAILED' ? (
          <>
            <button
              onClick={() => onVerify(idea)}
              className="flex-1 py-2 text-xs font-mono font-bold text-black bg-white hover:bg-[#8B5CF6] hover:text-white rounded transition-colors"
            >
              {t.verify}
            </button>
            {onTranslate && idea.language && idea.language !== currentLang && (
              <button
                onClick={() => onTranslate(idea)}
                className="px-3 py-2 text-black bg-white hover:bg-[#8B5CF6] hover:text-white rounded transition-colors flex items-center justify-center"
                title="Translate to current language"
              >
                {isTranslating ? <Activity className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              </button>
            )}
          </>
        ) : idea.status === 'VERIFYING' ? (
          <button disabled className="flex-1 py-2 text-xs font-mono text-gray-500 bg-white/5 rounded cursor-wait">
            {t.analyzing}
          </button>
        ) : (
          <button
            onClick={() => onViewBlueprint(idea)}
            className={`flex-1 py-2 text-xs font-mono font-bold text-black rounded transition-colors flex items-center justify-center gap-2
                ${!idea.verificationResult?.isUnique ? 'bg-[#A78BFA] hover:bg-[#8B5CF6]' : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'}`}
          >
            {idea.verificationResult?.isUnique ? t.build : t.conflicts} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default IdeaCard;
