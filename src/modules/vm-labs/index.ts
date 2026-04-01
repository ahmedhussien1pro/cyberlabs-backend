export * from './vm-labs.module';
export * from './vm-labs-orchestrator.service';
export * from './vm-labs.controller';
export * from './vm-labs.gateway';
export * from './vm-labs.types';
// Use 'export type' to satisfy isolatedModules (TS1205)
export type { IVmProvider, ProvisionResult, HealthCheckResult } from './providers/vm-provider.interface';
export { VmProviderFactory } from './providers/vm-provider.factory';
