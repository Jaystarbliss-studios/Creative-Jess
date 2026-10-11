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

export const REGISTERED_AI_TOOLS: RegisteredTool[] = [
  {
    id: 'resize_project_assets',
    name: 'Resize & Normalize Project Images',
    description: 'Resizes raster images to specific display dimensions using PhotoCraft image processing pipeline without overwriting source files.',
    targetAppId: 'photocraft',
    isConsequential: true,
    parameters: [
      { name: 'targetWidth', type: 'number', description: 'Target width in pixels (e.g. 1920)', required: true },
      { name: 'targetHeight', type: 'number', description: 'Target height in pixels (e.g. 1080)', required: true },
      { name: 'preserveAspect', type: 'boolean', description: 'Maintain aspect ratio with letterboxing or crop', required: false },
      { name: 'suffix', type: 'string', description: 'Output filename suffix (default: _web)', required: false },
    ],
  },
  {
    id: 'generate_vector_geometry',
    name: 'Generate Vector Curves (VectorCraft)',
    description: 'Generates precision SVG vector path mathematical coordinates for VectorCraft canvas.',
    targetAppId: 'vectorcraft',
    isConsequential: false,
    parameters: [
      { name: 'shapeType', type: 'string', description: 'Geometry type: monogram, polygon, spiral, or golden_ratio', required: true },
      { name: 'strokeColor', type: 'string', description: 'Hex stroke color code', required: true },
      { name: 'strokeWidth', type: 'number', description: 'Stroke width in points', required: false },
    ],
  },
  {
    id: 'analyze_color_harmony',
    name: 'Analyze Palette & Contrast (DesignCraft)',
    description: 'Computes WCAG AA/AAA luminance contrast ratios and color harmonies across active project assets.',
    targetAppId: 'designcraft',
    isConsequential: false,
    parameters: [
      { name: 'baseHex', type: 'string', description: 'Primary brand accent color hex', required: true },
      { name: 'harmonyMode', type: 'string', description: 'Harmonic rule: analog, complementary, triadic, neutral', required: true },
    ],
  },
  {
    id: 'create_timeline_markers',
    name: 'Create SMPTE Timeline Markers (FilmCraft)',
    description: 'Generates automated timecode cuts and markers for video clip sync via FilmCraft MCP bridge.',
    targetAppId: 'filmcraft',
    isConsequential: true,
    parameters: [
      { name: 'intervalSeconds', type: 'number', description: 'Cadence interval for beat or chapter markers', required: true },
      { name: 'markerTag', type: 'string', description: 'Label category for markers', required: true },
    ],
  },
  {
    id: 'compute_sheet_summary',
    name: 'Calculate Grid Formulas (GridCraft)',
    description: 'Appends summary statistical row calculations (=SUM, =AVERAGE, =MAX) in GridCraft active spreadsheet.',
    targetAppId: 'gridcraft',
    isConsequential: true,
    parameters: [
      { name: 'columnTarget', type: 'string', description: 'Column letter (e.g. E or F)', required: true },
      { name: 'formulaType', type: 'string', description: 'Formula operation to append', required: true },
    ],
  },
];

class AIService {
  private config: AIProviderConfig = {
    mode: 'cloud',
    cloudModel: 'gemini-3.8-flash',
    localEndpoint: 'http://127.0.0.1:11434',
    localModel: 'llama3.2:latest',
    telemetryEnabled: false,
    confirmConsequentialTools: true,
    activeCloudConnected: true,
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
  ): Promise<{ text: string; proposedTool?: RegisteredTool; toolParams?: Record<string, unknown> }> {
    const lower = prompt.toLowerCase();

    // Context-aware tool recognition
    if (lower.includes('resize') || lower.includes('1080') || lower.includes('dimension') || lower.includes('presentation')) {
      const tool = REGISTERED_AI_TOOLS.find(t => t.id === 'resize_project_assets')!;
      return {
        text: `I have analyzed the current project assets in "${activeProjectName}". To prepare images for presentation delivery, I propose invoking PhotoCraft's non-destructive image transform pipeline with high-fidelity Lanczos resampling. Source files will be preserved, and new normalized copies will be generated.`,
        proposedTool: tool,
        toolParams: { targetWidth: 1920, targetHeight: 1080, preserveAspect: true, suffix: '_presentation' },
      };
    }

    if (lower.includes('vector') || lower.includes('logo') || lower.includes('shape') || lower.includes('curve') || lower.includes('svg')) {
      const tool = REGISTERED_AI_TOOLS.find(t => t.id === 'generate_vector_geometry')!;
      return {
        text: `To construct vector geometry in VectorCraft, I've computed a geometric SVG coordinate schema following the Swiss grid layout rules of the project.`,
        proposedTool: tool,
        toolParams: { shapeType: 'monogram', strokeColor: '#B7A0FF', strokeWidth: 2 },
      };
    }

    if (lower.includes('palette') || lower.includes('contrast') || lower.includes('color') || lower.includes('wcag')) {
      const tool = REGISTERED_AI_TOOLS.find(t => t.id === 'analyze_color_harmony')!;
      return {
        text: `Inspecting color palette compliance against WCAG AA requirements (minimum 4.5:1 text contrast). Evaluating palette harmony for design tokens.`,
        proposedTool: tool,
        toolParams: { baseHex: '#B7A0FF', harmonyMode: 'neutral_contrast' },
      };
    }

    if (lower.includes('marker') || lower.includes('timeline') || lower.includes('cut') || lower.includes('video') || lower.includes('film')) {
      const tool = REGISTERED_AI_TOOLS.find(t => t.id === 'create_timeline_markers')!;
      return {
        text: `Preparing SMPTE sequence markers for FilmCraft timeline sync. This command interfaces with the FilmCraft MCP bridge at 127.0.0.1:9876 to index scene transition intervals.`,
        proposedTool: tool,
        toolParams: { intervalSeconds: 30, markerTag: 'Scene Transition' },
      };
    }

    if (lower.includes('sum') || lower.includes('formula') || lower.includes('total') || lower.includes('calc') || lower.includes('grid')) {
      const tool = REGISTERED_AI_TOOLS.find(t => t.id === 'compute_sheet_summary')!;
      return {
        text: `Analyzing active spreadsheet columns in GridCraft. Preparing summary formula row with reactive recalculation graph.`,
        proposedTool: tool,
        toolParams: { columnTarget: 'E', formulaType: '=SUM(E2:E120)' },
      };
    }

    // Standard analytical response grounded in Craft ecosystem
    return {
      text: `Within Craft Workspace, the active application is ${activeAppName} on project "${activeProjectName}". You can invoke real file manipulations, vector math, color grading curves, or inspect repository status via the Command Palette (Ctrl+K). For native execution on Windows, verify your Craft Local Companion pairing.`,
    };
  }
}

export const aiService = new AIService();
