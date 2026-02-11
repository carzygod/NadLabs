import React, { useState, useEffect } from 'react';
import { ForgeConfig, Idea, LogMessage, Blueprint, Language, IdeaBatch, AISettings } from './types';
import { TRANSLATIONS, LANG_NAMES } from './locales';
import { generateIdeas, verifyIdea, generateBlueprint, translateIdea, AIError } from './services/ai';
import ConfigPanel from './components/ConfigPanel';
import TerminalOutput from './components/TerminalOutput';
import IdeaCard from './components/IdeaCard';
import IdeaCarousel from './components/IdeaCarousel';
import BlueprintModal from './components/BlueprintModal';
import SettingsModal from './components/SettingsModal';
import ErrorModal from './components/ErrorModal';
import BatchDrawer from './components/BatchDrawer';
import { Terminal, Zap, Globe, LayoutGrid, GalleryHorizontalEnd, Settings, Github, Twitter } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const BATCH_STORAGE_KEY = 'nadlabs_batches';
const MAX_BATCHES_STORED = 12;

const cloneIdea = (idea: Idea): Idea => ({
  ...idea,
  features: [...idea.features],
  verificationResult: idea.verificationResult
    ? {
        ...idea.verificationResult,
        similarProjects: idea.verificationResult.similarProjects.map(project => ({ ...project })),
      }
    : undefined,
  blueprint: idea.blueprint ? { ...idea.blueprint } : undefined,
});

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('nadlabs_lang') as Language | null;
    return stored && Object.keys(LANG_NAMES).includes(stored) ? stored : 'en';
  });
  const [config, setConfig] = useState<ForgeConfig>({
    mode: 'TARGETED',
    ecosystems: ['Monad Testnet'],
    sectors: ['Nad.fun'],
    quantity: 3,
    degenLevel: 20
  });

  const [generatedBatches, setGeneratedBatches] = useState<IdeaBatch[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | undefined>(undefined);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'CAROUSEL'>('CAROUSEL');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const defaultAiSettings: AISettings = {
    baseUrl: process.env.OPENAI_DEFAULT_BASE_URL || process.env.OPENAI_BASE_URL || '',
    model: process.env.OPENAI_MODEL || ''
  };
  const [aiSettings, setAiSettings] = useState<AISettings>(() => ({ ...defaultAiSettings }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedConfig = window.localStorage.getItem('nadlabs_ai_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig) as AISettings;
        setAiSettings({
          ...defaultAiSettings,
          ...parsed
        });
        return;
      } catch {
        // ignore
      }
    }
    const legacyKey = window.localStorage.getItem('nadlabs_api_key');
    if (legacyKey) {
      setAiSettings({
        ...defaultAiSettings,
        apiKey: legacyKey
      });
      return;
    }
  }, []);

  // Persist language preference locally whenever it changes
  useEffect(() => {
    localStorage.setItem('nadlabs_lang', lang);
  }, [lang]);

  const persistBatches = (batches: IdeaBatch[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batches));
  };

  const updateStoredIdea = (ideaId: string, updater: (idea: Idea) => Idea) => {
    setGeneratedBatches(prev => {
      let touched = false;
      const next = prev.map(batch => {
        let batchTouched = false;
        const nextIdeas = batch.ideas.map(idea => {
          if (idea.id !== ideaId) return idea;
          touched = true;
          batchTouched = true;
          return updater({ ...idea });
        });
        return batchTouched ? { ...batch, ideas: nextIdeas } : batch;
      });
      if (touched) persistBatches(next);
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(BATCH_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as IdeaBatch[];
      setGeneratedBatches(parsed);
    } catch {
      // ignore corrupt data
    }
  }, []);

  const handleSaveSettings = (config: AISettings) => {
    const normalized = {
      apiKey: config.apiKey?.trim() ?? '',
      baseUrl: config.baseUrl?.trim() ?? '',
      model: config.model?.trim() ?? '',
    };
    setAiSettings({
      apiKey: normalized.apiKey,
      baseUrl: normalized.baseUrl || defaultAiSettings.baseUrl,
      model: normalized.model || defaultAiSettings.model,
    });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nadlabs_ai_config', JSON.stringify(normalized));
    }
    setIsSettingsOpen(false);
    addLog("System configuration updated.", 'success');
  };

  // Error State
  const [errorState, setErrorState] = useState<{ isOpen: boolean; title: string; message: string; code?: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const handleError = (error: any) => {
    let title = "System Error";
    let message = "An unexpected error occurred.";
    let code = undefined;

    if (error instanceof AIError) {
      title = "AI Model Error";
      message = error.message;
      code = error.code;
    } else if (error instanceof Error) {
      message = error.message;
    }

    setErrorState({
      isOpen: true,
      title,
      message,
      code
    });
  };

  const t = TRANSLATIONS[lang];

  const addLog = (text: string, type: LogMessage['type'] = 'info') => {
    setLogs(prev => [...prev, { id: crypto.randomUUID(), text, type, timestamp: Date.now() }]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIdeas([]);
    setLogs([]);

    addLog(t.app.logs.init);

    // Simulate thinking steps
    setTimeout(() => addLog(t.app.logs.scan.replace('{n}', config.ecosystems.length.toString())), 600);
    setTimeout(() => addLog(t.app.logs.analyze.replace('{sectors}', config.sectors.join(', '))), 1200);

    try {
      // Pass the stored AI configuration to the service
      const generatedIdeas = await generateIdeas(config, lang, aiSettings);

      generatedIdeas.forEach((_, i) => {
        setTimeout(() => {
          addLog(t.app.logs.synth.replace('{n}', (i + 1).toString()), 'success');
        }, 1500 + (i * 200));
      });

      setIdeas(generatedIdeas);
      const batchLabelDate = new Date().toLocaleString(lang, { hour12: false });
      const clonedBatchIdeas = generatedIdeas.map(cloneIdea);
      const newBatch: IdeaBatch = {
        id: crypto.randomUUID(),
        label: `${batchLabelDate} - ${config.mode === 'TARGETED' ? t.config.mode_targeted : t.config.mode_chaos}`,
        createdAt: Date.now(),
        ideas: clonedBatchIdeas,
      };
      setGeneratedBatches(prev => {
        const next = [newBatch, ...prev].slice(0, MAX_BATCHES_STORED);
        persistBatches(next);
        return next;
      });
      addLog(t.app.logs.batch, 'success');
    } catch (error) {
      addLog(t.app.logs.fail, 'error');
      console.error(error);
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestoreBatch = (batchId: string) => {
    const batch = generatedBatches.find(b => b.id === batchId);
    if (!batch) return;
    const restoredIdeas = batch.ideas.map(cloneIdea);
    setIdeas(restoredIdeas);
    setSelectedIdea(null);
    setActiveBlueprint(undefined);
    addLog(`Restored batch from ${new Intl.DateTimeFormat(lang, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(batch.createdAt)}`, 'info');
  };

  const handleVerify = async (idea: Idea) => {
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'VERIFYING' } : i));
    addLog(t.app.logs.verify_start.replace('{title}', idea.title), 'warning');

    try {
      const result = await verifyIdea(idea, lang, aiSettings);
      setIdeas(prev => prev.map(i => i.id === idea.id ? {
        ...i,
        status: 'VERIFIED',
        verificationResult: result
      } : i));
      updateStoredIdea(idea.id, stored => ({
        ...stored,
        status: 'VERIFIED',
        verificationResult: result
      }));

      if (result.isUnique) {
        addLog(t.app.logs.verify_success.replace('{title}', idea.title), 'success');
      } else {
        addLog(t.app.logs.verify_collision.replace('{title}', idea.title).replace('{n}', result.similarProjects.length.toString()), 'warning');
      }

    } catch (error) {
      addLog(t.app.logs.verify_fail.replace('{title}', idea.title), 'error');
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'FAILED' } : i));
    }
  };

  const handleViewBlueprint = async (idea: Idea) => {
    setSelectedIdea(idea);
    setActiveBlueprint(idea.blueprint); // Might be undefined initially

    if (!idea.blueprint) {
      // Generate on fly
      try {
        const blueprint = await generateBlueprint(idea, lang, aiSettings);
        setActiveBlueprint(blueprint);
        // Cache it
        setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, blueprint } : i));
        updateStoredIdea(idea.id, stored => ({ ...stored, blueprint }));
      } catch (error) {
        console.error(error);
        handleError(error);
      }
    }
  };

  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  const handleTranslate = async (idea: Idea) => {
    setTranslatingIds(prev => new Set(prev).add(idea.id));
    try {
      const translatedIdea = await translateIdea(idea, lang, aiSettings);
      setIdeas(prev => prev.map(i => i.id === idea.id ? translatedIdea : i));
      addLog(`Translated ${idea.title} to ${lang}`, 'success');
    } catch (error) {
      console.error("Translation Error", error);
      addLog(`Translation failed for ${idea.title}`, 'error');
      handleError(error);
    } finally {
      setTranslatingIds(prev => {
        const next = new Set(prev);
        next.delete(idea.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0614] text-gray-200 pb-20 relative cyber-grid">
      <div className="scanline"></div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#8B5CF6]/10 p-1.5 rounded border border-[#8B5CF6]/30">
              <img src="/logo.svg" alt="NadLabs logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold tracking-wider text-white">{t.navbar.title}</span>
            <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-1 rounded">{t.navbar.subtitle}</span>
              <a
                href="/skill.md"
                className="text-[10px] font-mono px-2 py-1 rounded border border-[#A78BFA]/40 text-[#A78BFA] bg-[#A78BFA]/10 hover:border-[#A78BFA] hover:text-black hover:bg-[#A78BFA] transition"
              >
                I'm agent
              </a>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-gray-400">
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{LANG_NAMES[lang]}</span>
              </button>
              {isLangOpen && (
                <div className="absolute top-8 right-0 bg-black border border-white/10 rounded-lg p-1 min-w-[120px] shadow-xl z-50">
                  {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setIsLangOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-white/5 ${lang === l ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
                    >
                      {LANG_NAMES[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="hidden sm:block">
              <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
            </div>
          </div>
        </div>
      </nav>

      <main
        className={`max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all ${
          isDrawerOpen ? 'lg:pr-[20rem]' : ''
        }`}
      >

        {/* Left Col: Config */}
        <div className="lg:col-span-4 space-y-6">
          <ConfigPanel
            config={config}
            setConfig={setConfig}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            t={t.config}
          />

          <TerminalOutput logs={logs} isThinking={isGenerating} t={t.terminal} />
        </div>

        {/* Right Col: Results */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#8B5CF6]" /> {t.app.protocols}
            </h2>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-gray-500 hidden sm:inline">{t.app.count}: {ideas.length}</span>

              {/* View Toggle */}
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-2 rounded transition-all ${viewMode === 'GRID' ? 'bg-[#8B5CF6] text-white' : 'text-gray-400 hover:text-white'}`}
                  title={t.app.view_grid}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('CAROUSEL')}
                  className={`p-2 rounded transition-all ${viewMode === 'CAROUSEL' ? 'bg-[#A78BFA] text-black' : 'text-gray-400 hover:text-white'}`}
                  title={t.app.view_carousel}
                >
                  <GalleryHorizontalEnd className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {ideas.length === 0 ? (
            <div className="h-[500px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-600 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Terminal className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-mono text-sm">{t.app.awaiting}</p>
            </div>
          ) : (
            <>
              {viewMode === 'GRID' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ideas.map(idea => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onVerify={handleVerify}
                      onViewBlueprint={handleViewBlueprint}
                      onTranslate={handleTranslate}
                      isTranslating={translatingIds.has(idea.id)}
                      currentLang={lang}
                      t={t.card}
                    />
                  ))}
                </div>
              ) : (
                <IdeaCarousel
                  ideas={ideas}
                  onVerify={handleVerify}
                  onViewBlueprint={handleViewBlueprint}
                  onTranslate={handleTranslate}
                  isTranslating={id => translatingIds.has(id)}
                  currentLang={lang}
                  t={t.card}
                />
              )}
            </>
          )}
        </div>

      </main>

      <BatchDrawer
        batches={generatedBatches}
        onRestore={handleRestoreBatch}
        isOpen={isDrawerOpen}
        onToggle={toggleDrawer}
        lang={lang}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          currentConfig={aiSettings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          t={t.settings}
        />
      )}

      {/* Blueprint Modal */}
      {selectedIdea && (
        <BlueprintModal
          idea={selectedIdea}
          blueprint={activeBlueprint}
          onClose={() => setSelectedIdea(null)}
          t={t.modal}
          aiConfig={aiSettings}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorState.isOpen}
        onClose={() => setErrorState(prev => ({ ...prev, isOpen: false }))}
        title={errorState.title}
        message={errorState.message}
        code={errorState.code}
        t={{ dismiss: t.modal?.dismiss || "Dismiss" }}
      />

      <footer className="mt-10 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-center gap-6 text-xs font-mono text-gray-400">
          <a
            className="rounded-full bg-white/5 p-2 text-[#8B5CF6] transition hover:bg-white/10"
            href="https://github.com/carzygod/NadLabs.git"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            className="rounded-full bg-white/5 p-2 text-[#8B5CF6] transition hover:bg-white/10"
            href="https://www.sidcloud.cn/"
            target="_blank"
            rel="noreferrer"
            aria-label="Website"
          >
            <Globe className="h-5 w-5" />
            <span className="sr-only">Website</span>
          </a>
          <a
            className="rounded-full bg-white/5 p-2 text-[#8B5CF6] transition hover:bg-white/10"
            href="https://x.com/carzygod"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
          >
            <Twitter className="h-5 w-5" />
            <span className="sr-only">X</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
