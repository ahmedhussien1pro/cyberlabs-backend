// src/modules/certificates/certificates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  /** User's issued (earned) certificates */
  async getUserCertificates(userId: string) {
    return this.prisma.issuedCertificate.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            ar_title: true,
            thumbnail: true,
            difficulty: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  /** Single certificate (owner only) */
  async getCertificateById(userId: string, certificateId: string) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: { id: certificateId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            ar_title: true,
            thumbnail: true,
          },
        },
      },
    });

    if (!cert || cert.userId !== userId)
      throw new NotFoundException('Certificate not found');

    return cert;
  }

  /**
   * Public certificate verification — no auth needed.
   * Used for the shareable verification page.
   */
  async verifyCertificate(verificationId: string) {
    const cert = await this.prisma.issuedCertificate.findUnique({
      where: { verificationId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        course: {
          select: { id: true, slug: true, title: true, ar_title: true },
        },
      },
    });

    if (!cert) throw new NotFoundException('Certificate not found or invalid');

    return {
      valid: cert.status === 'ACTIVE',
      status: cert.status,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      user: cert.user,
      course: cert.course,
      verificationId: cert.verificationId,
    };
  }

  /**
   * Internal helper — generates a human-readable verification ID.
   */
  private generateVerificationId(): string {
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `CL-${datePart}-${random}`;
  }

  /**
   * Issue a certificate for a COURSE completion.
   * Kept internal / legacy — prefer issuePathCertificate for path-gated certs.
   * Idempotent — safe to call multiple times.
   */
  async issueCertificate(userId: string, courseId: string) {
    const existing = await this.prisma.issuedCertificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    return this.prisma.issuedCertificate.create({
      data: {
        userId,
        courseId,
        certificateUrl: '',
        verificationId: this.generateVerificationId(),
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Issue a certificate ONLY when the user has completed every module
   * in the learning path.
   *
   * Flow:
   *  1. Collect all courseIds & labIds in the path.
   *  2. Verify each one is completed by the user.
   *  3. If all done → issue certificate against the FIRST course in the path
   *     (used as the representative courseId on IssuedCertificate).
   *  4. Idempotent — calling multiple times is safe.
   *
   * Returns the certificate record, or null if the path is not yet complete.
   */
  async issuePathCertificate(userId: string, pathId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          select: { courseId: true, labId: true },
        },
      },
    });

    if (!path || path.modules.length === 0) return null;

    // ── Verify every module is completed ───────────────────────────────
    for (const mod of path.modules) {
      if (mod.courseId) {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: mod.courseId } },
          select: { isCompleted: true },
        });
        if (!enrollment?.isCompleted) return null;
      } else if (mod.labId) {
        const labProgress = await this.prisma.userLabProgress.findUnique({
          where: { userId_labId: { userId, labId: mod.labId } },
          select: { completedAt: true },
        });
        if (!labProgress?.completedAt) return null;
      }
    }

    // ── All modules done — find representative courseId ─────────────────
    const representativeCourseId = path.modules.find((m) => m.courseId)?.courseId;
    if (!representativeCourseId) return null; // path has only labs — no cert model yet

    // ── Idempotency check ───────────────────────────────────────────────
    const existing = await this.prisma.issuedCertificate.findUnique({
      where: { userId_courseId: { userId, courseId: representativeCourseId } },
    });
    if (existing) return existing;

    return this.prisma.issuedCertificate.create({
      data: {
        userId,
        courseId: representativeCourseId,
        certificateUrl: '',
        verificationId: this.generateVerificationId(),
        status: 'ACTIVE',
      },
    });
  }
}
