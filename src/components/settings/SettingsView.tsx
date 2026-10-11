import React, { useState } from 'react';
import { AIProviderConfig, CompanionState, Project } from '../../types';
import { 
  SlidersHorizontal, 
  Palette, 
  Laptop, 
  Cpu, 
  Save, 
  Download, 
  CheckCircle2, 
  RotateCcw 
} from 'lucide-react';

interface SettingsViewProps {
  appName: string;
  setAppName: (name: string) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  aiConfig: AIProviderConfig;
  onUpdateAIConfig: (cfg: Partial<AIProviderConfig>) => void;
  companionState: CompanionState;
  projects: Project[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  appName,
  setAppName,
  theme,
  setTheme,
  aiConfig,
  onUpdateAIConfig,
  companionState,
  projects,
}) => {
  const [localName, setLocalName] = useState(appName);
  const [localOllamaUrl, setLocalOllamaUrl] = useState(aiConfig.localEndpoint);
  const [confirmTools, setConfirmTools] = useState(aiConfig.confirmConsequentialTools);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = () => {
    setAppName(localName);
    onUpdateAIConfig({
      localEndpoint: localOllamaUrl,
      confirmConsequentialTools: confirmTools,
    });
    setSaveStatus('Preferences saved successfully.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleExportBackup = () => {
    const backupData = {
      workspaceName: localName,
      timestamp: new Date().toISOString(),
      projects,
      aiConfig,
      companionConfig: { port: companionState.port, allowlistedCommands: companionState.allowlistedCommands }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `craft-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-[var(--border-subtle)] pb-6">
        <div className="text-xs font-mono text-[#B7A0FF] tracking-wider uppercase">
          Configuration
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Workspace Settings & Preferences
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage product branding identity, theme tokens, AI provider routing, and local companion security.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 1. Brand Identity & Product Renaming */}
      <section className="space-y-4 p-5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <SlidersHorizontal size={16} className="text-[#B7A0FF]" />
          <span>Product Identity & White-labeling</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          The product name is configurable so the workspace can be tailored or rebranded without altering underlying code.
        </p>
        <div className="max-w-md">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Workspace Display Name
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]"
          />
        </div>
      </section>

      {/* 2. Theme & Visual System */}
      <section className="space-y-4 p-5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Palette size={16} className="text-[#B7A0FF]" />
          <span>Design Tokens & Theme</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded text-xs font-medium border transition-colors ${
              theme === 'dark'
                ? 'bg-[#17191D] text-[#F2F3F5] border-[#B7A0FF]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
          >
            Dark Studio (#101114)
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded text-xs font-medium border transition-colors ${
              theme === 'light'
                ? 'bg-[#FFFFFF] text-[#121417] border-[#7852FF]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
          >
            Light Studio (#F7F8FA)
          </button>
        </div>
      </section>

      {/* 3. AI Providers & Privacy */}
      <section className="space-y-4 p-5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Cpu size={16} className="text-[#B7A0FF]" />
          <span>AI Provider & Security</span>
        </div>
        <div className="space-y-3 max-w-lg text-xs">
          <div>
            <label className="block font-medium text-[var(--text-secondary)] mb-1">
              Local Ollama Inference Endpoint
            </label>
            <input
              type="text"
              value={localOllamaUrl}
              onChange={(e) => setLocalOllamaUrl(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={confirmTools}
              onChange={(e) => setConfirmTools(e.target.checked)}
              className="rounded accent-[#B7A0FF]"
            />
            <span className="text-[var(--text-primary)]">
              Require explicit user confirmation before executing consequential file modifications
            </span>
          </label>
        </div>
      </section>

      {/* 4. Backup & Data Export */}
      <section className="space-y-4 p-5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Download size={16} className="text-[#B7A0FF]" />
          <span>Project Data Backup</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Download a complete portable JSON export of workspace projects, asset manifests, and registered settings.
        </p>
        <button
          onClick={handleExportBackup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#B7A0FF] text-xs font-medium text-[var(--text-primary)] transition-colors"
        >
          <Download size={13} />
          <span>Download Workspace Snapshot</span>
        </button>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 rounded bg-[#B7A0FF] text-[#101114] font-semibold text-xs hover:bg-[#c8b6ff] transition-colors"
        >
          <Save size={14} />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
};
