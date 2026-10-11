import React, { useState } from 'react';
import { Project, ProjectAsset, CraftApp } from '../../types';
import { CRAFT_APPS } from '../../data/registry';
import { 
  FolderGit2, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Video, 
  Music, 
  Upload, 
  Trash2, 
  Play, 
  Check, 
  Clock 
} from 'lucide-react';

interface ProjectBrowserProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (p: Project) => void;
  onCreateProject: (name: string, description: string) => void;
  onAddAsset: (projectId: string, asset: ProjectAsset) => void;
  onOpenApp: (app: CraftApp, asset?: ProjectAsset) => void;
}

export const ProjectBrowser: React.FC<ProjectBrowserProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onAddAsset,
  onOpenApp,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim());
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreating(false);
  };

  const handleSimulateFileUpload = () => {
    const newAsset: ProjectAsset = {
      id: `asset-${Date.now()}`,
      name: `imported-asset-${Date.now().toString().slice(-4)}.photo`,
      type: 'raster_image',
      extension: '.photo',
      sizeBytes: 1540000,
      updatedAt: new Date().toISOString(),
      compatibleAppId: 'photocraft',
      dimensions: '2560 × 1440 px',
    };
    onAddAsset(activeProject.id, newAsset);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#B7A0FF] tracking-wider uppercase">
            Workspace Storage
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Projects & Multi-Disciplinary Assets
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Cross-media project manifests organizing work across raster, vector, video, audio, CAD, and document editors.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#B7A0FF] text-[#101114] font-medium text-xs hover:bg-[#c8b6ff] transition-colors shrink-0"
        >
          <Plus size={14} />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Modal / Dialog */}
      {isCreating && (
        <div className="p-5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 max-w-lg">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Create Creative Project</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Project Name</label>
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Solaris Exhibition Brand Book"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief summary of creative deliverables..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#B7A0FF] text-[#101114] font-medium text-xs hover:bg-[#c8b6ff]"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Horizontal Selector */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          Projects ({projects.length})
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projects.map((p) => {
            const isActive = p.id === activeProject.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`p-4 rounded border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[var(--bg-surface)] border-[#B7A0FF] shadow-lg ring-1 ring-[#B7A0FF]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] line-clamp-2">
                      {p.description}
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#B7A0FF]/20 text-[#B7A0FF] shrink-0">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                  <span>{p.assets.length} assets</span>
                  <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assets Table for Active Project */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Project Assets: {activeProject.name} ({activeProject.assets.length})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              All files are preserved in their native application formats.
            </p>
          </div>

          <button
            onClick={handleSimulateFileUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#B7A0FF] text-xs font-medium transition-colors"
          >
            <Upload size={13} />
            <span>Import Asset</span>
          </button>
        </div>

        {/* Asset Table */}
        <div className="border border-[var(--border-subtle)] rounded overflow-hidden bg-[var(--bg-surface)]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-medium text-[var(--text-secondary)]">
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Dimensions / Specs</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4">Target Application</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/60 font-mono">
              {activeProject.assets.map((asset) => {
                const Icon = getAssetIcon(asset.type);
                const targetApp = CRAFT_APPS.find((a) => a.id === asset.compatibleAppId);
                return (
                  <tr key={asset.id} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-[#B7A0FF]" />
                        <span className="font-mono text-xs">{asset.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[var(--text-secondary)] capitalize font-sans">
                      {asset.type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[var(--text-muted)]">
                      {asset.dimensions || '—'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[var(--text-muted)]">
                      {formatFileSize(asset.sizeBytes)}
                    </td>
                    <td className="py-3 px-4 text-[11px] font-sans">
                      {targetApp ? (
                        <span className="text-[#B7A0FF] font-medium">{targetApp.name}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">{asset.compatibleAppId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {targetApp && (
                        <button
                          onClick={() => onOpenApp(targetApp, asset)}
                          className="px-2.5 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[#B7A0FF] text-[var(--text-primary)] hover:text-[#101114] text-xs font-sans font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <Play size={11} />
                          <span>Open</span>
                        </button>
                      )}
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
