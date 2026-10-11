import { AIMode, AIProviderConfig, AIChatMessage } from '../types';

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
export const REGISTERED_AI_TOOLS: RegisteredTool[] = [];

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
    this.listeners.forEach(cb => cb({ ...this.config }));
  }

  public setLocalEndpoint(url: string) {
    this.config.localEndpoint = url;
    this.listeners.forEach(cb => cb({ ...this.config }));
  }

  public setConfirmConsequential(confirm: boolean) {
    this.config.confirmConsequentialTools = confirm;
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
    activeAppName: string
  ): Promise<{ text: string }> {
    if (this.config.mode === 'local') {
      const endpoint = this.config.localEndpoint.replace(/\/+$/, '');
      try {
        const response = await fetch(endpoint + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.localModel,
            stream: false,
            messages: [{ role: 'user', content: 'Project: ' + activeProjectName + '. Active application: ' + activeAppName + '. Do not claim to execute tools. User request: ' + prompt }],
          }),
        });
        if (!response.ok) throw new Error('Local model returned HTTP ' + response.status);
        const data = await response.json();
        if (typeof data?.message?.content !== 'string' || !data.message.content.trim()) throw new Error('Local model returned no message text.');
        this.config.activeLocalConnected = true;
        this.listeners.forEach(cb => cb({ ...this.config }));
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
        body: JSON.stringify({ model: this.config.cloudModel, prompt, context: { projectName: activeProjectName, appName: activeAppName } }),
      });
      if (!response.ok) throw new Error('Cloud AI endpoint returned HTTP ' + response.status);
      const data = await response.json();
      if (typeof data?.text !== 'string' || !data.text.trim()) throw new Error('Cloud AI endpoint returned no message text.');
      this.config.activeCloudConnected = true;
      this.listeners.forEach(cb => cb({ ...this.config }));
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
