import React from 'react';
import { ForgeConfig, Ecosystem, Sector } from '../types';
import { ECOSYSTEMS, SECTORS } from '../constants';
import { Settings2, Dice5, Zap } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { monad } from 'wagmi/chains';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface ConfigPanelProps {
  config: ForgeConfig;
  setConfig: React.Dispatch<React.SetStateAction<ForgeConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
  t: any;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, onGenerate, isGenerating, t }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const isOnMonad = chainId === monad.id;

  const handleAction = () => {
    if (!isConnected) {
      if (openConnectModal) openConnectModal();
      return;
    }
    if (!isOnMonad) {
      if (switchChain) switchChain({ chainId: monad.id });
      return;
    }
    onGenerate();
  };

  const toggleSelection = <T extends string>(list: T[], item: T): T[] => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  const getDegenLabel = (level: number) => {
    if (level < 30) return t.degen_safe;
    if (level < 80) return t.degen_balanced;
    return t.degen_chaos;
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6 relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Settings2 className="w-5 h-5 text-[#8B5CF6]" />
          <span className="tracking-wider">{t.lab}</span>
        </h2>

        <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setConfig(prev => ({ ...prev, mode: 'TARGETED' }))}
            className={`px-4 py-1.5 text-xs font-mono rounded-md transition-all ${config.mode === 'TARGETED' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
          >
            {t.mode_targeted}
          </button>
          <button
            onClick={() => setConfig(prev => ({ ...prev, mode: 'RANDOM' }))}
            className={`px-4 py-1.5 text-xs font-mono rounded-md transition-all ${config.mode === 'RANDOM' ? 'bg-[#A78BFA] text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
          >
            {t.mode_chaos}
          </button>
        </div>
      </div>

      {config.mode === 'TARGETED' ? (
        <div className="space-y-6">
          {/* Ecosystems */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{t.ecosystem}</label>
            <div className="flex flex-wrap gap-2">
              {ECOSYSTEMS.map(chain => (
                <button
                  key={chain}
                  onClick={() => setConfig(prev => ({ ...prev, ecosystems: toggleSelection(prev.ecosystems, chain) }))}
                  className={`px-3 py-1.5 rounded border text-xs font-mono transition-all ${config.ecosystems.includes(chain)
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Sectors */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{t.sector}</label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(sec => (
                <button
                  key={sec}
                  onClick={() => setConfig(prev => ({ ...prev, sectors: toggleSelection(prev.sectors, sec) }))}
                  className={`px-3 py-1.5 rounded border text-xs font-mono transition-all ${config.sectors.includes(sec)
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">{t.quantity}</span>
                <span className="text-[#8B5CF6]">{config.quantity}</span>
              </div>
              <input
                type="range" min="1" max="5"
                value={config.quantity}
                onChange={(e) => setConfig(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">{t.degen_factor}</span>
                <span className={`${config.degenLevel > 80 ? 'text-[#A78BFA] animate-pulse' : 'text-[#8B5CF6]'}`}>
                  {config.degenLevel}%
                </span>
              </div>
              <input
                type="range" min="0" max="100" step="10"
                value={config.degenLevel}
                onChange={(e) => setConfig(prev => ({ ...prev, degenLevel: parseInt(e.target.value) }))}
                className={`w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer ${config.degenLevel > 80 ? 'accent-[#A78BFA]' : 'accent-[#8B5CF6]'
                  }`}
              />
              <div className="text-[10px] text-gray-500 text-right">
                {getDegenLabel(config.degenLevel)}
              </div>
            </div>
          </div>

          {/* User Context Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{t.context_label}</label>
            <textarea
              value={config.userContext || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, userContext: e.target.value }))}
              placeholder={t.context_placeholder}
              className="w-full h-20 bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 focus:border-[#8B5CF6] focus:outline-none resize-none placeholder-gray-700"
            />
          </div>

          <button
            onClick={handleAction}
            disabled={isGenerating || isSwitching}
            className={`w-full py-4 font-bold font-mono rounded transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] ${!isConnected
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
              }`}
          >
            {isGenerating ? <Zap className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {isGenerating
              ? t.forging
              : (isConnected ? (isOnMonad ? t.mint : t.switch_monad) : t.connect_wallet)}
          </button>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-8">
          <div className="text-center space-y-2">
            <Dice5 className="w-12 h-12 text-[#A78BFA] mx-auto opacity-80" />
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {t.random_desc}
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">{t.quantity}</span>
              <span className="text-[#A78BFA]">{config.quantity}</span>
            </div>
            <input
              type="range" min="1" max="5"
              value={config.quantity}
              onChange={(e) => setConfig(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#A78BFA]"
            />
          </div>

          <button
            onClick={handleAction}
            disabled={isGenerating || isSwitching}
            className={`w-full max-w-xs py-5 font-bold font-mono rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(139,92,246,0.35)] ${!isConnected
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gradient-to-r from-[#A78BFA] to-[#6D28D9] text-white hover:brightness-110'
              }`}
          >
            {isGenerating
              ? t.cooking
              : (isConnected ? (isOnMonad ? t.cook : t.switch_monad) : t.connect_wallet)}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;
