import React, { useState } from 'react';
import { 
  Project, 
  CraftApp, 
  AIProviderConfig, 
  AIChatMessage,
  CompanionState,
} from '../../types';
import { companionService } from '../../services/companionService';
import { 
  aiService, 
  REGISTERED_AI_TOOLS, 
  RegisteredTool 
} from '../../services/aiService';

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
      const response = await aiService.processUserPrompt(
        currentInput,
        activeProject.name,
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
      setMessages((prev) => prev.map((item) => item.id === msgId && item.toolCall ? { ...item, toolCall: { ...item.toolCall, result: 'No action was run. Pair the local companion, then approve this proposal again.' } } : item));
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
                        TOOL: {msg.toolCall.toolName}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        msg.toolCall.status === 'executed' ? 'bg-emerald-500/20 text-emerald-400' :
                        msg.toolCall.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {msg.toolCall.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[var(--bg-elevated)] font-mono text-[11px] text-[var(--text-secondary)] space-y-0.5">
                      {Object.entries(msg.toolCall.parameters).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-[var(--text-muted)]">{key}:</span> {String(val)}
                        </div>
                      ))}
                    </div>

                    {msg.toolCall.status === 'proposed' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => void handleApproveTool(msg.id)} disabled={executingToolId === msg.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors"
                        >
                          <Check size={13} />
                          <span>Approve & launch</span>
                        </button>
                        <button
                          onClick={() => handleRejectTool(msg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--bg-elevated)] hover:bg-rose-500/20 text-rose-400 text-xs transition-colors"
                        >
                          <X size={13} />
                          <span>Cancel</span>
                        </button>
                      </div>
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

      {/* Right Registered Tools Inspector */}
      <aside className="w-80 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-[#B7A0FF]" />
              <span>Registered Tools ({REGISTERED_AI_TOOLS.length})</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            AI models can only execute operations declared in the adapter registry. Unrestricted filesystem or terminal execution is strictly prohibited.
          </p>

          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {REGISTERED_AI_TOOLS.map((tool) => (
              <div 
                key={tool.id}
                className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] text-[11px]">
                    {tool.name}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {tool.targetAppId}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                  {tool.description}
                </p>
                {tool.isConsequential && (
                  <div className="text-[10px] text-amber-400 font-mono pt-0.5">
                    Requires Confirmation
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Policy Callout */}
        <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Privacy Guard</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Private project assets are never uploaded to cloud endpoints without explicit prompt authorization.
          </p>
        </div>
      </aside>
    </div>
  );
};
