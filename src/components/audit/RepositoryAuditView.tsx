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
  Filter
} from 'lucide-react';

export const RepositoryAuditView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApps = CRAFT_APPS.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.crates.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'integrated_verified':
        return { label: 'Integrated & Verified', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'smoke_test_passed':
        return { label: 'Smoke Test Passed', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'inspected':
        return { label: 'Source Inspected', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
      case 'blocked':
        return { label: 'Blocked', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
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
          Authoritative technical audit across all 21 Storytold ecosystem repositories. Confirms language editions, crate manifests, licensing constraints, CLI/MCP interfaces, and runtime environments.
        </p>
      </div>

      {/* Environment Reality Banner */}
      <div className="p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <ShieldCheck size={14} className="text-[#B7A0FF]" />
            <span>AI Studio Cloud Sandbox Environment Constraints</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Linux container has Node.js/TypeScript and HTML5 WebAssembly capability. Native Rust compiler (rustc 1.95) and Windows desktop binaries require the Craft Local Companion on Windows.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
          <div>Repositories: <span className="text-[var(--text-primary)] font-semibold">21 / 21 Inspected</span></div>
          <span>·</span>
          <div>Licenses: <span className="text-[var(--text-primary)] font-semibold">MIT / Apache 2.0</span></div>
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
          {['all', 'integrated_verified', 'smoke_test_passed', 'inspected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#B7A0FF] text-[#101114] font-medium'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {status === 'all' ? 'All (21)' : status.replace('_', ' ')}
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
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/60 font-mono">
              {filteredApps.map((app) => {
                const badge = getStatusBadge(app.status);
                return (
                  <tr key={app.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
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
                      <div className="text-[var(--text-muted)]">{app.license}</div>
                    </td>

                    {/* Crates */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="text-[var(--text-primary)]">
                        {app.cratesCount > 0 ? `${app.cratesCount} Crates` : 'Data/Infra Module'}
                      </div>
                      <div className="text-[var(--text-muted)] truncate max-w-[180px]">
                        {app.crates.slice(0, 3).join(', ')}{app.crates.length > 3 ? '...' : ''}
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

                    {/* GitHub Link */}
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={app.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#B7A0FF] hover:text-[#c8b6ff] text-xs font-sans transition-colors"
                      >
                        <span>GitHub</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
