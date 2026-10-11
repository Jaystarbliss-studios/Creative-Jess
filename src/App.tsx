import React, { useState, useEffect } from 'react';
import { Project, ProjectAsset, CraftApp, CompanionState, AIProviderConfig } from './types';
import { INITIAL_PROJECTS } from './data/initialProjects';
import { CRAFT_APPS } from './data/registry';
import { companionService } from './services/companionService';
import { aiService } from './services/aiService';

// Layout and Core Views
import { Shell } from './components/layout/Shell';
import { WorkspaceHome } from './components/home/WorkspaceHome';
import { ProjectBrowser } from './components/projects/ProjectBrowser';
import { AppLibrary } from './components/apps/AppLibrary';
import { AIWorkspace } from './components/ai/AIWorkspace';
import { RepositoryAuditView } from './components/audit/RepositoryAuditView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { CommandPalette } from './components/commands/CommandPalette';
import { CompanionModal } from './components/companion/CompanionModal';

// Specialized Editor Workspaces
import { PhotoCraftWorkspace } from './components/workspaces/PhotoCraftWorkspace';
import { VectorCraftWorkspace } from './components/workspaces/VectorCraftWorkspace';
import { FilmCraftWorkspace } from './components/workspaces/FilmCraftWorkspace';
import { WordCraftWorkspace } from './components/workspaces/WordCraftWorkspace';
import { CadCraftWorkspace } from './components/workspaces/CadCraftWorkspace';
import { GridCraftWorkspace } from './components/workspaces/GridCraftWorkspace';
import { GenericCraftWorkspace } from './components/workspaces/GenericCraftWorkspace';

export default function App() {
  const [appName, setAppName] = useState(() => {
    try { return window.localStorage.getItem('craft-workspace:name') || 'Craft Workspace'; } catch { return 'Craft Workspace'; }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return window.localStorage.getItem('craft-workspace:theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = window.localStorage.getItem('craft-workspace:projects');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed as Project[];
    } catch {
      // Recover to the built-in sample workspace if local data is unreadable.
    }
    return INITIAL_PROJECTS;
  });
  const [activeProject, setActiveProject] = useState<Project>(() => {
    try {
      const savedProjects = window.localStorage.getItem('craft-workspace:projects');
      const parsed = savedProjects ? JSON.parse(savedProjects) : INITIAL_PROJECTS;
      const activeId = window.localStorage.getItem('craft-workspace:active-project');
      if (Array.isArray(parsed) && parsed.length > 0) {
        const match = parsed.find((project: Project) => project.id === activeId);
        if (match) return match as Project;
      }
    } catch {
      // Recover to the first sample project when persisted state cannot be read.
    }
    return INITIAL_PROJECTS[0];
  });

  // Active editor state
  const [activeApp, setActiveApp] = useState<CraftApp | null>(null);
  const [activeAsset, setActiveAsset] = useState<ProjectAsset | null>(null);

  // Companion & AI State
  const [companionState, setCompanionState] = useState<CompanionState>(companionService.getState());
  const [aiConfig, setAIConfig] = useState<AIProviderConfig>(aiService.getConfig());

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);

  // Sync theme to root class
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem('craft-workspace:name', appName); } catch { /* Keep the current-session name. */ }
  }, [appName]);

  // Persist workspace metadata locally. Browser storage may be unavailable or full; editing remains usable in memory.
  useEffect(() => {
    try { window.localStorage.setItem('craft-workspace:projects', JSON.stringify(projects)); } catch (error) {
      console.warn('Craft Workspace could not persist project metadata to browser storage.', error);
    }
  }, [projects]);

  useEffect(() => {
    try {
      window.localStorage.setItem('craft-workspace:active-project', activeProject.id);
      window.localStorage.setItem('craft-workspace:theme', theme);
    } catch {
      // Keep current-session preferences if browser storage is unavailable.
    }
  }, [activeProject.id, theme]);

  // Subscribe to companion service updates
  useEffect(() => {
    const unsub = companionService.subscribe((state) => {
      setCompanionState(state);
    });
    return unsub;
  }, []);

  // Subscribe to AI service updates
  useEffect(() => {
    const unsub = aiService.subscribe((cfg) => {
      setAIConfig(cfg);
    });
    return unsub;
  }, []);

  // Open an application in the active editor
  const handleOpenApp = (app: CraftApp, asset?: ProjectAsset) => {
    setActiveApp(app);
    setActiveAsset(asset || null);
    setCurrentTab('editor');
  };

  // Switch project
  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
  };

  // Create new project
  const handleCreateProject = (name: string, description: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      activeAppId: 'photocraft',
      assets: [],
    };
    setProjects((previous) => [newProj, ...previous]);
    setActiveProject(newProj);
  };

  // Add asset to active project
  const handleAddAsset = (projectId: string, newAsset: ProjectAsset) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            updatedAt: new Date().toISOString(),
            assets: [newAsset, ...p.assets],
          };
        }
        return p;
      })
    );

    if (activeProject.id === projectId) {
      setActiveProject((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        assets: [newAsset, ...prev.assets],
      }));
    }
  };

  // Save asset from an editor into the active project
  const handleSaveEditorAsset = (assetName: string, dataUrl: string) => {
    const newAsset: ProjectAsset = {
      id: `asset-${Date.now()}`,
      name: assetName,
      type: activeApp?.category === 'visual' ? 'raster_image' : 'document',
      extension: activeApp?.supportedFormats[0] || '.bin',
      sizeBytes: Math.round(dataUrl.length * 0.75),
      updatedAt: new Date().toISOString(),
      compatibleAppId: activeApp?.id || 'photocraft',
      contentData: dataUrl,
    };
    handleAddAsset(activeProject.id, newAsset);
  };

  // Toggle AI mode between Cloud and Local
  const handleUpdateAIConfig = (cfg: Partial<AIProviderConfig>) => {
    if (cfg.mode) aiService.setMode(cfg.mode);
    if (typeof cfg.localEndpoint === 'string') aiService.setLocalEndpoint(cfg.localEndpoint);
    if (typeof cfg.confirmConsequentialTools === 'boolean') aiService.setConfirmConsequential(cfg.confirmConsequentialTools);
    setAIConfig({ ...aiService.getConfig(), ...cfg });
  };

  const handleSwitchAIMode = () => {
    const nextMode = aiConfig.mode === 'cloud' ? 'local' : 'cloud';
    aiService.setMode(nextMode);
    setAIConfig({ ...aiConfig, mode: nextMode });
  };

  // Render the appropriate editor workspace for the selected app
  const renderEditorWorkspace = () => {
    if (!activeApp) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs space-y-3">
          <p className="text-[var(--text-muted)]">No active application loaded.</p>
          <button
            onClick={() => setCurrentTab('apps')}
            className="px-4 py-2 rounded bg-[#B7A0FF] text-[#101114] font-medium"
          >
            Browse Application Library (21)
          </button>
        </div>
      );
    }

    switch (activeApp.id) {
      case 'photocraft':
        return (
          <PhotoCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
            onSaveAsset={handleSaveEditorAsset}
          />
        );
      case 'vectorcraft':
        return (
          <VectorCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
            onSaveAsset={handleSaveEditorAsset}
          />
        );
      case 'filmcraft':
        return (
          <FilmCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
          />
        );
      case 'wordcraft':
        return (
          <WordCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
          />
        );
      case 'cadcraft':
        return (
          <CadCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
          />
        );
      case 'gridcraft':
        return (
          <GridCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
          />
        );
      default:
        return (
          <GenericCraftWorkspace 
            app={activeApp} 
            asset={activeAsset} 
            companionState={companionState}
            onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          />
        );
    }
  };

  return (
    <>
      <Shell
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeProject={activeProject}
        activeApp={activeApp}
        companionState={companionState}
        aiConfig={aiConfig}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
        onSwitchAIMode={handleSwitchAIMode}
        theme={theme}
        setTheme={setTheme}
      >
        {currentTab === 'home' && (
          <WorkspaceHome
            projects={projects}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onOpenApp={handleOpenApp}
            onNavigateTab={setCurrentTab}
            companionState={companionState}
            aiConfig={aiConfig}
            onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectBrowser
            projects={projects}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onAddAsset={handleAddAsset}
            onOpenApp={handleOpenApp}
          />
        )}

        {currentTab === 'apps' && (
          <AppLibrary
            onOpenApp={handleOpenApp}
            onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          />
        )}

        {currentTab === 'editor' && renderEditorWorkspace()}

        {currentTab === 'ai' && (
          <AIWorkspace
            activeProject={activeProject}
            activeApp={activeApp}
            aiConfig={aiConfig}
            onUpdateAIConfig={handleUpdateAIConfig}
          />
        )}

        {currentTab === 'audit' && <RepositoryAuditView />}

        {currentTab === 'companion' && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <CompanionModal
              isOpen={true}
              onClose={() => setCurrentTab('home')}
              companionState={companionState}
            />
          </div>
        )}

        {currentTab === 'settings' && (
          <SettingsView
            appName={appName}
            setAppName={setAppName}
            theme={theme}
            setTheme={setTheme}
            aiConfig={aiConfig}
            onUpdateAIConfig={(cfg) => setAIConfig({ ...aiConfig, ...cfg })}
            companionState={companionState}
            projects={projects}
          />
        )}
      </Shell>

      {/* Universal Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenApp={handleOpenApp}
        onNavigateTab={setCurrentTab}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenCompanion={() => setIsCompanionModalOpen(true)}
      />

      {/* Local Companion Pairing Modal */}
      <CompanionModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
        companionState={companionState}
      />
    </>
  );
}
