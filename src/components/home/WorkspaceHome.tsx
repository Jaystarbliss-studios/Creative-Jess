import React, { useState } from 'react';
import { 
  Project, 
  CraftApp, 
  CompanionState, 
  AIProviderConfig,
  ProjectAsset 
} from '../../types';
import { 
  CRAFT_APPS, 
  APP_CATEGORIES 
} from '../../data/registry';
import { 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Layers, 
  Terminal, 
  ExternalLink,
  Laptop,
  Cpu,
  Plus,
  Play
} from 'lucide-react';

interface WorkspaceHomeProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (p: Project) => void;
  onOpenApp: (app: CraftApp, asset?: ProjectAsset) => void;
  onNavigateTab: (tab: string) => void;
  companionState: CompanionState;
  aiConfig: AIProviderConfig;
  onOpenCompanionModal: () => void;
}

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenApp,
  onNavigateTab,
  companionState,
  aiConfig,
  onOpenCompanionModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [projectFilterQuery, setProjectFilterQuery] = useState('');

  const filteredApps = selectedCategory === 'all' 
    ? CRAFT_APPS.filter(a => a.category !== 'developer_infra') 
    : CRAFT_APPS.filter(a => a.category === selectedCategory);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'raster_image': return ImageIcon;
      case 'vector_graphic': return Layers;
      case 'video_clip': return Video;
      case 'audio_track': return Music;
      default: return FileText;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
      {/* 1. Restrained Editorial Welcome Header */}
      <section className="border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-[var(--text-muted)] tracking-wider uppercase">
              Creative workspace · integration preview
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Craft Workspace
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              A single workspace for the Storytold Craft ecosystem. Upstream builds and application integrations are still being audited.
            </p>
          </div>

          {/* Quick System Connection Indicator */}
          <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] p-3 rounded border border-[var(--border-subtle)] shrink-0">
            <div className="flex items-center gap-2">
              <Laptop size={14} className={companionState.connected ? 'text-emerald-400' : 'text-amber-400'} />
              <span>Companion: {companionState.connected ? '127.0.0.1:9876' : 'Offline'}</span>
            </div>
            <span className="text-[var(--border-subtle)]">|</span>
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-[#B7A0FF]" />
              <span>AI: {aiConfig.mode === 'cloud' ? (aiConfig.activeCloudConnected ? 'Cloud connected' : 'Cloud unverified') : (aiConfig.activeLocalConnected ? 'Local connected' : 'Local unverified')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Active Project Context & Recent Files */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Active Project: {activeProject.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {activeProject.description}
            </p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">Project and asset entries are illustrative sample metadata unless you created or imported them in this session.</p>
          </div>
          <button
            onClick={() => onNavigateTab('projects')}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[#B7A0FF] transition-colors"
          >
            <span>Switch Project ({projects.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Project Asset Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeProject.assets.map((asset) => {
            const IconComponent = getAssetIcon(asset.type);
            const targetApp = CRAFT_APPS.find(a => a.id === asset.compatibleAppId);
            return (
              <div 
                key={asset.id}
                className="group p-3.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 text-[#B7A0FF]">
                      <IconComponent size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate font-mono">
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {asset.dimensions || formatFileSize(asset.sizeBytes)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">
                    {asset.extension}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--text-muted)] truncate">
                    Target: {targetApp ? targetApp.name : asset.compatibleAppId}
                  </span>
                  <button
                    onClick={() => {
                      if (targetApp) onOpenApp(targetApp, asset);
                    }}
                    className="flex items-center gap-1 text-[#B7A0FF] hover:text-[#c8b6ff] font-medium text-xs transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Creative Discipline Application Launcher */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Creative application previews
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Open a workspace preview or inspect its source. Previews are not the upstream applications.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Tools ({CRAFT_APPS.filter(a => a.category !== 'developer_infra').length})
            </button>
            {APP_CATEGORIES.filter(c => c.id !== 'developer_infra').map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {app.name}
                    </h3>
                    <div className="text-[11px] font-mono text-[var(--text-muted)]">
                      v{app.version} · {app.cratesCount} Crates
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {app.isPilot && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#B7A0FF]/15 text-[#B7A0FF] border border-[#B7A0FF]/30">
                        Pilot Editor
                      </span>
                    )}
                    {app.hasMcp && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        MCP
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {app.tagline}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {app.supportedFormats.slice(0, 4).map((fmt) => (
                    <span 
                      key={fmt}
                      className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded"
                    >
                      {fmt}
                    </span>
                  ))}
                  {app.supportedFormats.length > 4 && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)] px-1">
                      +{app.supportedFormats.length - 4}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] truncate">
                  {app.hasWasm ? 'In-Browser Canvas' : 'Companion Bridge'}
                </span>
                <button
                  onClick={() => onOpenApp(app)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[#B7A0FF] text-[var(--text-primary)] hover:text-[#101114] text-xs font-medium transition-colors"
                >
                  <Play size={11} />
                  <span>Open</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Infrastructure & Architecture Status Strip */}
      <section className="border-t border-[var(--border-subtle)] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>21 Repositories Inspected</span>
            <span aria-hidden="true">·</span>
            <span>Edition 2024 (Rust 1.95) & TypeScript</span>
            <span aria-hidden="true">·</span>
            <span>MIT OR Apache-2.0</span>
          </div>
          <button
            onClick={() => onNavigateTab('audit')}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[#B7A0FF] transition-colors"
          >
            <span>View Technical Audit & Verification Report</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </section>
    </div>
  );
};
