// IVmProvider — contract every cloud/docker/custom provider MUST implement
// Adding a new provider = implement this interface + register in VmProviderFactory

export interface ProvisionResult {
  /** Internal provider instance ID (e.g. Docker container ID, DigitalOcean droplet ID) */
  externalId: string;
  /** VNC/HTTP access URL visible to the student */
  accessUrl: string;
  /** SSH host (if applicable) */
  sshHost?: string;
  /** SSH port (if applicable) */
  sshPort?: number;
  /** Actual RAM allocated in MB */
  allocatedRamMb: number;
  /** Actual vCPUs allocated */
  allocatedCpuCores: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  latencyMs?: number;
  errorMessage?: string;
}

export interface IVmProvider {
  /**
   * Spin up a new VM/container and return connection details.
   * Must be idempotent — if called twice with same externalId, return existing.
   */
  provision(params: {
    templateSlug: string;
    osType: string;
    networkMode: string;
    ramMb: number;
    cpuCores: number;
    diskGb: number;
    scenarioConfig: Record<string, unknown>;
    timeoutMin: number;
    labInstanceId: string;
  }): Promise<ProvisionResult>;

  /**
   * Gracefully stop a running instance.
   */
  stop(externalId: string): Promise<void>;

  /**
   * Permanently destroy the instance and free all resources.
   */
  destroy(externalId: string): Promise<void>;

  /**
   * Restart a stopped/errored instance (same container, fresh session).
   */
  restart(externalId: string): Promise<ProvisionResult>;

  /**
   * Ping the instance; used by the health-checker scheduler.
   */
  healthCheck(externalId: string): Promise<HealthCheckResult>;

  /**
   * Extend the instance’s TTL by the given number of minutes.
   * Returns the new expiry timestamp.
   */
  extendTTL(externalId: string, additionalMinutes: number): Promise<Date>;
}
