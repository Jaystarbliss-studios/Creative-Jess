import { CompanionState } from '../types';

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
  };

  private pairingToken: string | null = null;
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
    return { ...this.state };
  }

  public async checkConnection(): Promise<boolean> {
    try {
      // In web browser preview, we attempt loopback fetch or check companion endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      
      const res = await fetch(`http://127.0.0.1:${this.state.port}/health`, {
        signal: controller.signal,
        headers: { 'X-Craft-Origin': 'craft-workspace-web' }
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        this.state.connected = true;
        this.state.lastHeartbeat = new Date().toISOString();
      } else {
        // Not reachable directly via web fetch (or loopback blocked by browser CORS / companion not running)
        this.state.connected = false;
      }
    } catch {
      this.state.connected = false;
    }

    this.notify();
    return this.state.connected;
  }

  public async pair(token: string): Promise<{ success: boolean; message: string }> {
    if (!token || token.trim().length < 8) return { success: false, message: 'Enter the pairing token provided by the installed companion.' };
    try {
      const response = await fetch('http://127.0.0.1:' + this.state.port + '/pair', {
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
    }
  }

  public disconnect() {
    this.state.tokenPaired = false;
    this.state.connected = false;
    this.notify();
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
