export interface AdapterHealth {
  healthy: boolean;
  detail: string;
}

export interface AdapterCapability {
  id: string;
  description: string;
  consequential: boolean;
  validate?: (args: Record<string, unknown>) => boolean;
}

export interface AdapterExecutionResult {
  success: boolean;
  summary: string;
  outputFiles?: string[];
  data?: unknown;
}

export interface CraftAdapter {
  appId: string;
  version: string;
  capabilities: readonly AdapterCapability[];
  healthCheck(): Promise<AdapterHealth>;
  execute(capabilityId: string, args: Record<string, unknown>): Promise<AdapterExecutionResult>;
}

const adapters = new Map<string, CraftAdapter>();

/** Register only adapters implemented against a documented upstream interface. */
export function registerAdapter(adapter: CraftAdapter): void {
  if (!adapter.appId.trim()) throw new Error('Adapter appId is required.');
  if (adapters.has(adapter.appId)) throw new Error('An adapter is already registered for ' + adapter.appId + '.');
  const ids = adapter.capabilities.map((capability) => capability.id);
  if (ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error('Adapter capabilities must have unique, non-empty identifiers.');
  }
  adapters.set(adapter.appId, adapter);
}

export function unregisterAdapter(appId: string): void {
  adapters.delete(appId);
}

export function getAdapter(appId: string): CraftAdapter | undefined {
  return adapters.get(appId);
}

export function listRegisteredAdapters(): Array<{ appId: string; version: string; capabilities: string[] }> {
  return [...adapters.values()].map((adapter) => ({
    appId: adapter.appId,
    version: adapter.version,
    capabilities: adapter.capabilities.map((capability) => capability.id),
  }));
}

/**
 * Fail closed: an unknown app, unknown capability, invalid arguments, or malformed
 * result never becomes a reported successful operation.
 */
export async function executeAdapterCapability(
  appId: string,
  capabilityId: string,
  args: Record<string, unknown>,
): Promise<AdapterExecutionResult> {
  const adapter = adapters.get(appId);
  if (!adapter) throw new Error('No verified adapter is registered for ' + appId + '. No operation was executed.');

  const capability = adapter.capabilities.find((item) => item.id === capabilityId);
  if (!capability) throw new Error('Capability ' + capabilityId + ' is not registered for ' + appId + '. No operation was executed.');

  if (capability.validate && !capability.validate(args)) {
    throw new Error('Arguments failed validation for capability ' + capabilityId + '. No operation was executed.');
  }

  const health = await adapter.healthCheck();
  if (!health.healthy) throw new Error('Adapter health check failed for ' + appId + ': ' + health.detail);

  const result = await adapter.execute(capabilityId, args);
  if (!result || typeof result.success !== 'boolean' || typeof result.summary !== 'string') {
    throw new Error('Adapter returned an invalid result for ' + capabilityId + '. Success cannot be assumed.');
  }
  return result;
}
