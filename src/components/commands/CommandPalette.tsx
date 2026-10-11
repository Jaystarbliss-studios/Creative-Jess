import React, { useState, useEffect, useRef } from 'react';
import { CraftApp, Project, ProjectAsset } from '../../types';
import { CRAFT_APPS } from '../../data/registry';
import { 
  Search, 
  Boxes, 
  FolderGit2, 
  FileText, 
  SlidersHorizontal, 
  ShieldCheck, 
  Laptop, 
  Sun, 
  Moon, 
  ArrowRight,
  Cpu
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenApp: (app: CraftApp, asset?: ProjectAsset) => void;
  onNavigateTab: (tab: string) => void;
  onToggleTheme: () => void;
  onOpenCompanion: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  projects,
  onSelectProject,
  onOpenApp,
  onNavigateTab,
  onToggleTheme,
  onOpenCompanion,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Gather searchable items
  const appItems = CRAFT_APPS.map((app) => ({
    id: `app-${app.id}`,
    category: 'Applications',
    title: `Open ${app.name}`,
    subtitle: app.tagline,
    icon: Boxes,
    action: () => {
      onOpenApp(app);
      onClose();
    },
  }));

  const projectItems = projects.map((p) => ({
    id: `proj-${p.id}`,
    category: 'Projects',
    title: `Switch to ${p.name}`,
    subtitle: `${p.assets.length} assets · ${p.description}`,
    icon: FolderGit2,
    action: () => {
      onSelectProject(p);
      onClose();
    },
  }));

  const actionItems = [
    {
      id: 'action-audit',
      category: 'System Diagnostics',
      title: 'View Repository Audit & Verification Matrix',
      subtitle: '21 repositories, crates, build status, and licenses',
      icon: ShieldCheck,
      action: () => {
        onNavigateTab('audit');
        onClose();
      },
    },
    {
      id: 'action-companion',
      category: 'System Diagnostics',
      title: 'Configure Local Companion (Loopback :9876)',
      subtitle: 'Pair Windows background service for native execution',
      icon: Laptop,
      action: () => {
        onOpenCompanion();
        onClose();
      },
    },
    {
      id: 'action-ai',
      category: 'Intelligent Assistance',
      title: 'Open AI Workspace & Tool Dispatcher',
      subtitle: 'Coordinate multi-application operations and queries',
      icon: Cpu,
      action: () => {
        onNavigateTab('ai');
        onClose();
      },
    },
    {
      id: 'action-theme',
      category: 'Preferences',
      title: 'Toggle Dark / Light Theme Tokens',
      subtitle: 'Switch workspace design tokens',
      icon: Sun,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
  ];

  const allItems = [...actionItems, ...projectItems, ...appItems];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.min(filteredItems.length - 1, idx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-2xl overflow-hidden flex flex-col text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Field */}
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center gap-2.5">
          <Search size={15} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, application name, or project..."
            className="flex-1 bg-transparent text-[var(--text-primary)] outline-none text-xs placeholder-[var(--text-muted)]"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No matching commands or applications found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[#B7A0FF]/15 text-[#B7A0FF]' 
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={14} className={`shrink-0 ${isSelected ? 'text-[#B7A0FF]' : 'text-[var(--text-muted)]'}`} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
          <span>Use ↑↓ to navigate</span>
          <span>↵ to execute</span>
        </div>
      </div>
    </div>
  );
};
