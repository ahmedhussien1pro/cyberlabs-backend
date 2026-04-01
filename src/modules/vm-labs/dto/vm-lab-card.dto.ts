import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VmInstanceStatus, VmOsType, VmNetworkMode, CATEGORY, Difficulty } from '@prisma/client';

export class VmLabCardDTO {
  // ── From existing Lab model ──────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Linked practice-lab ID (optional)' })
  labId?: string;

  @ApiPropertyOptional()
  labSlug?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  ar_title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ enum: Difficulty })
  difficulty?: Difficulty;

  @ApiPropertyOptional({ enum: CATEGORY })
  category?: CATEGORY;

  @ApiProperty({ default: 0 })
  xpReward: number;

  @ApiProperty({ description: 'Estimated duration in minutes' })
  estimatedDurationMin: number;

  // ── From VmLabTemplate ──────────────────────────────────────────────────
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: VmOsType })
  osType: VmOsType;

  @ApiProperty({ enum: VmNetworkMode })
  networkMode: VmNetworkMode;

  @ApiProperty({ type: [String], description: 'Tools available in the VM (from scenarioConfig)' })
  toolsIncluded: string[];

  @ApiPropertyOptional({ description: 'Network topology from scenarioConfig' })
  networkTopology?: object;

  // ── Pool real-time status ────────────────────────────────────────────────
  @ApiProperty({ enum: ['AVAILABLE', 'QUEUED', 'AT_CAPACITY'] })
  poolStatus: 'AVAILABLE' | 'QUEUED' | 'AT_CAPACITY';

  @ApiProperty()
  availableSlots: number;

  @ApiPropertyOptional({ nullable: true, description: 'Estimated wait in minutes; null if AVAILABLE' })
  estimatedWaitMin: number | null;

  // ── Per-user state ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: VmInstanceStatus, nullable: true })
  userInstanceStatus: VmInstanceStatus | null;

  @ApiPropertyOptional({ nullable: true })
  userInstanceId: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601 UTC timestamp' })
  userInstanceExpiresAt: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0, maximum: 100 })
  userProgress: number | null;

  @ApiProperty({ default: false })
  userFlagSubmitted: boolean;
}
