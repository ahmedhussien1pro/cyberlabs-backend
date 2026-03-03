// src/modules/pricing/pricing.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { BillingCycle, SubscriptionDuration } from '@prisma/client';

@Injectable()
export class PricingService {
  private stripe: Stripe;
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not defined. Pricing features will fail.',
      );
    }
    this.stripe = new Stripe(stripeKey || 'dummy_key', {
      apiVersion: '2023-10-16' as any,
    });
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });

    if (!sub) return null;

    return {
      planId: sub.plan.name.toLowerCase(),
      status: sub.status.toLowerCase(),
      billingCycle: sub.billingCycle.toLowerCase(),
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }

  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'YEARLY',
    successUrl?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });
    if (activeSub) {
      throw new ConflictException(
        'You already have an active subscription. Please manage it via the billing portal.',
      );
    }

    const durationEnum =
      billingCycle === 'YEARLY'
        ? SubscriptionDuration.YEARLY
        : SubscriptionDuration.MONTHLY;

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: { equals: planId, mode: 'insensitive' },
        duration: durationEnum,
        isActive: true,
      },
    });

    if (!plan || !plan.stripePriceId) {
      throw new NotFoundException('Plan or Stripe Price ID not found');
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      try {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await this.prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      } catch (error: any) {
        this.logger.error(`Failed to create Stripe customer: ${error.message}`);
        throw new BadRequestException(
          'Payment service is currently unavailable',
        );
      }
    }

    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: successUrl || `${frontendUrl}/pricing?success=true`,
        cancel_url: `${frontendUrl}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          planId: plan.id,
          billingCycle,
        },
      });

      return { checkoutUrl: session.url, sessionId: session.id };
    } catch (error: any) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException('Could not initiate checkout session');
    }
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const customerId = user?.stripeCustomerId;

    if (!customerId) {
      throw new BadRequestException('No active Stripe customer found');
    }

    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        // ✅ FIXED: كانت /settings/billing → الآن الصفحة الصح
        return_url: `${frontendUrl}/dashboard/settings?tab=billing`,
      });
      return { portalUrl: session.url };
    } catch (error: any) {
      this.logger.error(`Failed to create portal session: ${error.message}`);
      throw new BadRequestException('Could not open billing portal');
    }
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
    });

    if (!sub) {
      throw new BadRequestException('No active subscription found');
    }

    // ✅ FIXED: لو الاشتراك seeded/manual (بدون stripeSubscriptionId)
    // نحدّث الـ DB مباشرة بدون محاولة الاتصال بـ Stripe
    if (!sub.stripeSubscriptionId) {
      this.logger.warn(
        `Subscription ${sub.id} has no stripeSubscriptionId — updating DB only`,
      );
      const updatedSub = await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { cancelAtPeriodEnd: true },
        include: { plan: true },
      });
      return {
        planId: updatedSub.plan.name.toLowerCase(),
        status: updatedSub.status.toLowerCase(),
        billingCycle: updatedSub.billingCycle.toLowerCase(),
        currentPeriodEnd: updatedSub.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd,
      };
    }

    try {
      await this.stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      const updatedSub = await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { cancelAtPeriodEnd: true },
        include: { plan: true },
      });

      return {
        planId: updatedSub.plan.name.toLowerCase(),
        status: updatedSub.status.toLowerCase(),
        billingCycle: updatedSub.billingCycle.toLowerCase(),
        currentPeriodEnd: updatedSub.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd,
      };
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException(
        'Failed to cancel subscription with payment provider',
      );
    }
  }

  handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    this.logger.log('🎣 Stripe webhook received');
    this.logger.log(`📝 Signature: ${signature?.substring(0, 20)}...`);
    this.logger.log(`📦 Body length: ${rawBody?.length} bytes`);

    if (!webhookSecret) {
      this.logger.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
      this.logger.log(`✅ Webhook verified: ${event.type}`);
      this.logger.log(`📄 Event ID: ${event.id}`);
    } catch (err: any) {
      this.logger.error(
        `❌ Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`⚙️  Processing event: ${event.type}`);

    this.processWebhookEvent(event).catch((err) => {
      this.logger.error(
        `❌ Error processing webhook event ${event.type}: ${err.message}`,
        err.stack,
      );
    });

    return { received: true };
  }

  private async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.fulfillSubscription(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.updateSubscriptionStatus(subscription);
        break;
      }
    }
  }

  private async fulfillSubscription(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};
    const { userId, planId, billingCycle } = metadata;
    const subscriptionId = session.subscription as string;

    this.logger.log('💳 Fulfilling subscription...');
    this.logger.log(`   User ID: ${userId}`);
    this.logger.log(`   Plan ID: ${planId}`);
    this.logger.log(`   Billing: ${billingCycle}`);
    this.logger.log(`   Sub ID:  ${subscriptionId}`);

    if (!userId || !planId || !subscriptionId) {
      this.logger.error(
        '❌ Missing metadata or subscription ID in checkout session',
      );
      this.logger.error(`   Session: ${JSON.stringify(session, null, 2)}`);
      return;
    }

    try {
      const stripeSub = (await this.stripe.subscriptions.retrieve(
        subscriptionId,
      )) as any;

      const existing = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (existing) {
        this.logger.log(`✅ Subscription ${subscriptionId} already fulfilled`);
        return;
      }

      const dbBillingCycle: BillingCycle =
        billingCycle === 'YEARLY' ? BillingCycle.ANNUAL : BillingCycle.MONTHLY;

      this.logger.log(`   Mapped billing cycle: ${dbBillingCycle}`);

      const deactivated = await this.prisma.subscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, status: 'CANCELED' as any },
      });

      this.logger.log(
        `   Deactivated ${deactivated.count} old subscription(s)`,
      );

      const newSub = await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId: subscriptionId,
          status: 'ACTIVE' as any,
          billingCycle: dbBillingCycle,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          isActive: true,
        },
      });

      this.logger.log(`✅ Subscription fulfilled for user ${userId}`);
      this.logger.log(`   DB ID: ${newSub.id}`);
    } catch (error: any) {
      this.logger.error(`❌ Error fulfilling subscription: ${error.message}`);
      this.logger.error(`   Stack: ${error.stack}`);
      throw error;
    }
  }

  private async updateSubscriptionStatus(stripeSub: Stripe.Subscription) {
    try {
      const existing = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id },
      });

      if (!existing) {
        this.logger.warn(
          `Received webhook for unknown subscription: ${stripeSub.id}`,
        );
        return;
      }

      const anyStripeSub = stripeSub as any;
      const isActive =
        anyStripeSub.status === 'active' || anyStripeSub.status === 'trialing';

      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: anyStripeSub.status.toUpperCase() as any,
          currentPeriodEnd: new Date(anyStripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: anyStripeSub.cancel_at_period_end,
          isActive,
        },
      });
    } catch (error: any) {
      this.logger.error(`Error updating subscription status: ${error.message}`);
      throw error;
    }
  }
}
