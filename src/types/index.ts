export type AppCategory = 
  | 'visual' 
  | 'video_audio' 
  | 'design_publishing' 
  | 'technical_data' 
  | 'platform_services' 
  | 'developer_infra';

export type AppRuntime = 
  | 'wasm_canvas' 
  | 'native_desktop' 
  | 'cli_headless' 
  | 'mcp_service' 
  | 'cloud_service' 
  | 'infra_tool';

export type IntegrationStatus = 
  | 'not_inspected' 
  | 'inspected' 
  | 'build_attempted' 
  | 'build_passed' 
  | 'smoke_test_passed' 
  | 'integration_in_progress' 
  | 'integrated_verified' 
  | 'blocked' 
  | 'unsupported_in_environment';

export interface CraftApp {
  id: string;
  name: string;
  repoName: string;
  repoUrl: string;
  category: AppCategory;
  tagline: string;
  description: string;
  version: string;
  license: string;
  edition: string;
  cratesCount: number;
  crates: string[];
  apps: string[];
  hasDesktop: boolean;
  hasWasm: boolean;
  hasCli: boolean;
  hasMcp: boolean;
  supportedFormats: string[];
  status: IntegrationStatus;
  statusNotes: string;
  cliCommand?: string;
  mcpBridge?: string;
  color: string;
  isPilot?: boolean;
}

export type AssetType = 
  | 'raster_image' 
  | 'vector_graphic' 
  | 'video_clip' 
  | 'audio_track' 
  | 'document' 
  | 'pdf' 
  | 'cad_drawing' 
  | 'spreadsheet' 
  | 'presentation' 
  | 'font';

export interface ProjectAsset {
  id: string;
  name: string;
  type: AssetType;
  extension: string;
  sizeBytes: number;
  updatedAt: string;
  compatibleAppId: string;
  thumbnailUrl?: string;
  dimensions?: string;
  contentData?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  createdAt: string;
  activeAppId: string;
  assets: ProjectAsset[];
}

export type AIMode = 'cloud' | 'local';

export interface AIProviderConfig {
  mode: AIMode;
  cloudModel: string;
  localEndpoint: string;
  localModel: string;
  telemetryEnabled: boolean;
  confirmConsequentialTools: boolean;
  activeCloudConnected: boolean;
  activeLocalConnected: boolean;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  mode: AIMode;
  toolCall?: {
    id: string;
    toolName: string;
    parameters: Record<string, unknown>;
    status: 'proposed' | 'approved' | 'executed' | 'rejected' | 'failed';
    result?: string;
  };
}

export interface CompanionState {
  connected: boolean;
  port: number;
  version: string;
  os: string;
  tokenPaired: boolean;
  registeredToolsCount: number;
  lastHeartbeat: string | null;
  allowlistedCommands: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  title: string;
  appId: string;
  details: string;
  type: 'file_edit' | 'tool_exec' | 'export' | 'pairing';
}
