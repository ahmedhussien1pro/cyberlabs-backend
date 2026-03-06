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
   * Issue certificate when course is completed.
   * Idempotent — safe to call multiple times.
   */
  async issueCertificate(userId: string, courseId: string) {
    const existing = await this.prisma.issuedCertificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    // Generate a human-readable verification ID: CL-YYYYMMDD-RANDOM
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const verificationId = `CL-${datePart}-${random}`;

    return this.prisma.issuedCertificate.create({
      data: {
        userId,
        courseId,
        certificateUrl: '', // filled later when PDF template exists
        verificationId,
        status: 'ACTIVE',
      },
    });
  }
}
