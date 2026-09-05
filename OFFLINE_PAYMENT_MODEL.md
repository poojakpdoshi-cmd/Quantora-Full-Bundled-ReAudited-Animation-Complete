# Quantora Offline-Payment Model

Quantora does **not** collect online payments. The application contains no Razorpay, Stripe, UPI, card, QR-payment, payment-link, or payment-webhook integration.

## Operating model

The administrator collects money outside Quantora using the business's chosen offline process. After the offline payment is confirmed, an authorized administrator opens the admin panel and uses **Manual Offline Tokens** to assign a token package or add a specific token amount to the user account.

Every grant requires a reason or offline reference, uses an idempotency key, is rate-limited, and is recorded in the token transaction and audit ledgers. The user sees only their token balance and token activity; they do not receive a payment form or online checkout flow.

| Action | Available in Quantora | Notes |
|---|---:|---|
| Admin assigns Starter, Pro, or Business tokens | Yes | Manual admin action only |
| Admin adds a custom token bonus | Yes | Requires a positive amount and reason |
| User pays by card inside Quantora | No | Deliberately excluded |
| User pays by UPI or QR inside Quantora | No | Deliberately excluded |
| Razorpay or Stripe integration | No | No provider credentials or runtime code |
| WhatsApp order enquiry | Yes | Communication and manual follow-up only; no payment collection |

## Release verification

Before release, search authored source and configuration for payment-provider identifiers and confirm that only the words explaining the **absence** of online payment remain. Apply the Supabase migrations, configure Gmail and AI provider secrets, and test one manual token grant with a non-production account. Never place offline payment records, passwords, API keys, or tokens in client source files.
