import { Injectable, Logger } from '@nestjs/common';
import {
  IVmProvider,
  ProvisionResult,
  HealthCheckResult,
} from './vm-provider.interface';

/**
 * DockerProvider — local Docker-based VM provisioner.
 *
 * STUB IMPLEMENTATION:
 *   All methods are wired up and type-safe but call a real Docker daemon
 *   via the `dockerode` library once it is installed.
 *
 *   Install: npm install dockerode && npm install -D @types/dockerode
 *
 *   Then replace the TODO blocks with real Dockerode calls.
 */
@Injectable()
export class DockerProvider implements IVmProvider {
  private readonly logger = new Logger(DockerProvider.name);

  // TODO: inject ConfigService and read DOCKER_SOCKET_PATH from env
  // private docker = new Docker({ socketPath: this.configService.get('DOCKER_SOCKET_PATH', '/var/run/docker.sock') });

  async provision(params: {
    templateSlug: string;
    osType: string;
    networkMode: string;
    ramMb: number;
    cpuCores: number;
    diskGb: number;
    scenarioConfig: Record<string, unknown>;
    timeoutMin: number;
    labInstanceId: string;
  }): Promise<ProvisionResult> {
    this.logger.log(`[DockerProvider] Provisioning container for instance ${params.labInstanceId}`);

    // TODO: replace stub with Dockerode call
    // const container = await this.docker.createContainer({
    //   Image: this.resolveImage(params.osType),
    //   name: `cyberlab-${params.labInstanceId}`,
    //   HostConfig: {
    //     Memory: params.ramMb * 1024 * 1024,
    //     NanoCpus: params.cpuCores * 1e9,
    //     NetworkMode: params.networkMode === 'ISOLATED' ? 'none' : 'bridge',
    //   },
    //   Labels: { 'cyberlab.instanceId': params.labInstanceId },
    // });
    // await container.start();
    // const info = await container.inspect();

    return {
      externalId: `stub-${params.labInstanceId}`,
      accessUrl: `http://localhost:6080/vnc/${params.labInstanceId}`,
      allocatedRamMb: params.ramMb,
      allocatedCpuCores: params.cpuCores,
    };
  }

  async stop(externalId: string): Promise<void> {
    this.logger.log(`[DockerProvider] Stopping container ${externalId}`);
    // TODO: await this.docker.getContainer(externalId).stop();
  }

  async destroy(externalId: string): Promise<void> {
    this.logger.log(`[DockerProvider] Destroying container ${externalId}`);
    // TODO:
    // const c = this.docker.getContainer(externalId);
    // try { await c.stop(); } catch {}
    // await c.remove({ force: true });
  }

  async restart(externalId: string): Promise<ProvisionResult> {
    this.logger.log(`[DockerProvider] Restarting container ${externalId}`);
    // TODO: await this.docker.getContainer(externalId).restart();
    return {
      externalId,
      accessUrl: `http://localhost:6080/vnc/${externalId}`,
      allocatedRamMb: 2048,
      allocatedCpuCores: 2,
    };
  }

  async healthCheck(externalId: string): Promise<HealthCheckResult> {
    // TODO:
    // const info = await this.docker.getContainer(externalId).inspect();
    // return { healthy: info.State.Running };
    return { healthy: true, latencyMs: 0 };
  }

  async extendTTL(_externalId: string, additionalMinutes: number): Promise<Date> {
    // Docker has no native TTL; extension is managed in the DB (VmLabInstance.expiresAt)
    // The orchestrator handles DB update; this method is a no-op for Docker.
    const newExpiry = new Date(Date.now() + additionalMinutes * 60 * 1000);
    return newExpiry;
  }
}
