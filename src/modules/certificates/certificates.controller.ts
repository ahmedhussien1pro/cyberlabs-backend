import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../../common/guards';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * GET /certificates/my
   * User's earned certificates.
   * MUST be defined before /:id to avoid route conflict.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyCertificates(@Request() req: any) {
    const data = await this.certificatesService.getUserCertificates(req.user.id);
    return { success: true, data };
  }

  /**
   * GET /certificates/verify/:verificationId
   * Public — no auth needed.
   * Verifies a certificate by its verification ID (shareable link).
   * MUST be defined before /:id to avoid route conflict.
   */
  @Get('verify/:verificationId')
  async verifyCertificate(
    @Param('verificationId') verificationId: string,
  ) {
    const data = await this.certificatesService.verifyCertificate(verificationId);
    return { success: true, data };
  }

  /**
   * GET /certificates/:id
   * Single certificate — owner only.
   * Defined LAST to avoid matching /my or /verify/:x.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getCertificate(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const data = await this.certificatesService.getCertificateById(req.user.id, id);
    return { success: true, data };
  }
}
