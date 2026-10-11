import React, { useRef, useState } from 'react';
import { Project, ProjectAsset, CraftApp, AssetType } from '../../types';
import { CRAFT_APPS } from '../../data/registry';
import { storeAssetFile, getAssetFile } from '../../services/assetStorage';
import {
  Plus,
  FileText,
  Image as ImageIcon,
  Layers,
  Video,
  Music,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';

interface LocalWritableFile {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface LocalFileHandle {
  createWritable(): Promise<LocalWritableFile>;
}
interface LocalDirectoryHandle {
  getDirectoryHandle(name: string, options: { create: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
}
interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: () => Promise<LocalDirectoryHandle>;
}

function safeFolderSegment(value: string): string {
  const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/[. ]+$/g, '').slice(0, 100);
  if (!cleaned || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(cleaned)) return 'CraftProject';
  return cleaned;
}

interface ProjectBrowserProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, description: string) => void;
  onAddAsset: (projectId: string, asset: ProjectAsset) => void;
  onOpenApp: (app: CraftApp, asset?: ProjectAsset) => void;
}

function getAssetDetails(file: File): { type: AssetType; appId: string } {
  const extension = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';
  if (extension === '.svg') return { type: 'vector_graphic', appId: 'vectorcraft' };
  if (file.type.startsWith('image/')) return { type: 'raster_image', appId: 'photocraft' };
  if (file.type.startsWith('video/')) return { type: 'video_clip', appId: 'filmcraft' };
  if (file.type.startsWith('audio/')) return { type: 'audio_track', appId: 'soundcraft' };
  if (extension === '.pdf') return { type: 'pdf', appId: 'pdfcraft' };
  if (['.doc', '.docx', '.rtf', '.txt', '.odt'].includes(extension)) return { type: 'document', appId: 'wordcraft' };
  if (['.ppt', '.pptx', '.odp', '.key'].includes(extension)) return { type: 'presentation', appId: 'deckcraft' };
  if (['.xls', '.xlsx', '.csv', '.ods'].includes(extension)) return { type: 'spreadsheet', appId: 'gridcraft' };
  if (['.dxf', '.dwg', '.step', '.stp', '.iges', '.igs'].includes(extension)) return { type: 'cad_drawing', appId: 'cadcraft' };
  if (['.ttf', '.otf', '.woff', '.woff2'].includes(extension)) return { type: 'font', appId: 'craft-fonts' };
  return { type: 'document', appId: 'wordcraft' };
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
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
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

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim());
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreating(false);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsImporting(true);
    setImportStatus(null);
    const id = 'asset-' + crypto.randomUUID();
    const extension = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';
    const details = getAssetDetails(file);
    const asset: ProjectAsset = {
      id,
      name: file.name,
      type: details.type,
      extension,
      sizeBytes: file.size,
      updatedAt: new Date().toISOString(),
      compatibleAppId: details.appId,
      metadata: { mimeType: file.type || 'unknown', lastModified: file.lastModified },
      contentStoredLocally: true,
    };
    try {
      await storeAssetFile(id, file);
      onAddAsset(activeProject.id, asset);
      setImportStatus({ success: true, message: 'Imported ' + file.name + ' into this browser profile. Suggested application: ' + details.appId + '. Compatibility has not been verified.' });
    } catch (error) {
      setImportStatus({ success: false, message: 'File was not added because browser storage failed. ' + (error instanceof Error ? error.message : 'Unknown storage error') });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportProjectToFolder = async () => {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (!picker) {
      setImportStatus({ success: false, message: 'This browser does not support folder export. Use a current desktop version of Chrome or Edge, or download each file individually.' });
      return;
    }
    setIsExporting(true);
    setImportStatus(null);
    try {
      const chosenRoot = await picker.call(window);
      const folderName = safeFolderSegment(activeProject.name) + '-' + new Date().toISOString().replace(/[:.]/g, '-');
      const projectFolder = await chosenRoot.getDirectoryHandle(folderName, { create: true });
      let exported = 0;
      let missing = 0;
      for (const asset of activeProject.assets) {
        if (!asset.contentStoredLocally) { missing++; continue; }
        const stored = await getAssetFile(asset.id);
        if (!stored) { missing++; continue; }
        const fileName = safeFolderSegment(stored.name);
        const fileHandle = await projectFolder.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(stored.blob);
        await writable.close();
        exported++;
      }
      if (exported === 0) {
        setImportStatus({ success: false, message: 'No imported file bytes were found to export. Import real files into this project first.' });
      } else {
        setImportStatus({ success: true, message: 'Exported ' + exported + ' file(s) to the selected folder under ' + folderName + (missing ? '; skipped ' + missing + ' sample or unavailable file record(s).' : '.') + ' If you selected the configured CraftProjects folder, the exported files are available to the scoped MCP tools.' });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setImportStatus({ success: false, message: 'Folder selection was cancelled. No files were exported.' });
      } else {
        setImportStatus({ success: false, message: 'Could not export project files. ' + (error instanceof Error ? error.message : 'Unknown folder access error.') });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async (asset: ProjectAsset) => {
    setImportStatus(null);
    try {
      const stored = await getAssetFile(asset.id);
      if (!stored) throw new Error('The file bytes are not present in this browser profile. Re-import the original file.');
      const url = URL.createObjectURL(stored.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = stored.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setImportStatus({ success: true, message: 'Download started for ' + stored.name + '.' });
    } catch (error) {
      setImportStatus({ success: false, message: error instanceof Error ? error.message : 'Could not download this asset.' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Local project library</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Projects and assets</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">Project metadata is saved in this browser. Imported file bytes are stored in IndexedDB when available; suggested application compatibility is not a guarantee that the upstream editor is integrated.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="inline-flex shrink-0 items-center gap-2 border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">
          <Plus size={14} /> New project
        </button>
      </header>

      {importStatus && (
        <div className={importStatus.success ? 'flex items-start gap-2 border-l-2 border-emerald-500 pl-3 py-2 text-xs text-[var(--text-secondary)]' : 'flex items-start gap-2 border-l-2 border-rose-500 pl-3 py-2 text-xs text-[var(--text-secondary)]'} role="status">
          {importStatus.success ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" /> : <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {isCreating && (
        <section className="max-w-xl border border-[var(--border-subtle)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Create project</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Project name</label>
              <input type="text" required value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="e.g. Exhibition identity system" className="w-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Description</label>
              <input type="text" value={newProjectDesc} onChange={(event) => setNewProjectDesc(event.target.value)} placeholder="A short description of this project" className="w-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
              <button type="submit" className="border border-[var(--accent)] px-3 py-2 text-xs text-[var(--text-primary)]">Create project</button>
            </div>
          </form>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Projects <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">{projects.length}</span></h2>
          <span className="text-[10px] text-[var(--text-muted)]">Select a project to view its files</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
          {projects.map((project) => {
            const active = project.id === activeProject.id;
            return (
              <button key={project.id} onClick={() => onSelectProject(project)} className={active ? 'flex w-full items-center justify-between gap-4 border-l-2 border-[var(--accent)] bg-[var(--bg-surface)] px-3 py-4 text-left' : 'flex w-full items-center justify-between gap-4 border-l-2 border-transparent px-3 py-4 text-left hover:bg-[var(--bg-surface)]'}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--text-primary)]">{project.name}</div>
                  <div className="mt-1 truncate text-xs text-[var(--text-muted)]">{project.description || 'No description'}</div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-[11px] text-[var(--text-muted)]">
                  <span>{project.assets.length} assets</span>
                  <span className="hidden sm:inline">{new Date(project.updatedAt).toLocaleDateString()}</span>
                  {active && <span className="text-[var(--accent)]">Active</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Files in {activeProject.name}</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{activeProject.assets.length} asset records · sample entries are illustrative until you import real files</p>
          </div>
          <div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileImport} aria-label="Choose a file to import" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void handleExportProjectToFolder()} disabled={isExporting || isImporting || activeProject.assets.length === 0} className="inline-flex items-center gap-2 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-50">
                <FolderOpen size={13} /> {isExporting ? 'Exporting…' : 'Export to folder'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting || isExporting} className="inline-flex items-center gap-2 border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-50">
                <Upload size={13} /> {isImporting ? 'Importing…' : 'Import file'}
              </button>
            </div>
          </div>
        </div>
        <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
          {activeProject.assets.map((asset) => {
            const Icon = getAssetIcon(asset.type);
            const targetApp = CRAFT_APPS.find((item) => item.id === asset.compatibleAppId);
            return (
              <div key={asset.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <Icon size={16} className="shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs text-[var(--text-primary)]">{asset.name}</div>
                    <div className="mt-1 truncate text-[10px] text-[var(--text-muted)]">{asset.extension} · {formatFileSize(asset.sizeBytes)}{asset.contentStoredLocally ? ' · stored in this browser' : ' · metadata only / sample'}</div>
                  </div>
                </div>
                <div className="hidden truncate text-xs text-[var(--text-muted)] sm:block">{targetApp ? targetApp.name + ' (suggested)' : asset.compatibleAppId}</div>
                <div className="flex items-center justify-end gap-3">
                  {asset.contentStoredLocally && <button onClick={() => void handleDownload(asset)} aria-label={'Download ' + asset.name} title="Download original file" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Download size={14} /></button>}
                  {targetApp && <button onClick={() => onOpenApp(targetApp, asset)} className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Preview <ExternalLink size={12} /></button>}
                </div>
              </div>
            );
          })}
          {activeProject.assets.length === 0 && <p className="py-8 text-xs text-[var(--text-muted)]">No files in this project. Import a file to begin building its asset library.</p>}
        </div>
      </section>
    </div>
  );
};
