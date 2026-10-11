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
              <Laptop size={14} className={companionState.connected && companionState.tokenPaired ? 'text-emerald-400' : 'text-amber-400'} />
              <span>Companion: {companionState.connected && companionState.tokenPaired ? 'Paired' : companionState.connected ? 'Reachable, not paired' : 'Offline'}</span>
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

        {/* Project assets — compact list, not a grid of cards */}
        <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
          {activeProject.assets.map((asset) => {
            const IconComponent = getAssetIcon(asset.type);
            const targetApp = CRAFT_APPS.find((item) => item.id === asset.compatibleAppId);
            return (
              <div key={asset.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <IconComponent size={16} className="shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs text-[var(--text-primary)]">{asset.name}</div>
                    <div className="mt-1 text-[10px] text-[var(--text-muted)]">{asset.extension} · {asset.dimensions || formatFileSize(asset.sizeBytes)}</div>
                  </div>
                </div>
                <div className="hidden truncate text-xs text-[var(--text-muted)] sm:block">{targetApp ? targetApp.name : asset.compatibleAppId}</div>
                <button onClick={() => { if (targetApp) onOpenApp(targetApp, asset); }} className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Preview <ArrowRight size={12} />
                </button>
              </div>
            );
          })}
          {activeProject.assets.length === 0 && <p className="py-6 text-xs text-[var(--text-muted)]">No assets in this project yet. Import a file or create one in a supported application.</p>}
        </div>
      </section>

      {/* 3. Creative application directory */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Creative application previews</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Preview shells only. Upstream applications have not yet been built or connected.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={() => setSelectedCategory('all')} className={selectedCategory === 'all' ? 'shrink-0 border-b-2 border-[var(--accent)] px-2 py-2 text-xs text-[var(--text-primary)]' : 'shrink-0 border-b-2 border-transparent px-2 py-2 text-xs text-[var(--text-muted)]'}>
              All tools
            </button>
            {APP_CATEGORIES.filter((category) => ['visual', 'video_audio', 'design_publishing', 'technical_data'].includes(category.id)).map((category) => (
              <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={selectedCategory === category.id ? 'shrink-0 border-b-2 border-[var(--accent)] px-2 py-2 text-xs text-[var(--text-primary)]' : 'shrink-0 border-b-2 border-transparent px-2 py-2 text-xs text-[var(--text-muted)]'}>
                {category.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
          {filteredApps.filter((item) => ['visual', 'video_audio', 'design_publishing', 'technical_data'].includes(item.category)).map((app) => (
            <div key={app.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: app.color }} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--text-primary)]">{app.name}</div>
                  <div className="mt-1 truncate text-xs text-[var(--text-muted)]">{app.tagline}</div>
                </div>
              </div>
              <span className="hidden text-xs text-amber-400 sm:block">Not inspected</span>
              <button onClick={() => onOpenApp(app)} className="inline-flex items-center gap-1.5 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">
                Open preview <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      
      {/* 4. Infrastructure & Architecture Status Strip */}
      <section className="border-t border-[var(--border-subtle)] pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>{CRAFT_APPS.length} repository records</span>
            <span aria-hidden="true">·</span>
            <span>{CRAFT_APPS.filter((item) => item.status === 'inspected').length} source inspections recorded</span>
            <span aria-hidden="true">·</span>
            <span>{CRAFT_APPS.filter((item) => item.status === 'integrated_verified').length} integrations verified</span>
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
