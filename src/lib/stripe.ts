import Stripe from 'stripe';
import { AppError } from './appError';

let stripeInstance: Stripe | null = null;

// Constructed lazily (only when a payment route actually runs), not at module
// load — Stripe's SDK validates the API key eagerly in its constructor, and an
// unset STRIPE_SECRET_KEY (before real keys are added) would otherwise crash
// every route that imports this file, including `next build`'s page-data pass.
export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new AppError('Stripe is not configured (missing STRIPE_SECRET_KEY)', 500);
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}
