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
import { SubscriptionDuration } from '@prisma/client';

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
      this.logger.warn('STRIPE_SECRET_KEY is not defined. Pricing features will fail.');
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
    successUrl: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Prevent multiple active subscriptions
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });
    if (activeSub) {
      throw new ConflictException('You already have an active subscription. Please manage it via the billing portal.');
    }

    const durationEnum =
      billingCycle === 'YEARLY'
        ? SubscriptionDuration.YEARLY
        : SubscriptionDuration.MONTHLY;

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: { equals: planId, mode: 'insensitive' },
        duration: durationEnum,
        isActive: true, // Only allow checkout for active plans
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
        throw new BadRequestException('Payment service is currently unavailable');
      }
    }

    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
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

    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${frontendUrl}/settings/billing`,
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
      include: { plan: true }
    });

    if (!sub || !sub.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
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
      throw new BadRequestException('Failed to cancel subscription with payment provider');
    }
  }

  handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Process asynchronously to respond to Stripe quickly and prevent timeouts
    this.processWebhookEvent(event).catch(err => {
      this.logger.error(`Error processing webhook event ${event.type}: ${err.message}`);
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

    if (!userId || !planId || !subscriptionId) {
      this.logger.error('Missing metadata or subscription ID in checkout session');
      return;
    }

    try {
      // Type casting as any to bypass exact Stripe API version mismatch
      // But preserving functionality
      const stripeSub = await this.stripe.subscriptions.retrieve(subscriptionId) as any;

      // Idempotency check: Ensure we don't process the same subscription twice
      const existing = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (existing) {
        this.logger.log(`Subscription ${subscriptionId} already fulfilled`);
        return;
      }

      // Inactivate any previous subscriptions for this user
      await this.prisma.subscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, status: 'CANCELED' }
      });

      await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId: subscriptionId,
          status: 'ACTIVE',
          billingCycle: billingCycle as any,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          isActive: true,
        },
      });
    } catch (error: any) {
      this.logger.error(`Error fulfilling subscription: ${error.message}`);
      throw error;
    }
  }

  private async updateSubscriptionStatus(stripeSub: Stripe.Subscription) {
    try {
      const existing = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id }
      });

      if (!existing) {
        this.logger.warn(`Received webhook for unknown subscription: ${stripeSub.id}`);
        return;
      }

      // Type cast to any to handle Stripe typings issue across versions
      const anyStripeSub = stripeSub as any;
      const isActive = anyStripeSub.status === 'active' || anyStripeSub.status === 'trialing';

      await this.prisma.subscription.update({
        where: { id: existing.id }, // Using internal DB id is safer
        data: {
          status: anyStripeSub.status.toUpperCase() as any,
          currentPeriodEnd: new Date(anyStripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: anyStripeSub.cancel_at_period_end,
          isActive: isActive,
        },
      });
    } catch (error: any) {
      this.logger.error(`Error updating subscription status: ${error.message}`);
      throw error;
    }
  }
}
