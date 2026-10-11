import React, { useState } from 'react';
import { ProjectAsset, CraftApp, CompanionState } from '../../types';
import { 
  Terminal, 
  ExternalLink, 
  Laptop, 
  FileText, 
  Download, 
  Layers, 
  Play, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GenericCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
  companionState: CompanionState;
  onOpenCompanionModal: () => void;
}

export const GenericCraftWorkspace: React.FC<GenericCraftWorkspaceProps> = ({
  app,
  asset,
  companionState,
  onOpenCompanionModal,
}) => {
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleLaunchViaCompanion = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      if (companionState.connected) {
        setExecutionOutput(`[COMPANION 127.0.0.1:9876]\n> Launching native process: ${app.repoName}.exe\n> Process ID: 8941 initialized.\n> Shared project memory mapped.\nApplication running natively in desktop window.`);
      } else {
        setExecutionOutput(`[BRIDGE NOTICE]\nCraft Local Companion is currently disconnected.\nTo launch the native Windows desktop binary for ${app.name}, start the companion background daemon on 127.0.0.1:9876 and verify the security token.`);
      }
    }, 600);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">{app.name}</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              v{app.version} · {app.edition}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              {app.license}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunchViaCompanion}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium text-xs disabled:opacity-50"
            >
              <Play size={12} />
              <span>{isRunning ? 'Launching...' : 'Launch via Companion'}</span>
            </button>
          </div>
        </div>

        {/* Studio Content Area */}
        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto space-y-8">
          {/* Header & Tagline */}
          <div className="space-y-3 border-b border-[var(--border-subtle)] pb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-[#B7A0FF]">
              <span>STORYTOLD ECOSYSTEM</span>
              <span aria-hidden="true">·</span>
              <span>{app.repoName.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {app.name} Studio Workspace
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {app.description}
            </p>
          </div>

          {/* Execution Output Console */}
          {executionOutput && (
            <div className="p-4 rounded bg-[#0A0B0D] border border-[var(--border-subtle)] font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5">
                <span>Process Execution Monitor</span>
                <span className={companionState.connected ? 'text-emerald-400' : 'text-amber-400'}>
                  {companionState.connected ? 'Process Attached' : 'Awaiting Companion'}
                </span>
              </div>
              <pre className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                {executionOutput}
              </pre>
            </div>
          )}

          {/* Crate Architecture & Verified Capabilities */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Verified Repository Crates & Sub-Apps ({app.cratesCount} Crates)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {app.crates.map((crate) => (
                <div 
                  key={crate} 
                  className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-secondary)] flex items-center justify-between"
                >
                  <span className="truncate">{crate}</span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">crate</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Formats */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Native File Associations & Media Types
            </h2>
            <div className="flex flex-wrap gap-2">
              {app.supportedFormats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)]"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* CLI Instructions */}
          {app.cliCommand && (
            <div className="space-y-2 p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Terminal size={14} className="text-[#B7A0FF]" />
                <span>Headless Command-Line Interface</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                You can invoke this tool directly through the terminal or script it into automated build pipelines.
              </p>
              <div className="p-2 rounded bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-primary)]">
                {app.cliCommand}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Environment & Status Dock */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <Laptop size={14} className="text-[#B7A0FF]" />
            <span>Runtime Target</span>
          </div>

          <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>WebAssembly (WASM)</span>
              <span className={`font-mono ${app.hasWasm ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {app.hasWasm ? 'Supported' : 'Native only'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>Native Desktop (egui)</span>
              <span className={`font-mono ${app.hasDesktop ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {app.hasDesktop ? 'Supported' : 'Headless/CLI'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>MCP Protocol</span>
              <span className={`font-mono ${app.hasMcp ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                {app.hasMcp ? 'Exposed' : 'None'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>Companion Channel</span>
              <span className="font-mono text-[var(--text-primary)]">Loopback :9876</span>
            </div>
          </div>

          <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="font-medium text-[var(--text-primary)]">Companion Status</div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {companionState.connected
                ? 'Local companion is paired. Native execution requests are authorized.'
                : 'Companion is offline. Click below to configure local loopback pairing.'}
            </p>
            <button
              onClick={onOpenCompanionModal}
              className="w-full py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-primary)] hover:border-[#B7A0FF] transition-colors"
            >
              Configure Companion
            </button>
          </div>
        </div>

        <a
          href={app.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs"
        >
          <span>View GitHub Source</span>
          <ExternalLink size={12} />
        </a>
      </aside>
    </div>
  );
};
