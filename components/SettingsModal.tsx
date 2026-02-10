import React, { useState, useEffect } from 'react';
import { X, Save, Key } from 'lucide-react';
import { AISettings } from '../types';

interface SettingsModalProps {
  currentConfig: AISettings;
  onSave: (config: AISettings) => void;
  onClose: () => void;
  t: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentConfig, onSave, onClose, t }) => {
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseUrl || '');
  const [model, setModel] = useState(currentConfig.model || '');

  useEffect(() => {
    setApiKey(currentConfig.apiKey || '');
    setBaseUrl(currentConfig.baseUrl || '');
    setModel(currentConfig.model || '');
  }, [currentConfig]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#050505] border border-white/10 w-full max-w-lg rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0A0A0A]">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Key className="w-5 h-5 text-[#8B5CF6]" />
                    {t.title}
                </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest">{t.api_label}</label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t.api_placeholder}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-[#8B5CF6] focus:outline-none transition-colors font-mono text-sm"
            />
            <p className="text-xs text-gray-500">{t.api_desc}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest">{t.base_url_label}</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={t.base_url_placeholder}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-[#8B5CF6] focus:outline-none transition-colors font-mono text-sm"
            />
            <p className="text-xs text-gray-500">{t.base_url_desc}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest">{t.model_label}</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t.model_placeholder}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-[#8B5CF6] focus:outline-none transition-colors font-mono text-sm"
            />
            <p className="text-xs text-gray-500">{t.model_desc}</p>
          </div>
        </div>

        {/* Persistence Note */}
        {t.persist_note && (
          <div className="px-8 space-y-1">
            <p className="text-[11px] text-gray-500">{t.persist_note}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-white/10 bg-[#0A0A0A] flex gap-4">
             <button 
                onClick={onClose}
                className="flex-1 py-3 text-sm font-mono font-bold text-gray-400 bg-white/5 hover:bg-white/10 rounded transition-colors"
             >
                {t.cancel}
             </button>
             <button 
            onClick={() => onSave({ apiKey, baseUrl, model })}
                className="flex-1 py-3 text-sm font-mono font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded transition-colors flex items-center justify-center gap-2"
             >
                <Save className="w-4 h-4" /> {t.save}
             </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
