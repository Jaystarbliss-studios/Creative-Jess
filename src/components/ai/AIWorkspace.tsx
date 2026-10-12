import React, { useEffect, useState } from 'react';
import { 
  Project, 
  CraftApp, 
  AIProviderConfig, 
  AIChatMessage,
  CompanionState,
  McpToolDescriptor,
} from '../../types';
import { companionService } from '../../services/companionService';
import { aiService } from '../../services/aiService';

import { 
  Cpu, 
  Send, 
  Check, 
  X, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw,
  FolderGit2,
  FileText
} from 'lucide-react';

interface AIWorkspaceProps {
  activeProject: Project;
  activeApp: CraftApp | null;
  aiConfig: AIProviderConfig;
  onUpdateAIConfig: (cfg: Partial<AIProviderConfig>) => void;
  companionState: CompanionState;
  onOpenCompanionModal: () => void;
}

export const AIWorkspace: React.FC<AIWorkspaceProps> = ({
  activeProject,
  activeApp,
  aiConfig,
  onUpdateAIConfig,
  companionState,
  onOpenCompanionModal,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      timestamp: '14:30',
      mode: aiConfig.mode,
      text: 'AI workspace opened for project ' + activeProject.name + '. Provider connectivity and application tool execution are not yet verified. No app commands will be reported as successful unless a real adapter returns a validated result.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [executingToolId, setExecutingToolId] = useState<string | null>(null);
  const [localEndpointDraft, setLocalEndpointDraft] = useState(aiConfig.localEndpoint);
  const [localModelDraft, setLocalModelDraft] = useState(aiConfig.localModel);
  const [isCheckingLocal, setIsCheckingLocal] = useState(false);
  const [localConnectionMessage, setLocalConnectionMessage] = useState('');
  const [mcpTools, setMcpTools] = useState<McpToolDescriptor[]>([]);
  const [toolSearch, setToolSearch] = useState('');
  const [isRefreshingTools, setIsRefreshingTools] = useState(false);
  const [toolCatalogMessage, setToolCatalogMessage] = useState('');

  useEffect(() => {
    setLocalEndpointDraft(aiConfig.localEndpoint);
    setLocalModelDraft(aiConfig.localModel);
  }, [aiConfig.localEndpoint, aiConfig.localModel]);

  const availableMcpAppKey = companionState.availableMcpApps.join(',');
  useEffect(() => {
    let cancelled = false;
    if (!companionState.connected || !companionState.tokenPaired) {
      setMcpTools([]);
      setToolCatalogMessage('Pair the local companion to discover real editor tools.');
      return () => { cancelled = true; };
    }
    setIsRefreshingTools(true);
    setToolCatalogMessage('Discovering tools from configured MCP applications…');
    companionService.listAllMcpTools()
      .then((tools) => {
        if (cancelled) return;
        setMcpTools(tools);
        setToolCatalogMessage(tools.length
          ? 'Live catalog loaded from the paired local companion.'
          : 'No MCP tools were discovered. Check configured CLI paths and companion logs.');
      })
      .catch((error) => {
        if (cancelled) return;
        setMcpTools([]);
        setToolCatalogMessage(error instanceof Error ? error.message : 'MCP tool discovery failed.');
      })
      .finally(() => {
        if (!cancelled) setIsRefreshingTools(false);
      });
    return () => { cancelled = true; };
  }, [companionState.connected, companionState.tokenPaired, availableMcpAppKey]);

  const refreshMcpTools = async () => {
    if (!companionState.connected || !companionState.tokenPaired) {
      setToolCatalogMessage('Pair the local companion before refreshing the MCP catalog.');
      return;
    }
    setIsRefreshingTools(true);
    setToolCatalogMessage('Refreshing live MCP tool catalog…');
    try {
      const tools = await companionService.listAllMcpTools();
      setMcpTools(tools);
      setToolCatalogMessage(tools.length
        ? 'Live catalog refreshed from the paired local companion.'
        : 'No MCP tools were discovered. Check configured CLI paths and companion logs.');
    } catch (error) {
      setToolCatalogMessage(error instanceof Error ? error.message : 'MCP tool discovery failed.');
    } finally {
      setIsRefreshingTools(false);
    }
  };

  const filteredMcpTools = mcpTools.filter((tool) => {
    const query = toolSearch.trim().toLowerCase();
    return !query || [tool.appId, tool.name, tool.description || ''].some((value) => value.toLowerCase().includes(query));
  });
  const visibleMcpTools = filteredMcpTools.slice(0, 80);

  const saveLocalSettings = () => {
    const endpoint = localEndpointDraft.trim().replace(/\/+$/, '');
    const model = localModelDraft.trim();
    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      setLocalConnectionMessage('Enter a valid HTTP(S) endpoint and a model name.');
      return false;
    }
    if (!['http:', 'https:'].includes(parsedEndpoint.protocol) || !parsedEndpoint.hostname || !model || model.length > 200) {
      setLocalConnectionMessage('Enter a valid HTTP(S) endpoint and a model name (maximum 200 characters).');
      return false;
    }
    aiService.setLocalEndpoint(endpoint);
    aiService.setLocalModel(model);
    onUpdateAIConfig({ localEndpoint: endpoint, localModel: model });
    setLocalConnectionMessage('Local AI settings saved on this device.');
    return true;
  };

  const checkLocalConnection = async () => {
    if (!saveLocalSettings()) return;
    setIsCheckingLocal(true);
    setLocalConnectionMessage('Checking local AI runtime…');
    try {
      const connected = await aiService.checkLocalHealth();
      setLocalConnectionMessage(connected
        ? 'Ollama responded. Tool calling still depends on the selected model.'
        : 'Could not reach Ollama. Check that it is running and allows requests from this workspace origin.');
      onUpdateAIConfig(aiService.getConfig());
    } finally {
      setIsCheckingLocal(false);
    }
  };


  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: aiConfig.mode,
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      let localFolderCandidate: string | null = null;
      try { localFolderCandidate = localStorage.getItem('craft-workspace:local-export-folder:' + activeProject.id); } catch { /* Continue without optional local-folder context. */ }
      const importedFiles = activeProject.assets.filter((asset) => asset.contentStoredLocally).map((asset) => asset.name).slice(0, 40);
      const projectContext = [
        'Project: ' + activeProject.name,
        importedFiles.length ? 'Imported project files: ' + importedFiles.join(', ') : 'No imported project files are currently listed.',
        localFolderCandidate ? 'Last exported folder name: ' + localFolderCandidate + '. This is relative to the configured CraftProjects root only if the user selected that exact root in the folder picker; confirm with the user before relying on the path.' : 'No local folder export has been recorded for this project.',
      ].join(' | ');
      const response = await aiService.processUserPrompt(
        currentInput,
        projectContext,
        activeApp ? activeApp.name : 'Workspace',
        await companionService.listAllMcpTools()
      );

      const assistantMsg: AIChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: aiConfig.mode,
        text: response.text,
        toolCall: response.toolProposal ? { id: 'tool-' + (Date.now() + 1), toolName: response.toolProposal.name, parameters: response.toolProposal.args, status: 'proposed' } : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The AI request failed. Check your provider settings and connection, then try again.';
      setMessages((prev) => [...prev, {
        id: 'msg-error-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: aiConfig.mode,
        text: 'I could not complete that request. ' + message,
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveTool = async (msgId: string) => {
    if (executingToolId) return;
    const message = messages.find((item) => item.id === msgId);
    const toolCall = message?.toolCall;
    if (!toolCall) return;
    if (!companionState.connected || !companionState.tokenPaired) {
      onOpenCompanionModal();
      setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: 'failed', result: 'No action was run. Pair the local companion, then ask again to create a fresh proposal.' } } : item));
      return;
    }
    if (toolCall.toolName === 'mcp_tool') {
      const appId = toolCall.parameters.appId;
      const toolName = toolCall.parameters.toolName;
      const args = toolCall.parameters.arguments;
      if (typeof appId !== 'string' || typeof toolName !== 'string' || !args || typeof args !== 'object' || Array.isArray(args)) return;
      if (!companionState.availableMcpApps.includes(appId)) {
        setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: 'failed', result: 'No tool was run. Configure a CLI path for ' + appId + ' in CRAFT_MCP_PATHS_JSON and restart the companion.' } } : item));
        return;
      }
      setExecutingToolId(msgId);
      try {
        const result = await companionService.callMcpTool(appId, toolName, args as Record<string, unknown>);
        setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: result.success ? 'executed' : 'failed', result: result.output } } : item));
      } catch (error) {
        setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: 'failed', result: error instanceof Error ? error.message : 'MCP tool request failed.' } } : item));
      } finally {
        setExecutingToolId(null);
      }
      return;
    }
    if (toolCall.toolName !== 'open_application' || typeof toolCall.parameters.appId !== 'string') return;
    const appId = toolCall.parameters.appId;
    if (!companionState.availableApps.includes(appId)) {
      setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: 'failed', result: 'No launch occurred. Configure an absolute executable path for ' + appId + ' in CRAFT_APP_PATHS_JSON, restart the companion, and ask again.' } } : item));
      return;
    }
    setExecutingToolId(msgId);
    try {
      const result = await companionService.executeAllowlistedCommand('open-app', [appId]);
      setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: result.success ? 'executed' : 'failed', result: result.output } } : item));
    } catch (error) {
      setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, status: 'failed', result: error instanceof Error ? error.message : 'Launch request failed.' } } : item));
    } finally {
      setExecutingToolId(null);
    }
  };

  const handleRejectTool = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.toolCall) {
          return {
            ...msg,
            toolCall: {
              ...msg.toolCall,
              status: 'rejected',
              result: 'Operation cancelled by user.',
            },
          };
        }
        return msg;
      })
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* Main Conversation Feed */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-6 py-2 text-[11px] text-[var(--text-muted)]">AI may propose launching a configured native app or calling a tool discovered from a configured local MCP CLI. Every proposal requires explicit approval; the companion validates tool names and arguments before dispatch.</div>
        {/* Top Provider Bar */}
        <div className="h-12 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-primary)]">AI Workspace</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              Active: {aiConfig.mode === 'cloud' ? (aiConfig.activeCloudConnected ? aiConfig.cloudModel : 'Cloud provider not verified') : `Ollama (${aiConfig.localModel})`}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <button
              onClick={() => {
                aiService.setMode('cloud');
                onUpdateAIConfig({ mode: 'cloud' });
              }}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                aiConfig.mode === 'cloud'
                  ? 'bg-[#B7A0FF] text-[#101114] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Cloud AI (Gemini)
            </button>
            <button
              onClick={() => {
                aiService.setMode('local');
                onUpdateAIConfig({ mode: 'local' });
              }}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                aiConfig.mode === 'local'
                  ? 'bg-emerald-400 text-[#101114] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Local AI (Loopback)
            </button>
          </div>
        </div>

        {aiConfig.mode === 'local' && (
          <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
              <label className="block text-[11px] text-[var(--text-muted)]">
                Ollama endpoint
                <input value={localEndpointDraft} onChange={(event) => setLocalEndpointDraft(event.target.value)} placeholder="http://127.0.0.1:11434" className="mt-1 w-full border-b border-[var(--border-subtle)] bg-transparent py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]" />
              </label>
              <label className="block text-[11px] text-[var(--text-muted)]">
                Local model
                <input value={localModelDraft} onChange={(event) => setLocalModelDraft(event.target.value)} placeholder="llama3.2:latest" className="mt-1 w-full border-b border-[var(--border-subtle)] bg-transparent py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]" />
              </label>
              <button onClick={saveLocalSettings} className="px-3 py-2 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]">Save settings</button>
              <button onClick={() => void checkLocalConnection()} disabled={isCheckingLocal} className="px-3 py-2 text-xs bg-[#B7A0FF] text-[#101114] disabled:opacity-50">{isCheckingLocal ? 'Checking…' : 'Test connection'}</button>
            </div>
            {localConnectionMessage && <p role="status" className="mt-2 text-[11px] text-[var(--text-muted)]">{localConnectionMessage}</p>}
          </div>
        )}

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-2xl ${
                msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-[var(--text-muted)] font-mono">
                <span>{msg.sender === 'user' ? 'You' : 'Craft Assistant'}</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
                <span>·</span>
                <span className="uppercase text-[10px]">{msg.mode}</span>
              </div>

              <div
                className={`p-4 rounded text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#B7A0FF] text-[#101114] font-medium'
                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Structured Tool Call Preview */}
                {msg.toolCall && (
                  <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#B7A0FF] font-semibold">
                        TOOL: {msg.toolCall.toolName === 'mcp_tool' ? String(msg.toolCall.parameters.appId) + ' · ' + String(msg.toolCall.parameters.toolName) : msg.toolCall.toolName}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        msg.toolCall.status === 'executed' ? 'bg-emerald-500/20 text-emerald-400' :
                        msg.toolCall.status === 'rejected' || msg.toolCall.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {msg.toolCall.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[var(--bg-elevated)] font-mono text-[11px] text-[var(--text-secondary)] space-y-0.5">
                      {Object.entries(msg.toolCall.parameters).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-[var(--text-muted)]">{key}:</span> {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                        </div>
                      ))}
                    </div>

                    {msg.toolCall.status === 'proposed' && (
                      <>
                        {msg.toolCall.toolName === 'mcp_tool' && <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">Review the tool name and every argument before approving. The upstream tool may modify, overwrite, delete, or export files according to its own permissions.</p>}
                        <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => void handleApproveTool(msg.id)} disabled={Boolean(executingToolId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors"
                        >
                          <Check size={13} />
                          <span>{msg.toolCall.toolName === 'mcp_tool' ? 'Approve & run' : 'Approve & launch'}</span>
                        </button>
                        <button
                          onClick={() => handleRejectTool(msg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                        >
                          <X size={13} />
                          <span>Cancel</span>
                        </button>
                        </div>
                      </>
                    )}

                    {msg.toolCall.result && (
                      <div className={`text-[11px] font-mono pt-1 ${msg.toolCall.status === 'executed' ? 'text-emerald-400' : msg.toolCall.status === 'failed' || msg.toolCall.status === 'rejected' ? 'text-rose-400' : 'text-[var(--text-secondary)]'}`}>
                        &gt; {msg.toolCall.result}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono p-2">
              <RefreshCw size={13} className="animate-spin text-[#B7A0FF]" />
              <span>Evaluating request across application adapters...</span>
            </div>
          )}
        </div>

        {/* Prompt Input Box */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Ask a question. Application actions remain disabled until a real adapter is verified.'
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-4 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#B7A0FF] transition-colors"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="px-4 py-2.5 rounded bg-[#B7A0FF] text-[#101114] font-medium text-xs hover:bg-[#c8b6ff] transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Live MCP Tool Inspector */}
      <aside className="w-80 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col min-h-0 text-xs">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Live MCP tools</h2>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">{mcpTools.length} discovered from configured apps</p>
          </div>
          <button type="button" onClick={() => void refreshMcpTools()} disabled={isRefreshingTools || !companionState.connected || !companionState.tokenPaired} className="border border-[var(--border-subtle)] px-2 py-1.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40">
            {isRefreshingTools ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <p className="py-3 text-[10px] leading-relaxed text-[var(--text-muted)]">{toolCatalogMessage}</p>

        <div className="border-b border-[var(--border-subtle)] pb-3">
          <label className="block text-[10px] text-[var(--text-muted)]" htmlFor="mcp-tool-search">Filter by app, tool, or description</label>
          <input id="mcp-tool-search" value={toolSearch} onChange={(event) => setToolSearch(event.target.value)} placeholder="Search live tool catalog" className="mt-1 w-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-[11px] text-[var(--text-primary)] outline-none focus:border-[#B7A0FF]" />
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-[var(--border-subtle)] py-2">
            <div className="font-medium text-[var(--text-primary)]">open_application</div>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">Launches a native app only when its executable is explicitly configured in the local companion.</p>
          </div>
          {visibleMcpTools.map((tool) => (
            <div key={tool.appId + ':' + tool.name} className="border-b border-[var(--border-subtle)] py-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="break-all font-medium text-[var(--text-primary)]">{tool.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">{tool.appId}</span>
              </div>
              {tool.description && <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-[var(--text-muted)]">{tool.description}</p>}
            </div>
          ))}
          {filteredMcpTools.length === 0 && <p className="py-5 text-[11px] text-[var(--text-muted)]">{mcpTools.length ? 'No tools match this filter.' : 'No live MCP tools are available yet.'}</p>}
          {filteredMcpTools.length > visibleMcpTools.length && <p className="py-3 text-[10px] text-[var(--text-muted)]">Showing {visibleMcpTools.length} of {filteredMcpTools.length} matching tools. Refine the search to narrow the list.</p>}
        </div>

        <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-[var(--text-primary)]"><ShieldCheck size={12} /> Privacy and execution</div>
          The AI can propose only tools in the discovered catalog. Every proposed action still requires approval; the companion validates tool names and arguments before dispatch. Review filesystem effects before approving an operation.
        </div>
      </aside>
    </div>
  );
};
