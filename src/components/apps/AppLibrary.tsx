import React, { useState } from 'react';
import { CraftApp, ProjectAsset } from '../../types';
import { CRAFT_APPS, APP_CATEGORIES } from '../../data/registry';
import { 
  Play, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Search, 
  Layers, 
  X,
  Radio,
  FileCode,
  Info
} from 'lucide-react';

interface AppLibraryProps {
  onOpenApp: (app: CraftApp, asset?: ProjectAsset) => void;
  onOpenCompanionModal: () => void;
}

export const AppLibrary: React.FC<AppLibraryProps> = ({
  onOpenApp,
  onOpenCompanionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectApp, setInspectApp] = useState<CraftApp | null>(null);

  const filteredApps = CRAFT_APPS.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.crates.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-[var(--border-subtle)] pb-6">
        <div className="text-xs font-mono text-[#B7A0FF] tracking-wider uppercase">
          Ecosystem Directory
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Application & Service Library (21 Repositories)
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Every tool across the Storytold ecosystem, organized by creative discipline and runtime capabilities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by application or discipline..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)]">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Disciplines ({CRAFT_APPS.length})
          </button>
          {APP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="p-5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {app.name}
                  </h3>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    v{app.version} · {app.edition}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {app.isPilot && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#B7A0FF]/20 text-[#B7A0FF]">
                      Pilot
                    </span>
                  )}
                  {app.hasMcp && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                      MCP
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {app.tagline}
              </p>

              {/* Supported formats */}
              {app.supportedFormats.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {app.supportedFormats.map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <button
                onClick={() => setInspectApp(app)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
              >
                <Info size={13} />
                <span>Details ({app.cratesCount} Crates)</span>
              </button>

              <button
                onClick={() => onOpenApp(app)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#B7A0FF] text-[#101114] text-xs font-semibold hover:bg-[#c8b6ff] transition-colors"
              >
                <Play size={11} />
                <span>Open Studio</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Inspection Drawer / Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-2xl overflow-hidden flex flex-col text-xs">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {inspectApp.name} Technical Manifest
                </h2>
                <div className="font-mono text-[11px] text-[var(--text-muted)]">
                  {inspectApp.repoUrl}
                </div>
              </div>
              <button
                onClick={() => setInspectApp(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Overview</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {inspectApp.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-[var(--bg-elevated)]">
                  <span className="text-[var(--text-muted)]">Language Edition:</span>
                  <div className="text-[var(--text-primary)] mt-0.5">{inspectApp.edition}</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--bg-elevated)]">
                  <span className="text-[var(--text-muted)]">License:</span>
                  <div className="text-[var(--text-primary)] mt-0.5">{inspectApp.license}</div>
                </div>
              </div>

              {inspectApp.crates.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    Cargo Crates ({inspectApp.cratesCount} total)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectApp.crates.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] font-mono text-[11px] text-[var(--text-secondary)]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectApp.cliCommand && (
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">CLI Automation</h3>
                  <div className="p-2.5 rounded bg-[var(--bg-elevated)] font-mono text-[11px] text-[#B7A0FF]">
                    {inspectApp.cliCommand}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex justify-between items-center">
              <a
                href={inspectApp.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                <span>View on GitHub</span>
                <ExternalLink size={12} />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => setInspectApp(null)}
                  className="px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const target = inspectApp;
                    setInspectApp(null);
                    onOpenApp(target);
                  }}
                  className="px-4 py-1.5 rounded bg-[#B7A0FF] text-[#101114] font-semibold"
                >
                  Open Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
