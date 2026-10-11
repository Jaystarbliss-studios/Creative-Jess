import { CompanionState, McpToolDescriptor } from '../types';

class LocalCompanionService {
  private state: CompanionState = {
    connected: false,
    port: 9876,
    version: 'Unknown',
    os: 'Unknown',
    tokenPaired: false,
    registeredToolsCount: 0,
    lastHeartbeat: null,
    allowlistedCommands: [],
    availableApps: [],
    availableMcpApps: [],
  };

  private pairingToken: string | null = null;
  private mcpToolCache = new Map<string, { loadedAt: number; tools: McpToolDescriptor[] }>();
  private listeners: ((state: CompanionState) => void)[] = [];

  constructor() {
    // Initial check
    this.checkConnection();
  }

  public subscribe(callback: (state: CompanionState) => void) {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.state }));
  }

  public getState(): CompanionState {
    return { ...this.state, allowlistedCommands: [...this.state.allowlistedCommands], availableApps: [...this.state.availableApps], availableMcpApps: [...this.state.availableMcpApps] };
  }

  public async checkConnection(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch('http://127.0.0.1:' + this.state.port + '/health', {
        signal: controller.signal,
        headers: { 'X-Craft-Origin': 'craft-workspace-web' },
      }).catch(() => null);

      if (response && response.ok) {
        const health = await response.json().catch(() => ({}));
        this.state.connected = true;
        this.state.lastHeartbeat = new Date().toISOString();
        if (typeof health.version === 'string') this.state.version = health.version;
        if (typeof health.os === 'string') this.state.os = health.os;
        this.state.allowlistedCommands = Array.isArray(health.allowlistedCommands)
          ? health.allowlistedCommands.filter((value: unknown): value is string => typeof value === 'string')
          : [];
        this.state.availableApps = Array.isArray(health.availableApps)
          ? health.availableApps.filter((value: unknown): value is string => typeof value === 'string')
          : [];
        this.state.availableMcpApps = Array.isArray(health.availableMcpApps) ? health.availableMcpApps.filter((value: unknown): value is string => typeof value === 'string') : [];
        this.state.registeredToolsCount = typeof health.registeredToolsCount === 'number' ? health.registeredToolsCount : 0;
      } else {
        this.state.connected = false;
        this.state.tokenPaired = false;
        this.pairingToken = null;
        this.state.allowlistedCommands = [];
        this.state.availableApps = [];
        this.state.availableMcpApps = [];
        this.state.registeredToolsCount = 0;
      }
    } catch {
      this.state.connected = false;
      this.state.tokenPaired = false;
      this.pairingToken = null;
      this.state.allowlistedCommands = [];
      this.state.availableApps = [];
      this.state.availableMcpApps = [];
      this.state.registeredToolsCount = 0;
    } finally {
      clearTimeout(timeoutId);
      this.notify();
    }
    return this.state.connected;
  }

  public async pair(token: string): Promise<{ success: boolean; message: string }> {
    if (!token || token.trim().length < 8) return { success: false, message: 'Enter the pairing token provided by the installed companion.' };
    const pairingController = new AbortController();
    const pairingTimeout = setTimeout(() => pairingController.abort(), 2500);
    try {
      const response = await fetch('http://127.0.0.1:' + this.state.port + '/pair', {
        signal: pairingController.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Craft-Origin': 'craft-workspace-web' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.paired !== true) {
        this.state.tokenPaired = false;
        this.pairingToken = null;
        this.notify();
        return { success: false, message: typeof data?.message === 'string' ? data.message : 'The companion did not confirm pairing. No pairing was established.' };
      }
      this.pairingToken = token.trim();
      this.mcpToolCache.clear();
      this.state.tokenPaired = true;
      this.state.connected = true;
      this.state.lastHeartbeat = new Date().toISOString();
      this.notify();
      return { success: true, message: 'The local companion confirmed pairing.' };
    } catch (error) {
      this.state.tokenPaired = false;
      this.state.connected = false;
      this.pairingToken = null;
      this.notify();
      const detail = error instanceof Error ? error.message : 'Unknown connection error';
      return { success: false, message: 'Could not pair with the local companion. Confirm it is installed, running, and permits this browser origin. Details: ' + detail };
    } finally {
      clearTimeout(pairingTimeout);
    }
  }

  public disconnect() {
    this.pairingToken = null;
    this.mcpToolCache.clear();
    this.state.tokenPaired = false;
    this.state.connected = false;
    this.state.registeredToolsCount = 0;
    this.notify();
  }

  public async listMcpTools(appId: string): Promise<McpToolDescriptor[]> {
    const cached = this.mcpToolCache.get(appId);
    if (cached && Date.now() - cached.loadedAt < 5 * 60 * 1000) return cached.tools.map((tool) => ({ ...tool }));
    if (!this.state.connected || !this.state.tokenPaired || !this.pairingToken) throw new Error('Pair the local companion before discovering MCP tools.');
    if (!this.state.availableMcpApps.includes(appId)) throw new Error('No MCP CLI is configured for ' + appId + '.');
    const response = await fetch('http://127.0.0.1:' + this.state.port + '/mcp/' + encodeURIComponent(appId) + '/tools', { headers: { 'Authorization': 'Bearer ' + this.pairingToken, 'X-Craft-Origin': 'craft-workspace-web' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'MCP tool discovery failed (HTTP ' + response.status + ').');
    const tools: McpToolDescriptor[] = Array.isArray(data?.tools) ? data.tools.filter((tool: unknown) => tool && typeof tool === 'object' && typeof (tool as { name?: unknown }).name === 'string').map((tool: { name: string; description?: string; inputSchema?: Record<string, unknown> }) => ({ appId, name: tool.name, description: typeof tool.description === 'string' ? tool.description : '', inputSchema: tool.inputSchema && typeof tool.inputSchema === 'object' ? tool.inputSchema : { type: 'object', properties: {} } })) : [];
    this.mcpToolCache.set(appId, { loadedAt: Date.now(), tools });
    return tools.map((tool) => ({ ...tool }));
  }

  public async listAllMcpTools(): Promise<McpToolDescriptor[]> {
    if (!this.state.connected || !this.state.tokenPaired) return [];
    const appIds = [...this.state.availableMcpApps];
    const results: McpToolDescriptor[] = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < appIds.length) {
        const appId = appIds[cursor++];
        try { results.push(...await this.listMcpTools(appId)); } catch { /* Unavailable CLIs are omitted; no tools are fabricated. */ }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, appIds.length) }, () => worker()));
    this.state.registeredToolsCount = results.length;
    this.notify();
    return results;
  }

  public async callMcpTool(appId: string, name: string, args: Record<string, unknown>): Promise<{ success: boolean; output: string }> {
    if (!this.state.connected || !this.state.tokenPaired || !this.pairingToken) throw new Error('Pair the local companion before running MCP tools.');
    if (!this.state.availableMcpApps.includes(appId)) throw new Error('No MCP CLI is configured for ' + appId + '.');
    if (!this.state.allowlistedCommands.includes('mcp-call-tool')) throw new Error('The companion does not allow MCP tool calls.');
    const response = await fetch('http://127.0.0.1:' + this.state.port + '/mcp/' + encodeURIComponent(appId) + '/call', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.pairingToken, 'X-Craft-Origin': 'craft-workspace-web' }, body: JSON.stringify({ name, arguments: args }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, output: typeof data?.error === 'string' ? data.error : 'MCP tool call failed (HTTP ' + response.status + ').' };
    const result = data?.result;
    const output = typeof result?.content === 'string' ? result.content : Array.isArray(result?.content) ? result.content.map((part: { text?: unknown }) => typeof part?.text === 'string' ? part.text : JSON.stringify(part)).join('\n') : JSON.stringify(result);
    return { success: result?.isError !== true, output: output || 'MCP tool returned no content.' };
  }
  public async executeAllowlistedCommand(commandName: string, args: string[]): Promise<{ success: boolean; output: string; exitCode: number }> {
    if (!this.state.allowlistedCommands.includes(commandName)) {
      throw new Error("Security policy rejected command '" + commandName + "': it is not in the companion's reported allowlist.");
    }
    if (!this.state.connected || !this.state.tokenPaired || !this.pairingToken) {
      return { success: false, exitCode: 1, output: 'No command was executed because the companion is not connected and paired.' };
    }
    if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('Command arguments must be an array of strings.');
    try {
      const response = await fetch('http://127.0.0.1:' + this.state.port + '/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.pairingToken, 'X-Craft-Origin': 'craft-workspace-web' },
        body: JSON.stringify({ command: commandName, args }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, exitCode: 1, output: typeof data?.message === 'string' ? data.message : 'Companion rejected the command request (HTTP ' + response.status + ').' };
      return { success: data?.success === true && data?.exitCode === 0, exitCode: typeof data?.exitCode === 'number' ? data.exitCode : 1, output: typeof data?.output === 'string' ? data.output : 'The companion returned no command output.' };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown connection error';
      return { success: false, exitCode: 1, output: 'Command execution could not be verified. ' + detail };
    }
  }
}

export const companionService = new LocalCompanionService();
