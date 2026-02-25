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
import { Request, Response } from 'express';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller() // Removing 'api' here since Global Prefix 'api/v1' covers it. We map plans directly to /api/v1/plans
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  async getPlans() {
    return this.pricingService.getPlans();
  }

  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() user: any) {
    return this.pricingService.getMySubscription(user.id);
  }

  @Post('subscriptions/checkout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Body('planId') planId: string,
    @Body('billingCycle') billingCycle: 'MONTHLY' | 'YEARLY',
    @Body('successUrl') successUrl: string,
    @CurrentUser() user: any,
  ) {
    return this.pricingService.createCheckoutSession(
      user.id,
      planId,
      billingCycle,
      successUrl,
    );
  }

  @Post('subscriptions/portal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async portal(@CurrentUser() user: any) {
    return this.pricingService.createPortalSession(user.id);
  }

  @Post('subscriptions/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async cancel(@CurrentUser() user: any) {
    return this.pricingService.cancelSubscription(user.id);
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
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
      const result = this.pricingService.handleStripeWebhook(req.rawBody, signature);
      // Sending immediate response to Stripe while async process runs in background
      res.json(result);
    } catch (err: any) {
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }
  }
}
