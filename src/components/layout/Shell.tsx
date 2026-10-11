import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  FolderGit2, 
  Boxes, 
  Cpu, 
  ShieldCheck, 
  Laptop, 
  SlidersHorizontal, 
  Search, 
  Sun, 
  Moon, 
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { Project, CraftApp, CompanionState, AIProviderConfig } from '../../types';

interface ShellProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeProject: Project;
  activeApp: CraftApp | null;
  companionState: CompanionState;
  aiConfig: AIProviderConfig;
  onOpenCommandPalette: () => void;
  onOpenCompanionModal: () => void;
  onSwitchAIMode: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentTab,
  setCurrentTab,
  activeProject,
  activeApp,
  companionState,
  aiConfig,
  onOpenCommandPalette,
  onOpenCompanionModal,
  onSwitchAIMode,
  theme,
  setTheme,
  children,
}) => {
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  const navItems = [
    { id: 'home', label: 'Workspace', icon: Compass },
    { id: 'projects', label: 'Projects & Assets', icon: FolderGit2 },
    { id: 'apps', label: 'App Library (21)', icon: Boxes },
    { id: 'editor', label: 'Active Editor', icon: activeApp ? Boxes : Compass, disabled: !activeApp },
    { id: 'ai', label: 'AI Workspace', icon: Cpu },
    { id: 'audit', label: 'Repository Audit', icon: ShieldCheck },
    { id: 'companion', label: 'Local Companion', icon: Laptop },
    { id: 'settings', label: 'Preferences', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-workspace)] text-[var(--text-primary)]">
      {/* Global Navigation Rail */}
      <aside 
        className={`flex flex-col shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-nav)] transition-all duration-200 z-30 ${
          railCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Brand Lockup */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-6 h-6 rounded bg-[#B7A0FF] flex items-center justify-center shrink-0 text-[#101114] font-bold text-xs tracking-tighter">
              C
            </div>
            {!railCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)] truncate">
                  Craft Workspace
                </span>
                <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-mono">
                  Storytold Suite
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setRailCollapsed(!railCollapsed)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            title={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label="Toggle navigation rail"
          >
            {railCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            if (item.disabled) return null;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-l-2 border-[#B7A0FF]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
                title={railCollapsed ? item.label : undefined}
              >
                <Icon size={16} className={`shrink-0 ${isActive ? 'text-[#B7A0FF]' : 'text-[var(--text-muted)]'}`} />
                {!railCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Status */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {!railCollapsed && (
            <div className="px-1 text-[11px] text-[var(--text-muted)] space-y-1">
              <div className="flex items-center justify-between">
                <span>Companion</span>
                <span className={`font-mono text-[10px] ${companionState.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {companionState.connected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Target</span>
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                  {aiConfig.mode === 'cloud' ? (aiConfig.activeCloudConnected ? 'Cloud connected' : 'Cloud unverified') : (aiConfig.activeLocalConnected ? 'Local connected' : 'Local unverified')}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {!railCollapsed && <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-4 z-20">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] min-w-0">
            <span className="text-[var(--text-primary)] font-medium truncate">
              {activeProject.name}
            </span>
            <span className="text-[var(--text-muted)]" aria-hidden="true">/</span>
            <span className="font-mono text-[11px] text-[#B7A0FF] truncate">
              {activeApp ? activeApp.name : 'Workspace Overview'}
            </span>
            {activeApp && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:inline">
                {activeApp.version === 'Unknown' ? 'version unverified' : `v${activeApp.version}`}
              </span>
            )}
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Universal Command Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-3 px-3 py-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
            >
              <Search size={13} />
              <span className="hidden md:inline">Universal Search & Commands</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
                Ctrl+K
              </kbd>
            </button>

            {/* AI Provider Mode Selector */}
            <button
              onClick={onSwitchAIMode}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-medium hover:border-[var(--border-hover)] transition-colors"
              title="Toggle between Cloud AI and Local Companion AI"
            >
              <Cpu size={13} className={aiConfig.mode === 'cloud' ? 'text-[#B7A0FF]' : 'text-emerald-400'} />
              <span className="hidden lg:inline text-[var(--text-secondary)]">
                {aiConfig.mode === 'cloud' ? 'Cloud AI (provider unverified)' : 'Local AI (Ollama-compatible)'}
              </span>
            </button>

            {/* Companion Integration Status Button */}
            <button
              onClick={onOpenCompanionModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors ${
                companionState.connected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Open Local Companion Setup & Pairing"
            >
              <Laptop size={13} />
              <span className="hidden md:inline font-mono text-[11px]">
                {companionState.connected ? 'Companion Paired' : 'Companion Bridge'}
              </span>
            </button>
          </div>
        </header>

        <div className="flex h-7 shrink-0 items-center border-b border-[var(--border-subtle)] px-4 text-[10px] text-[var(--text-muted)]">Workspace prototype · upstream application builds and integrations are not yet verified</div>
        {/* Viewport Content */}
        <main className="flex-1 overflow-auto bg-[var(--bg-workspace)]">
          {children}
        </main>
      </div>
    </div>
  );
};
