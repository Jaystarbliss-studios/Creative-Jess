import React, { useState } from 'react';
import { CRAFT_APPS } from '../../data/registry';
import { CraftApp, IntegrationStatus } from '../../types';
import { 
  ShieldCheck, 
  ExternalLink, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  X,
  FileCode,
  Layers,
  Cpu,
  Info
} from 'lucide-react';

export const RepositoryAuditView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<CraftApp | null>(null);

  const filteredApps = CRAFT_APPS.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.crates.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = CRAFT_APPS.filter((a) => a.status === 'integrated_verified').length;
  const smokeCount = CRAFT_APPS.filter((a) => a.status === 'smoke_test_passed').length;
  const buildPassedCount = CRAFT_APPS.filter((a) => a.status === 'build_passed').length;
  const blockedCount = CRAFT_APPS.filter((a) => a.status === 'blocked').length;

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'not_inspected': return { label: 'Not inspected', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25' };
      case 'build_attempted': return { label: 'Build attempted', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
      case 'build_passed': return { label: 'Build passed', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'integration_in_progress': return { label: 'Integration in progress', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' };
      case 'integrated_verified':
        return { label: 'Integrated & Verified', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'smoke_test_passed':
        return { label: 'Smoke Test Passed', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'inspected':
        return { label: 'Source Inspected', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
      case 'blocked':
        return { label: 'Blocked / Guarded', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
      case 'unsupported_in_environment':
        return { label: 'Unsupported in Container', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
      default:
        return { label: status, bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
        <div className="text-xs font-mono text-[#B7A0FF] tracking-wider uppercase">
          Technical Audit & Ecosystem Inventory
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Repository Health & Capability Matrix
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Comprehensive inventory of 21 Storytold ecosystem repositories. Tracks Windows CI builds, live MCP protocol discovery, acceptance test coverage, and security boundaries.
        </p>
      </div>

      {/* Environment Reality Banner */}
      <div className="p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <ShieldCheck size={14} className="text-[#B7A0FF]" />
            <span>AI Studio Cloud Sandbox & CI Verification Evidence</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Status claims reflect concrete CI execution results. No application is labeled integrated without real create/edit/save/export acceptance tests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
          <div>Verified: <span className="text-emerald-400 font-semibold">{verifiedCount}</span></div>
          <span>·</span>
          <div>Smoke Passed: <span className="text-sky-400 font-semibold">{smokeCount}</span></div>
          <span>·</span>
          <div>Build Passed: <span className="text-sky-300 font-semibold">{buildPassedCount}</span></div>
          <span>·</span>
          <div>Blocked: <span className="text-rose-400 font-semibold">{blockedCount}</span></div>
          <span>·</span>
          <div>Total: <span className="text-[var(--text-primary)] font-semibold">{CRAFT_APPS.length} Repos</span></div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by app, repo, or crate name..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'integrated_verified', 'smoke_test_passed', 'build_passed', 'blocked', 'not_inspected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#B7A0FF] text-[#101114] font-medium'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {status === 'all' ? `All (${CRAFT_APPS.length})` : status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Authoritative Audit Matrix Table */}
      <div className="border border-[var(--border-subtle)] rounded overflow-hidden bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-medium text-[var(--text-secondary)]">
                <th className="py-3 px-4">Application / Repository</th>
                <th className="py-3 px-4">Edition & License</th>
                <th className="py-3 px-4">Crates / Manifest</th>
                <th className="py-3 px-4">Execution Model</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/60 font-mono">
              {filteredApps.map((app) => {
                const badge = getStatusBadge(app.status);
                const isSelected = selectedApp?.id === app.id;
                return (
                  <tr 
                    key={app.id} 
                    onClick={() => setSelectedApp(app)}
                    className={`hover:bg-[var(--bg-elevated)]/50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[var(--bg-elevated)]/70' : ''
                    }`}
                  >
                    {/* Name & Tagline */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <span>{app.name}</span>
                        {app.isPilot && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#B7A0FF]/20 text-[#B7A0FF]">
                            PILOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] line-clamp-1 font-sans">
                        {app.tagline}
                      </div>
                    </td>

                    {/* Version & License */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="text-[var(--text-primary)]">{app.edition}</div>
                      <div className="text-[var(--text-muted)] truncate max-w-[150px]">{app.license}</div>
                    </td>

                    {/* Crates */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="text-[var(--text-primary)]">
                        {app.cratesCount > 0 ? `${app.cratesCount} Crates` : 'Data/Infra'}
                      </div>
                      <div className="text-[var(--text-muted)] truncate max-w-[150px]">
                        {app.crates.length > 0 ? app.crates.slice(0, 2).join(', ') : 'Root manifest'}
                      </div>
                    </td>

                    {/* Execution Model */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="flex flex-wrap gap-1">
                        {app.hasWasm && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300">
                            WASM
                          </span>
                        )}
                        {app.hasDesktop && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300">
                            Desktop
                          </span>
                        )}
                        {app.hasCli && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-500/20 text-slate-300">
                            CLI
                          </span>
                        )}
                        {app.hasMcp && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300">
                            MCP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="text-[#B7A0FF] hover:text-[#c8b6ff] text-xs font-sans px-2 py-1 rounded hover:bg-[#B7A0FF]/10 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Repository Inspection Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-2xl bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedApp.name}</h2>
                    {selectedApp.isPilot && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#B7A0FF]/20 text-[#B7A0FF]">
                        PILOT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedApp.tagline}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  aria-label="Close inspector"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status & Evidence */}
              <div className="p-4 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Verification Status</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(selectedApp.status).bg} ${getStatusBadge(selectedApp.status).text} ${getStatusBadge(selectedApp.status).border}`}>
                    {getStatusBadge(selectedApp.status).label}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans">
                  {selectedApp.statusNotes || selectedApp.description}
                </p>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-[var(--bg-workspace)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">Manifest Version</div>
                  <div className="font-semibold text-[var(--text-primary)]">{selectedApp.version}</div>
                </div>
                <div className="p-3 rounded bg-[var(--bg-workspace)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">Rust Edition</div>
                  <div className="font-semibold text-[var(--text-primary)]">{selectedApp.edition}</div>
                </div>
                <div className="p-3 rounded bg-[var(--bg-workspace)] border border-[var(--border-subtle)] space-y-1 col-span-2">
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">License Declaration</div>
                  <div className="font-medium text-[var(--text-primary)]">{selectedApp.license}</div>
                </div>
              </div>

              {/* Capabilities & Protocols */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Supported Interfaces</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded border flex items-center gap-2 ${selectedApp.hasDesktop ? 'bg-purple-500/10 border-purple-500/25 text-purple-200' : 'bg-[var(--bg-workspace)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                    <Cpu size={14} />
                    <span>Native Desktop (egui/eframe)</span>
                  </div>
                  <div className={`p-2.5 rounded border flex items-center gap-2 ${selectedApp.hasCli ? 'bg-slate-500/10 border-slate-500/25 text-slate-200' : 'bg-[var(--bg-workspace)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                    <Terminal size={14} />
                    <span>CLI Toolchain</span>
                  </div>
                  <div className={`p-2.5 rounded border flex items-center gap-2 ${selectedApp.hasMcp ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200' : 'bg-[var(--bg-workspace)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                    <CheckCircle2 size={14} />
                    <span>Model Context Protocol (MCP)</span>
                  </div>
                  <div className={`p-2.5 rounded border flex items-center gap-2 ${selectedApp.hasWasm ? 'bg-sky-500/10 border-sky-500/25 text-sky-200' : 'bg-[var(--bg-workspace)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                    <Layers size={14} />
                    <span>WebAssembly (WASM)</span>
                  </div>
                </div>
              </div>

              {/* Crates breakdown */}
              {selectedApp.crates.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Workspace Crates ({selectedApp.crates.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded bg-[var(--bg-workspace)] border border-[var(--border-subtle)] max-h-36 overflow-y-auto">
                    {selectedApp.crates.map((crate) => (
                      <span key={crate} className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {crate}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <a
                href={selectedApp.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:text-[#B7A0FF] transition-colors"
              >
                <span>View storytold/{selectedApp.repoName} on GitHub</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded bg-[#B7A0FF] text-[#101114] text-xs font-semibold hover:bg-[#c8b6ff] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
