// src/modules/pricing/pricing.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  RawBodyRequest,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { Request, Response } from 'express';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

// ── DTO ──────────────────────────────────────────────────────────────
class CheckoutDto {
  @IsString()
  planId: string;

  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';

  @IsOptional()
  @IsString()
  successUrl?: string;
}

@Controller()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // ── Public — no JWT needed ────────────────────────────────────────
  @Public()
  @Get('plans')
  async getPlans() {
    return this.pricingService.getPlans();
  }

  // ── Protected routes ──────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('subscriptions/me')
  async getMySubscription(@CurrentUser() user: any) {
    return this.pricingService.getMySubscription(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('subscriptions/checkout')
  async checkout(@Body() dto: CheckoutDto, @CurrentUser() user: any) {
    return this.pricingService.createCheckoutSession(
      user.id,
      dto.planId,
      dto.billingCycle,
      dto.successUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('subscriptions/portal')
  async portal(@CurrentUser() user: any) {
    return this.pricingService.createPortalSession(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('subscriptions/cancel')
  async cancel(@CurrentUser() user: any) {
    return this.pricingService.cancelSubscription(user.id);
  }

  // ── Stripe Webhook — Public (verified by signature) ───────────────
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const signature = req.headers['stripe-signature'] as string;

    if (!req.rawBody) {
      throw new BadRequestException(
        'Raw body is missing. Ensure rawBody is enabled in main.ts',
      );
    }

    try {
      const result = this.pricingService.handleStripeWebhook(
        req.rawBody,
        signature,
      );
      res.json(result);
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }
  }
}
