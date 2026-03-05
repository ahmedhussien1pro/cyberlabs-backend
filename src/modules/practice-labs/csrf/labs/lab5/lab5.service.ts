// src/modules/practice-labs/csrf/labs/lab5/lab5.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';
import * as crypto from 'crypto';

@Injectable()
export class Lab5Service {
  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    return this.stateService.initializeState(userId, labId);
  }

  // ❌ الثغرة: CSRF token = MD5(userId + date) — قابل للتنبؤ
  private generateCsrfToken(targetUserId: string): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return crypto
      .createHash('md5')
      .update(targetUserId + today)
      .digest('hex');
  }

  async viewProfile(userId: string, labId: string) {
    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: 'CITIZEN-001' },
    });

    return {
      success: true,
      profile: profile ? JSON.parse(profile.body) : null,
      note: 'This government portal uses CSRF tokens for protection. But are they truly secure?',
    };
  }

  async getMyToken(userId: string, labId: string) {
    const myToken = this.generateCsrfToken(userId);

    return {
      success: true,
      csrfToken: myToken,
      yourUserId: userId,
      generatedAt: new Date().toISOString().split('T')[0],
      hint: 'Study this token carefully. How was it generated? Can you predict tokens for other users?',
    };
  }

  // يحسب CSRF token لـ targetUserId
  async predictToken(userId: string, labId: string, targetUserId: string) {
    if (!targetUserId)
      throw new BadRequestException('targetUserId is required');

    const predictedToken = this.generateCsrfToken(targetUserId);

    return {
      success: true,
      targetUserId,
      predictedToken,
      algorithm: 'MD5(userId + YYYY-MM-DD)',
      date: new Date().toISOString().split('T')[0],
      note: 'Now use this token in /profile/update with targetCitizenId: "CITIZEN-001"',
    };
  }

  // ❌ الثغرة: يتحقق من CSRF token لكنه predictable
  async updateProfile(
    userId: string,
    labId: string,
    csrfToken: string,
    targetCitizenId: string,
    newAddress: string,
    newPhone: string,
  ) {
    if (!csrfToken || !targetCitizenId) {
      throw new BadRequestException(
        'csrfToken and targetCitizenId are required',
      );
    }

    // التحقق من الـ CSRF token
    const expectedToken = this.generateCsrfToken(targetCitizenId);
    if (csrfToken !== expectedToken) {
      throw new ForbiddenException({
        error: 'Invalid CSRF token',
        hint: 'Try predicting the token using /csrf/predict-token with targetUserId: "CITIZEN-001"',
      });
    }

    const profile = await this.prisma.labGenericContent.findFirst({
      where: { userId, labId, title: targetCitizenId },
    });

    if (!profile) throw new BadRequestException('Citizen profile not found');

    const profileData = JSON.parse(profile.body);
    const oldAddress = profileData.address;
    const oldPhone = profileData.phone;

    const updatedData = {
      ...profileData,
      ...(newAddress && { address: newAddress }),
      ...(newPhone && { phone: newPhone }),
    };

    await this.prisma.labGenericContent.update({
      where: { id: profile.id },
      data: { body: JSON.stringify(updatedData) },
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'CSRF',
        action: 'GOVERNMENT_PROFILE_UPDATE',
        meta: {
          targetCitizenId,
          oldAddress,
          newAddress,
          oldPhone,
          newPhone,
          tokenUsed: csrfToken,
        },
      },
    });

    const isExploited =
      targetCitizenId !== userId && csrfToken === expectedToken;

    if (isExploited) {
      return {
        success: true,
        exploited: true,
        citizenId: targetCitizenId,
        updatedProfile: updatedData,
        flag: 'FLAG{CSRF_PREDICTABLE_MD5_TOKEN_BYPASS_GOVERNMENT_DATA}',
        vulnerability: 'CSRF — Predictable CSRF Token (MD5 of userId + date)',
        impact:
          'National ID data (address, phone) of citizen ' +
          targetCitizenId +
          ' was changed without their consent. In a real government system, this enables fraud, identity theft, and misdirection of official documents.',
        exploitSteps: [
          '1. Retrieved own CSRF token → understood the MD5(userId + date) pattern',
          '2. Calculated victim\'s token: MD5("CITIZEN-001" + today)',
          '3. Used predicted token in /profile/update request',
          '4. Server validated predictable token and accepted the update',
        ],
        fix: [
          'Use cryptographically random CSRF tokens (min 128 bits): crypto.randomBytes(32)',
          'Bind tokens to specific sessions, not userId + date',
          'Make tokens single-use (rotate after each use)',
          'Use the Synchronizer Token Pattern or Double Submit Cookie Pattern correctly',
        ],
      };
    }

    return {
      success: true,
      citizenId: targetCitizenId,
      updatedProfile: updatedData,
      message: 'Profile updated',
    };
  }
}
