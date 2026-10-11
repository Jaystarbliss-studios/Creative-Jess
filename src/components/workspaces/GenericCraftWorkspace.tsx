import React, { useState } from 'react';
import { ProjectAsset, CraftApp, CompanionState } from '../../types';
import { companionService } from '../../services/companionService';
import { ExternalLink, Laptop, AlertTriangle, FileText, Play } from 'lucide-react';

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
  const [isRunning, setIsRunning] = useState(false);
  const infrastructure = app.category === 'platform_services' || app.category === 'developer_infra';
  const isConfigured = companionState.availableApps.includes(app.id);
  const canLaunch = companionState.connected && companionState.tokenPaired && isConfigured && !infrastructure;

  const handleLaunch = async () => {
    if (infrastructure) return;
    if (!companionState.connected || !companionState.tokenPaired) {
      onOpenCompanionModal();
      return;
    }
    if (!isConfigured) {
      setExecutionOutput('No executable path is configured for ' + app.id + '. Add its absolute executable path to CRAFT_APP_PATHS_JSON on the local machine, restart the companion, then check the connection again. No process was started.');
      return;
    }

    setIsRunning(true);
    setExecutionOutput(null);
    try {
      const result = await companionService.executeAllowlistedCommand('open-app', [app.id]);
      setExecutionOutput(result.output);
    } catch (error) {
      setExecutionOutput('Launch request failed. ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-auto bg-[var(--bg-workspace)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="border-b border-[var(--border-subtle)] pb-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">{infrastructure ? 'Supporting repository' : 'Workspace preview'}</div>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{app.name}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">{app.description}</p>
            </div>
            {!infrastructure && <button onClick={handleLaunch} disabled={isRunning} title={canLaunch ? 'Launch the configured native application' : 'Open launch setup or review the local path configuration'} className="inline-flex items-center gap-2 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-50">
              <Play size={13} /> {isRunning ? 'Starting process…' : canLaunch ? 'Launch native app' : 'Check launch setup'}
            </button>}
          </div>
        </header>

        <section className="mt-6 border-l-2 border-amber-400 pl-4 py-2">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><AlertTriangle size={15} className="text-amber-400" /> Upstream editor integration is not verified</div>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">This screen is the unified workspace shell, not the upstream editor. Native launch can start a configured process, but that does not prove the editor is ready or that editing, save, and export workflows work.</p>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Integration record</h2>
            <dl className="mt-3 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)] text-xs">
              <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--text-muted)]">Upstream repository</dt><dd><a href={app.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{app.repoName} <ExternalLink size={11} /></a></dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--text-muted)]">Source audit</dt><dd className="text-amber-400">Not inspected</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--text-muted)]">Version and license</dt><dd className="text-[var(--text-secondary)]">Not verified</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--text-muted)]">Configured executable</dt><dd className={isConfigured ? 'text-emerald-400' : 'text-[var(--text-muted)]'}>{isConfigured ? 'Path configured' : 'Not configured'}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-[var(--text-muted)]">Selected project asset</dt><dd className="max-w-[60%] truncate text-right text-[var(--text-secondary)]">{asset?.name || 'None'}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">{app.statusNotes}</p>
            {executionOutput && <div className="mt-5 border-t border-[var(--border-subtle)] pt-4"><h3 className="text-xs font-semibold text-[var(--text-primary)]">Launch result</h3><pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[var(--text-secondary)]">{executionOutput}</pre></div>}
          </section>

          <aside className="border-t border-[var(--border-subtle)] pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><Laptop size={15} /> Local companion</h2>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">{companionState.connected && companionState.tokenPaired ? 'The companion is paired. Only configured application paths and registered commands can be requested.' : companionState.connected ? 'The companion is reachable but has not been paired.' : 'The local companion is offline or blocked by browser network permissions.'}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">Configured application IDs: {companionState.availableApps.length ? companionState.availableApps.join(', ') : 'none'}</p>
            <button onClick={onOpenCompanionModal} className="mt-4 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">Connection and launch setup</button>
          </aside>
        </div>

        {!infrastructure && <div className="mt-8 flex items-start gap-3 border-t border-[var(--border-subtle)] pt-5 text-xs text-[var(--text-muted)]"><FileText size={15} className="mt-0.5 shrink-0" /><p>Opening a native app is only the first integration step. File operations and AI-controlled actions will remain disabled until an application-specific adapter is documented and tested.</p></div>}
      </div>
    </div>
  );
};
