import React, { useState } from 'react';
import { CompanionState } from '../../types';
import { companionService } from '../../services/companionService';
import { 
  Laptop, 
  ShieldCheck, 
  Terminal, 
  CheckCircle2, 
  X, 
  Key, 
  Radio, 
  AlertCircle 
} from 'lucide-react';

interface CompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companionState: CompanionState;
}

export const CompanionModal: React.FC<CompanionModalProps> = ({
  isOpen,
  onClose,
  companionState,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  if (!isOpen) return null;

  const handlePair = async () => {
    setIsPairing(true);
    setStatusMessage(null);
    try {
      const result = await companionService.pair(tokenInput);
      setStatusIsError(!result.success);
      setStatusMessage(result.message);
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = () => {
    companionService.disconnect();
    setStatusIsError(false);
    setStatusMessage('Disconnected from local companion.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Laptop size={16} className="text-[#B7A0FF]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Craft Local Companion Setup
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Security Principle Callout */}
          <div className="p-3.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Isolated Execution Boundary</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              The web workspace cannot execute arbitrary shell commands. All desktop invocations run through the authenticated Companion loopback daemon on <code className="font-mono text-[#B7A0FF]">127.0.0.1:9876</code> with allowlist validation.
            </p>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--text-primary)]">Connection State</span>
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                companionState.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {companionState.connected && companionState.tokenPaired ? 'CONNECTED & PAIRED' : companionState.connected ? 'CONNECTED · NOT PAIRED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-[var(--text-muted)]">
              <div className="p-2 rounded bg-[var(--bg-elevated)]">Port: 127.0.0.1:{companionState.port}</div>
              <div className="p-2 rounded bg-[var(--bg-elevated)]">Target OS: {companionState.os}</div>
            </div>
          </div>

          {/* Pairing Token Form */}
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
              Security Pairing Token
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter companion token..."
                className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]"
              />
              {companionState.connected ? (
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded bg-[var(--bg-elevated)] text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handlePair}
                  disabled={isPairing}
                  className="px-4 py-1.5 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium disabled:opacity-50"
                >
                  {isPairing ? 'Pairing...' : 'Verify & Pair'}
                </button>
              )}
            </div>
          </div>

          {statusMessage && (
            <div className={`p-2.5 rounded bg-[var(--bg-elevated)] border text-[11px] font-mono flex items-center gap-2 ${statusIsError ? 'border-rose-500/40 text-rose-400' : 'border-emerald-500/40 text-emerald-400'}`}>
              <CheckCircle2 size={13} />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--text-primary)]">Configured local applications ({companionState.availableApps.length})</h3>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">The companion can launch only applications whose absolute executable paths you configured on this machine. It does not edit files or run arbitrary shell commands.</p>
            {companionState.availableApps.length > 0 ? <div className="flex flex-wrap gap-2">{companionState.availableApps.map((appId) => <span key={appId} className="border border-[var(--border-subtle)] px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]">{appId}</span>)}</div> : <p className="text-[11px] text-amber-400">No executable paths configured. Set CRAFT_APP_PATHS_JSON and restart the companion.</p>}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--text-primary)]">Configured MCP editors ({companionState.availableMcpApps.length})</h3>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">MCP tools are discovered from the actual CLI at runtime. Add CLI executable paths through CRAFT_MCP_PATHS_JSON and restart the companion. No upstream editing tool is considered available until the CLI responds to MCP initialization and tools/list.</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Discovered tools: {companionState.registeredToolsCount}</p>
            {companionState.availableMcpApps.length > 0 ? <div className="flex flex-wrap gap-2">{companionState.availableMcpApps.map((appId) => <span key={appId} className="border border-[var(--border-subtle)] px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]">{appId}</span>)}</div> : <p className="text-[11px] text-amber-400">No MCP CLI paths configured.</p>}
          </div>

          {/* Allowlisted Binaries */}
          <div className="space-y-2">
            <span className="font-medium text-[var(--text-primary)]">
              Commands reported by companion ({companionState.allowlistedCommands.length})
            </span>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-[var(--text-secondary)]">
              {companionState.allowlistedCommands.map((cmd) => (
                <div key={cmd} className="p-1.5 rounded bg-[var(--bg-elevated)] truncate">
                  &gt; {cmd}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border-subtle)] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
