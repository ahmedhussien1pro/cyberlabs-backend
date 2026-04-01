import { Injectable } from '@nestjs/common';
import { VmProviderType } from '@prisma/client';
import { IVmProvider } from './vm-provider.interface';
import { DockerProvider } from './docker.provider';

/**
 * VmProviderFactory — resolves the correct IVmProvider implementation
 * for a given VmProviderType enum value.
 *
 * To add a new cloud provider:
 *   1. Create `providers/digital-ocean.provider.ts` implementing IVmProvider
 *   2. Register it in `vm-labs.module.ts` providers array
 *   3. Inject it in this factory and add a case below
 */
@Injectable()
export class VmProviderFactory {
  constructor(private readonly dockerProvider: DockerProvider) {}

  resolve(providerType: VmProviderType): IVmProvider {
    switch (providerType) {
      case VmProviderType.DOCKER_LOCAL:
        return this.dockerProvider;

      // TODO: add when DigitalOceanProvider is built
      // case VmProviderType.DIGITAL_OCEAN:
      //   return this.digitalOceanProvider;

      case VmProviderType.CUSTOM:
        // Fall through to Docker as default until custom provider is configured
        return this.dockerProvider;

      default:
        return this.dockerProvider;
    }
  }
}
