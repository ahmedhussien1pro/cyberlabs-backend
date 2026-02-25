import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PricingService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  // 1. GET /api/plans
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  // 2. GET /api/subscriptions/me
  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) return null;

    return {
      planId: sub.plan.name.toLowerCase(), // 'free', 'pro', 'team'
      status: sub.status.toLowerCase(),
      billingCycle: sub.billingCycle.toLowerCase(),
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }

  // 3. POST /api/subscriptions/checkout
  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL',
    successUrl: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: { equals: planId, mode: 'insensitive' },
        duration: billingCycle,
      },
    });

    if (!plan)
      throw new NotFoundException(
        'Plan not found for the selected billing cycle',
      );

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {},
      });
    }

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
      success_url:
        successUrl || `${this.config.get('FRONTEND_URL')}/pricing?success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        billingCycle,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  // 4. POST /api/subscriptions/portal
  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // const customerId = user?.stripeCustomerId;
    const customerId = 'cus_placeholder';

    if (!customerId)
      throw new BadRequestException('No active Stripe customer found');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.config.get('FRONTEND_URL')}/settings/billing`,
    });

    return { portalUrl: session.url };
  }

  // 5. Cancel Subscription (Manual fallback)
  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (!sub || !sub.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

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
  }
  handleStripeWebhook(rawBody: Buffer, signature: string | string[]) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.get<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        this.fulfillSubscription(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        this.updateSubscriptionStatus(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return event;
  }

  private async fulfillSubscription(session: Stripe.Checkout.Session) {
    const { userId, planId, billingCycle } = session.metadata;
    const subscriptionId = session.subscription as string;

    const stripeSub = await this.stripe.subscriptions.retrieve(subscriptionId);

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
  }

  private async updateSubscriptionStatus(stripeSub: Stripe.Subscription) {
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSub.id },
      data: {
        status: stripeSub.status.toUpperCase() as any,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        isActive:
          stripeSub.status === 'active' || stripeSub.status === 'trialing',
      },
    });
  }
}
