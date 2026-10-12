import React, { useMemo, useState } from 'react';
import { CraftApp, ProjectAsset } from '../../types';
import { CRAFT_APPS, APP_CATEGORIES } from '../../data/registry';
import { ExternalLink, Search, ArrowUpRight } from 'lucide-react';

interface AppLibraryProps {
  onOpenApp: (app: CraftApp, asset?: ProjectAsset) => void;
  onOpenCompanionModal: () => void;
  onLaunchApp: (app: CraftApp) => Promise<{ success: boolean; output: string }>;
}

const statusLabel = (app: CraftApp) => {
  switch (app.status) {
    case 'integrated_verified': return 'Integrated and verified';
    case 'smoke_test_passed': return 'Smoke test passed';
    case 'build_passed': return 'Build passed';
    case 'build_attempted': return 'Build attempted';
    case 'integration_in_progress': return 'Integration in progress';
    case 'blocked': return 'Blocked';
    case 'unsupported_in_environment': return 'Unsupported in current environment';
    case 'inspected': return 'Source inspected';
    default: return 'Not inspected';
  }
};

export const AppLibrary: React.FC<AppLibraryProps> = ({ onOpenApp, onOpenCompanionModal, onLaunchApp }) => {
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);
  const [launchResults, setLaunchResults] = useState<Record<string, { success: boolean; output: string }>>({});
  const launchApp = async (app: CraftApp) => {
    if (launchingAppId) return;
    setLaunchingAppId(app.id);
    setLaunchResults((prev) => { const next = { ...prev }; delete next[app.id]; return next; });
    try {
      const result = await onLaunchApp(app);
      setLaunchResults((prev) => ({ ...prev, [app.id]: result }));
    } catch (error) {
      setLaunchResults((prev) => ({ ...prev, [app.id]: { success: false, output: error instanceof Error ? error.message : 'The launch request failed.' } }));
    } finally {
      setLaunchingAppId(null);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredApps = useMemo(() => CRAFT_APPS.filter((app) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || app.name.toLowerCase().includes(query) ||
      app.tagline.toLowerCase().includes(query) || app.repoName.toLowerCase().includes(query);
    return matchesSearch && (selectedCategory === 'all' || app.category === selectedCategory);
  }), [searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="border-b border-[var(--border-subtle)] pb-6">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Ecosystem directory</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Applications and supporting repositories</h1>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Browse the 21 repository records. A catalog entry or workspace preview is not proof that an upstream application has been built or integrated.
          </p>
          <button onClick={onOpenCompanionModal} className="shrink-0 self-start border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">Configure local companion</button>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-4">
        <div className="relative max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search applications and repositories" aria-label="Search applications and repositories"
            className="w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-subtle)] pb-3">
          <button onClick={() => setSelectedCategory('all')} className={selectedCategory === 'all' ? 'shrink-0 border-b-2 border-[var(--accent)] px-2 py-2 text-xs text-[var(--text-primary)]' : 'shrink-0 border-b-2 border-transparent px-2 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]'}>
            All repositories ({CRAFT_APPS.length})
          </button>
          {APP_CATEGORIES.map((category) => (
            <button key={category.id} onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? 'shrink-0 border-b-2 border-[var(--accent)] px-2 py-2 text-xs text-[var(--text-primary)]' : 'shrink-0 border-b-2 border-transparent px-2 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]'}>
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 border-b border-[var(--border-subtle)]">
        {filteredApps.map((app) => {
          const infrastructure = app.category === 'platform_services' || app.category === 'developer_infra';
          return (
            <article key={app.id} className="grid grid-cols-1 gap-3 border-t border-[var(--border-subtle)] py-4 md:grid-cols-[minmax(0,1fr)_190px_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: app.color }} aria-hidden="true" />
                  <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">{app.name}</h2>
                </div>
                <p className="mt-1 pl-5 text-xs leading-relaxed text-[var(--text-secondary)]">{app.tagline}</p>
                <a href={app.repoUrl} target="_blank" rel="noreferrer" className="ml-5 mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  storytold/{app.repoName} <ExternalLink size={11} />
                </a>
              </div>
              <div className="pl-5 text-xs md:pl-0">
                <div className="text-[var(--text-secondary)]">{statusLabel(app)}</div>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">{app.version} · {app.license}</div>
              </div>
              <div className="flex items-center gap-3 pl-5 md:pl-0">
                {!infrastructure && <>
                  <button onClick={() => void launchApp(app)} disabled={launchingAppId !== null} className="inline-flex items-center gap-1.5 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-50">{launchingAppId === app.id ? 'Launching…' : 'Launch desktop app'}</button>
                  <button onClick={() => onOpenApp(app)} className="inline-flex items-center gap-1.5 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">Workspace preview <ArrowUpRight size={13} /></button>
                </>}
                <a href={app.repoUrl} target="_blank" rel="noreferrer" aria-label={'Open ' + app.name + ' source repository'} className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Source <ExternalLink size={12} /></a>
                {launchResults[app.id] && <p role="status" className={launchResults[app.id].success ? 'mt-2 text-[11px] text-[var(--text-secondary)] md:col-span-3' : 'mt-2 text-[11px] text-rose-400 md:col-span-3'}>{launchResults[app.id].output}</p>}
              </div>
            </article>
          );
        })}
        {filteredApps.length === 0 && <p className="py-10 text-center text-sm text-[var(--text-muted)]">No repositories match this search.</p>}
      </div>
    </div>
  );
};
