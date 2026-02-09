import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../logger';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly isDevelopment: boolean;
  private readonly MAIL_BANNER_CID = 'cyberlabs-verification-banner';
  private readonly MAIL_BANNER_PATH: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('MailService');

    // ✅ Get environment
    const appEnv = this.configService.get<string>('app.env');
    this.logger.log(`🔍 Environment: ${appEnv}`);

    // ✅ Check credentials
    const mailUsername = this.configService.get<string>('mail.username');
    const mailPassword = this.configService.get<string>('mail.password');

    this.logger.log(
      `📧 Mail Username: ${mailUsername ? '✅ Found' : '❌ Missing'}`,
    );
    this.logger.log(
      `🔐 Mail Password: ${mailPassword ? '✅ Found' : '❌ Missing'}`,
    );

    // ✅ Determine mode
    if (!mailUsername || !mailPassword || appEnv === 'development') {
      this.isDevelopment = true;
      this.logger.warn('⚠️ Running in DEVELOPMENT mode (console logging only)');
    } else {
      this.isDevelopment = false;
    }

    this.MAIL_BANNER_PATH = path.join(__dirname, 'assets', 'mail_photo.png');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (this.isDevelopment) {
      // Development mode - console logging
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      this.logger.log('📧 Mail service initialized in DEVELOPMENT mode');
    } else {
      // Production mode - Gmail SMTP
      const mailUsername = this.configService.get<string>('mail.username');
      const mailPassword = this.configService.get<string>('mail.password');

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: mailUsername,
          pass: mailPassword,
        },
      });
      this.logger.log(
        `📧 Mail service initialized in PRODUCTION mode for: ${mailUsername}`,
      );
    }
  }

  private buildBannerAttachment() {
    if (!fs.existsSync(this.MAIL_BANNER_PATH)) {
      this.logger.warn('⚠️ Mail banner not found at: ' + this.MAIL_BANNER_PATH);
      return undefined;
    }

    return {
      filename: 'mail_photo.png',
      path: this.MAIL_BANNER_PATH,
      cid: this.MAIL_BANNER_CID,
    };
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const bannerAttachment = this.buildBannerAttachment();
    const fromName = this.configService.get<string>('mail.fromName');
    const fromAddress = this.configService.get<string>('mail.fromAddress');

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(bannerAttachment ? { attachments: [bannerAttachment] } : {}),
    };

    try {
      if (this.isDevelopment) {
        console.log('\n📧 ========= EMAIL (DEV MODE) =========');
        console.log('📬 To:', options.to);
        console.log('📌 Subject:', options.subject);
        console.log('📄 HTML Preview:', options.html.substring(0, 200) + '...');

        // Extract OTP if exists
        const otpMatch = options.html.match(
          /<div[^>]*class="otp-code"[^>]*>(\d{6})<\/div>/,
        );
        if (otpMatch) {
          console.log(`\n✅ OTP: ${otpMatch[1]}\n`);
        }
        console.log('==========================================\n');
        return;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully to ${options.to}`);
      this.logger.log(`📨 Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error('❌ Email sending failed:', error.stack);

      // Log OTP even on error
      const otpMatch = options.html.match(
        /<div[^>]*class="otp-code"[^>]*>(\d{6})<\/div>/,
      );
      if (otpMatch) {
        console.log(`\n⚠️ Email failed but OTP: ${otpMatch[1]}\n`);
      }

      throw new Error('Failed to send email');
    }
  }

  /**
   * Send OTP Email for Verification
   */
  async sendOTPEmail(email: string, name: string, otp: string): Promise<void> {
    this.logger.log(`📤 Preparing to send OTP to: ${email}`);

    const bannerAttachment = this.buildBannerAttachment();
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(150deg, #0b1b3b, #114c8f); color: #f5f8ff; border-radius: 12px; overflow: hidden;">
        <div style="background: #04102c; padding: 20px 30px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">CyberLabs Verification</h1>
          <p style="margin: 8px 0 0; color: #9fb4dd;">Secure your account in just one step.</p>
        </div>
        ${
          bannerAttachment
            ? `<img src="cid:${this.MAIL_BANNER_CID}" alt="CyberLabs Email Verification" style="display: block; width: 100%; max-height: 260px; object-fit: cover;" />`
            : ''
        }
        <div style="padding: 30px;">
          <p style="margin: 0 0 15px;">Hello <strong>${name}</strong>,</p>
          <p style="margin: 0 0 20px;">Use the one-time verification code below to finish setting up your CyberLabs account:</p>
          <div class="otp-code" style="background: #0b2447; border: 1px solid #1b4b8c; padding: 18px; text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 8px; border-radius: 10px; color: #50c4ff;">
            ${otp}
          </div>
          <p style="margin: 24px 0 12px; color: #d0def5;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p>
          <p style="margin: 0; color: #9fb4dd;">— The CyberLabs Security Team</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Your Verification Code - CyberLabs',
      html,
    });
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${token}`;
    const bannerAttachment = this.buildBannerAttachment();

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(150deg, #0b1b3b, #114c8f); color: #f5f8ff; border-radius: 12px; overflow: hidden;">
        <div style="background: #04102c; padding: 20px 30px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">CyberLabs Password Reset</h1>
          <p style="margin: 8px 0 0; color: #9fb4dd;">Reset your password securely.</p>
        </div>
        ${
          bannerAttachment
            ? `<img src="cid:${this.MAIL_BANNER_CID}" alt="CyberLabs Password Reset" style="display: block; width: 100%; max-height: 260px; object-fit: cover;" />`
            : ''
        }
        <div style="padding: 30px;">
          <p style="margin: 0 0 15px;">Hello <strong>${name}</strong>,</p>
          <p style="margin: 0 0 20px;">You requested a password reset. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: #dc3545; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <p style="margin: 24px 0 12px; color: #d0def5;">This link expires in 1 hour. If you didn't request a reset, ignore this email and your password will remain unchanged.</p>
          <p style="margin: 0; color: #9fb4dd;">— The CyberLabs Security Team</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - CyberLabs',
      html,
    });
  }

  /**
   * Send Welcome Email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const bannerAttachment = this.buildBannerAttachment();

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(150deg, #0b1b3b, #114c8f); color: #f5f8ff; border-radius: 12px; overflow: hidden;">
        <div style="background: #04102c; padding: 20px 30px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">Welcome to CyberLabs! 🚀</h1>
          <p style="margin: 8px 0 0; color: #9fb4dd;">Your cybersecurity journey starts now.</p>
        </div>
        ${
          bannerAttachment
            ? `<img src="cid:${this.MAIL_BANNER_CID}" alt="Welcome to CyberLabs" style="display: block; width: 100%; max-height: 260px; object-fit: cover;" />`
            : ''
        }
        <div style="padding: 30px;">
          <p style="margin: 0 0 15px;">Hello <strong>${name}</strong>,</p>
          <p style="margin: 0 0 20px;">Welcome to CyberLabs! We're excited to have you join our community of cybersecurity enthusiasts.</p>
          <p style="margin: 0 0 12px; color: #d0def5;">Start exploring our hands-on labs and courses to level up your security skills!</p>
          <p style="margin: 0; color: #9fb4dd;">— The CyberLabs Team</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to CyberLabs! 🚀',
      html,
    });
  }
}
