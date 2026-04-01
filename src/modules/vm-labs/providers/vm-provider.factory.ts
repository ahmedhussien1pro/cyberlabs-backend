import { Injectable } from '@nestjs/common';
import { VmProviderType } from '@prisma/client';
import { IVmProvider } from './vm-provider.interface';
import { DockerProvider } from './docker.provider';

/**
 * VmProviderFactory — resolves the correct IVmProvider implementation
 * based on the VmProviderType enum value from the database.
 *
 * Add new providers here as the platform grows.
 */
@Injectable()
export class VmProviderFactory {
  constructor(private readonly docker: DockerProvider) {}

  /**
   * Accept VmProviderType enum OR raw string (for pool.provider values
   * that arrive as strings from Prisma JSON includes).
   */
  resolve(providerType: VmProviderType | string): IVmProvider {
    switch (providerType) {
      case VmProviderType.DOCKER_LOCAL:
      case 'DOCKER_LOCAL':
        return this.docker;

      case VmProviderType.DIGITAL_OCEAN:
      case 'DIGITAL_OCEAN':
        // TODO: inject and return DigitalOceanProvider when implemented
        throw new Error('DigitalOcean provider not yet implemented');

      case VmProviderType.CUSTOM:
      case 'CUSTOM':
        throw new Error('Custom provider requires manual registration');

      default:
        throw new Error(`Unknown VM provider type: ${String(providerType)}`);
    }
  }
}
