import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { db } from "../lib/firebaseAdmin";
import type { PMSubscriptionDoc, PMTier } from "../types";

const TIER_FEES: Record<PMTier, number> = {
  starter: 40,
  growth: 80,
  mega: 400,
};

const TIER_NAMES: Record<PMTier, string> = {
  starter: "Starter Grid",
  growth: "Growth Grid",
  mega: "Mega Grid",
};

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

function isValidTier(t: unknown): t is PMTier {
  return t === "starter" || t === "growth" || t === "mega";
}

/**
 * Handles PayPal IPN (Instant Payment Notification) webhooks
 * Set up PayPal IPN to POST to: https://your-project.cloudfunctions.net/paypalWebhook
 *
 * PayPal will send notifications when payments are completed.
 * This function processes successful payments and creates/updates subscription records.
 */
export const paypalWebhook = onRequest(
  { region: "us-central1", cors: true },
  async (request, response) => {
    // Only accept POST requests
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // PayPal sends data as form-encoded
      const data = request.body;

      logger.info("PayPal webhook received:", { txnType: data.txn_type });

      // Handle different PayPal transaction types
      if (data.txn_type === "web_accept" || data.txn_type === "subscr_signup") {
        // These are subscription-related
        await handlePayPalPayment(data);
      } else if (data.txn_type === "subscr_payment") {
        // Recurring payment
        logger.info("Recurring payment received from PayPal", { customData: data.custom });
      }

      // Always acknowledge receipt to PayPal
      response.status(200).send("OK");
    } catch (error) {
      logger.error("PayPal webhook error:", error);
      // Still return 200 so PayPal stops retrying
      // Log the error for manual review
      response.status(200).send("Error processed");
    }
  }
);

/**
 * Process successful PayPal payment and create PM subscription
 */
async function handlePayPalPayment(data: any) {
  const {
    custom, // Should contain: tier|pmId|propertyName|addressLine1|city|state|zip
    mc_gross, // Amount charged
    payment_status,
    txn_id, // PayPal transaction ID
  } = data;

  // Only process completed payments
  if (payment_status !== "Completed") {
    logger.info(`Skipping payment with status: ${payment_status}`);
    return;
  }

  if (!custom) {
    throw new Error("Missing custom data in PayPal payload");
  }

  // Parse custom data format: tier|pmId|propertyName|addressLine1|city|state|zip
  const parts = custom.split("|");
  const tier = parts[0] as PMTier;
  const pmId = parts[1];
  const propertyName = parts[2] || null;
  const addressLine1 = parts[3] || null;
  const city = parts[4] || null;
  const state = parts[5] || null;
  const zip = parts[6] || null;

  if (!isValidTier(tier) || !pmId) {
    throw new Error(`Invalid custom data: ${custom}`);
  }

  const expectedAmount = TIER_FEES[tier];
  const receivedAmount = parseFloat(mc_gross);

  if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
    throw new Error(
      `Amount mismatch: expected ${expectedAmount}, got ${receivedAmount}`
    );
  }

  logger.info(`Processing PayPal payment for PM ${pmId}, tier ${tier}`);

  const now = Date.now();
  const expiresAt = now + MS_PER_YEAR;

  // Fetch PM user doc for display name
  const userSnap = await db.collection("users").doc(pmId).get();
  const userData = userSnap.data();

  // Create or update subscription
  const subscriptionRef = db.collection("pmSubscriptions").doc(pmId);
  const subscriptionData: PMSubscriptionDoc = {
    uid: pmId,
    active: true,
    tier,
    tierExpiresAt: expiresAt,
    entitlements: [
      {
        propertyId: "", // Will be populated if property was added
        address: propertyName || "Property",
        paidUnits: 1,
        squarePaymentId: `paypal-${txn_id}`, // Store PayPal txn ID
        amountPaid: receivedAmount,
        paidAt: now,
      },
    ],
    totalPaid: receivedAmount,
    updatedAt: now,
    squareCustomerId: `paypal-${pmId}`, // Reference for PayPal
    squareCardId: txn_id, // Use transaction ID as reference
  };

  await subscriptionRef.set(subscriptionData, { merge: true });

  // Create property if details were provided
  if (propertyName && addressLine1 && city && state && zip) {
    const propertyId = `prop_${now}`;
    const propertyRef = db.collection("properties").doc(propertyId);

    await propertyRef.set({
      id: propertyId,
      ownerId: pmId,
      name: propertyName,
      addressLine1,
      addressLine2: "",
      city,
      state,
      zip,
      photos: [],
      amenities: [],
      unitIds: [],
      createdAt: now,
    });

    // Update subscription with property entitlement
    await subscriptionRef.update({
      entitlements: [
        {
          propertyId,
          address: `${addressLine1}, ${city}, ${state} ${zip}`,
          paidUnits: 1,
          squarePaymentId: `paypal-${txn_id}`,
          amountPaid: receivedAmount,
          paidAt: now,
        },
      ],
    });
  }

  logger.info(`Subscription created for PM ${pmId}:`, {
    tier,
    txnId: txn_id,
    expiresAt: new Date(expiresAt).toISOString(),
  });
}

/**
 * SETUP INSTRUCTIONS for PayPal IPN:
 *
 * 1. Go to PayPal Developer Dashboard: https://developer.paypal.com
 * 2. Select your app/account and go to Settings > IPN Settings
 * 3. Add this URL as your IPN endpoint:
 *    https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/paypalWebhook
 *
 * 4. In your PayPal hosted button settings, under "Advanced", set:
 *    - Return URL: https://yourdomain.com/pm/checkout/success
 *    - Notify URL: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/paypalWebhook
 *    - Custom field (optional): tier|pmId|propertyName|addressLine1|city|state|zip
 *
 * 5. When setting up checkout, pass custom data in this format:
 *    tier|userId|propertyName|address|city|state|zip
 *    e.g., "growth|user123|Maple St Apts|123 Maple|Springfield|IL|62701"
 */
