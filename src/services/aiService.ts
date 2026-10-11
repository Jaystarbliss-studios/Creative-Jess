import { AIMode, AIProviderConfig, AIChatMessage, McpToolDescriptor } from '../types';

export interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  targetAppId: string;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    required: boolean;
  }[];
  isConsequential: boolean;
}

/** Keep empty until a documented application adapter has passed a real smoke test. */
export const REGISTERED_AI_TOOLS: RegisteredTool[] = [{ id: 'open_application', name: 'Launch native application', description: 'Propose starting a configured native app through the paired local companion. Requires explicit approval and does not edit files.', targetAppId: 'local-companion', parameters: [{ name: 'appId', type: 'string', description: 'Stable application ID from the workspace catalog.', required: true }], isConsequential: true }];

function functionNameForTool(tool: McpToolDescriptor): string {
  return ('mcp_' + tool.appId + '_' + tool.name).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 60);
}

function geminiSchema(input: unknown, depth = 0): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input) || depth > 5) return { type: 'OBJECT', properties: {} };
  const schema = input as Record<string, unknown>;
  const rawType = schema.type;
  const type = rawType === 'string' ? 'STRING' : rawType === 'integer' || rawType === 'number' ? 'NUMBER' : rawType === 'boolean' ? 'BOOLEAN' : rawType === 'array' ? 'ARRAY' : 'OBJECT';
  const result: Record<string, unknown> = { type };
  if (typeof schema.description === 'string') result.description = schema.description.slice(0, 500);
  if (Array.isArray(schema.enum) && schema.enum.length <= 50) result.enum = schema.enum.filter((v) => typeof v === 'string' || typeof v === 'number');
  if (schema.type === 'object' && schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)) {
    const entries = Object.entries(schema.properties as Record<string, unknown>).slice(0, 30);
    result.properties = Object.fromEntries(entries.map(([key, value]) => [key, geminiSchema(value, depth + 1)]));
    if (Array.isArray(schema.required)) result.required = schema.required.filter((key): key is string => typeof key === 'string' && entries.some(([name]) => name === key));
  }
  if (schema.type === 'array' && schema.items) result.items = geminiSchema(schema.items, depth + 1);
  return result;
}
class AIService {
  private config: AIProviderConfig = {
    mode: 'cloud',
    cloudModel: 'gemini-2.5-flash',
    localEndpoint: 'http://127.0.0.1:11434',
    localModel: 'llama3.2:latest',
    telemetryEnabled: false,
    confirmConsequentialTools: true,
    activeCloudConnected: false,
    activeLocalConnected: false,
  };

  private listeners: ((config: AIProviderConfig) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('craft-workspace:ai-preferences');
        const preferences = saved ? JSON.parse(saved) : null;
        if (preferences && typeof preferences === 'object') {
          if (preferences.mode === 'cloud' || preferences.mode === 'local') this.config.mode = preferences.mode;
          if (typeof preferences.localEndpoint === 'string' && preferences.localEndpoint.trim()) this.config.localEndpoint = preferences.localEndpoint;
          if (typeof preferences.localModel === 'string' && preferences.localModel.trim()) this.config.localModel = preferences.localModel;
          if (typeof preferences.confirmConsequentialTools === 'boolean') this.config.confirmConsequentialTools = preferences.confirmConsequentialTools;
        }
      } catch {
        // Invalid saved preferences are ignored; safe defaults remain active.
      }
    }
  }

  private persistPreferences() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('craft-workspace:ai-preferences', JSON.stringify({
        mode: this.config.mode,
        localEndpoint: this.config.localEndpoint,
        localModel: this.config.localModel,
        confirmConsequentialTools: this.config.confirmConsequentialTools,
      }));
    } catch {
      // Keep current-session settings when browser storage is unavailable.
    }
  }

  public subscribe(callback: (config: AIProviderConfig) => void) {
    this.listeners.push(callback);
    callback(this.config);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  public setMode(mode: AIMode) {
    this.config.mode = mode;
    this.persistPreferences();
    this.listeners.forEach(cb => cb({ ...this.config }));
  }

  public setLocalEndpoint(url: string) {
    this.config.localEndpoint = url;
    this.listeners.forEach(cb => cb({ ...this.config }));
  }

  public setConfirmConsequential(confirm: boolean) {
    this.config.confirmConsequentialTools = confirm;
    this.persistPreferences();
    this.listeners.forEach(cb => cb({ ...this.config }));
  }

  public async checkLocalHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.config.localEndpoint}/api/tags`, {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(id);
      this.config.activeLocalConnected = !!(res && res.ok);
    } catch {
      this.config.activeLocalConnected = false;
    }
    this.listeners.forEach(cb => cb({ ...this.config }));
    return this.config.activeLocalConnected;
  }

  public async processUserPrompt(
    prompt: string,
    activeProjectName: string,
    activeAppName: string,
    mcpTools: McpToolDescriptor[] = []
  ): Promise<{ text: string; toolProposal?: { name: string; args: Record<string, unknown> } }> {
    if (this.config.mode === 'local') {
      const endpoint = this.config.localEndpoint.replace(/\/+$/, '');
      try {
        const response = await fetch(endpoint + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.localModel,
            stream: false,
            messages: [{ role: 'user', content: 'Project: ' + activeProjectName + '. Active application: ' + activeAppName + '. You may propose one supplied tool call when useful. Never claim an action happened before explicit user approval. User request: ' + prompt }],
            tools: [
              { type: 'function', function: { name: 'open_application', description: 'Propose launching a configured native application. Does not open a file or edit content.', parameters: { type: 'object', properties: { appId: { type: 'string', enum: ['artcraft', 'photocraft', 'artcraftx', 'lightcraft', 'filmcraft', 'effectcraft', 'vectorcraft', 'cadcraft', 'wordcraft', 'soundcraft', 'pdfcraft', 'designcraft', 'deckcraft', 'gridcraft'] } }, required: ['appId'] } } },
              ...mcpTools.slice(0, 50).map((tool) => ({ type: 'function', function: { name: functionNameForTool(tool), description: (tool.description || tool.name).slice(0, 500), parameters: tool.inputSchema || { type: 'object', properties: {} } } })),
            ],
          }),
        });
        if (!response.ok) throw new Error('Local model returned HTTP ' + response.status);
        const data = await response.json();
        if (typeof data?.message?.content !== 'string' || !data.message.content.trim()) throw new Error('Local model returned no message text.');
        this.config.activeLocalConnected = true;
        this.listeners.forEach(cb => cb({ ...this.config }));
        const call = Array.isArray(data?.message?.tool_calls) ? data.message.tool_calls[0]?.function : null;
        if (call && typeof call.name === 'string' && call.name === 'open_application' && typeof call.arguments?.appId === 'string') {
          return { text: data.message.content || 'Review the proposed application launch before approving it.', toolProposal: { name: 'open_application', args: { appId: call.arguments.appId } } };
        }
        if (call && typeof call.name === 'string') {
          const tool = mcpTools.slice(0, 50).find((item) => functionNameForTool(item) === call.name);
          if (tool && call.arguments && typeof call.arguments === 'object' && !Array.isArray(call.arguments)) {
            return { text: data.message.content || 'Review the proposed editor operation before approving it.', toolProposal: { name: 'mcp_tool', args: { appId: tool.appId, toolName: tool.name, arguments: call.arguments as Record<string, unknown> } } };
          }
        }
        return { text: data.message.content };
      } catch (error) {
        this.config.activeLocalConnected = false;
        this.listeners.forEach(cb => cb({ ...this.config }));
        const detail = error instanceof Error ? error.message : 'Unknown connection error';
        return { text: 'Local AI is unavailable at ' + endpoint + '. No application action was run. Check that Ollama is running, the model is installed, and browser access is allowed. Details: ' + detail };
      }
    }

    // Cloud credentials remain server-side; the Express endpoint handles provider requests.
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.cloudModel, prompt, context: { projectName: activeProjectName, appName: activeAppName }, mcpTools: mcpTools.slice(0, 50) }),
      });
      if (!response.ok) throw new Error('Cloud AI endpoint returned HTTP ' + response.status);
      const data = await response.json();
      if (typeof data?.text !== 'string' || !data.text.trim()) throw new Error('Cloud AI endpoint returned no message text.');
      this.config.activeCloudConnected = true;
      this.listeners.forEach(cb => cb({ ...this.config }));
      const proposal = data?.toolProposal;
      if (proposal?.name === 'open_application' && typeof proposal?.args?.appId === 'string') {
        return { text: data.text, toolProposal: { name: 'open_application', args: { appId: proposal.args.appId } } };
      }
      if (proposal?.name === 'mcp_tool' && typeof proposal?.args?.appId === 'string' && typeof proposal?.args?.toolName === 'string' && proposal?.args?.arguments && typeof proposal.args.arguments === 'object') {
        const tool = mcpTools.find((item) => item.appId === proposal.args.appId && item.name === proposal.args.toolName);
        if (tool) return { text: data.text, toolProposal: { name: 'mcp_tool', args: { appId: tool.appId, toolName: tool.name, arguments: proposal.args.arguments as Record<string, unknown> } } };
      }
      return { text: data.text };
    } catch (error) {
      this.config.activeCloudConnected = false;
      this.listeners.forEach(cb => cb({ ...this.config }));
      const detail = error instanceof Error ? error.message : 'Unknown connection error';
      return { text: 'Cloud AI is not connected to a verified server-side provider in this build. No application action was run. Configure /api/ai/chat with a server-managed provider key. Details: ' + detail };
    }
  }
}

export const aiService = new AIService();
