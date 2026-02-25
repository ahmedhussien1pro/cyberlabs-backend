import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Req, Res, RawBodyRequest } from '@nestjs/common';
import { Request, Response } from 'express';

import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api')
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
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Body('planId') planId: string,
    @Body('billingCycle') billingCycle: 'MONTHLY' | 'ANNUAL',
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
  @UseGuards(JwtAuthGuard)
  async portal(@CurrentUser() user: any) {
    return this.pricingService.createPortalSession(user.id);
  }

  @Post('subscriptions/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@CurrentUser() user: any) {
    return this.pricingService.cancelSubscription(user.id);
  }
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const signature = req.headers['stripe-signature'];

    try {
      const event = this.pricingService.handleStripeWebhook(
        req.rawBody,
        signature,
      );
      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
