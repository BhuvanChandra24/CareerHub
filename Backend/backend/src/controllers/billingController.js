import crypto from "node:crypto";
import mongoose from "mongoose";
import User from "../models/User.js";

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const index = part.indexOf("=");

      return index < 0
        ? ["", ""]
        : [part.slice(0, index), part.slice(index + 1)];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (
    !timestamp ||
    !signature ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
  ) {
    return false;
  }

  const signed = `${timestamp}.${rawBody.toString("utf8")}`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function stripeWebhook(req, res) {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!secret) {
    return res.status(503).json({
      message: "Stripe webhook is not configured.",
    });
  }

  if (
    !Buffer.isBuffer(req.body) ||
    !verifyStripeSignature(
      req.body,
      req.headers["stripe-signature"],
      secret
    )
  ) {
    return res.status(400).json({
      message: "Invalid Stripe webhook signature.",
    });
  }

  let event;

  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({
      message: "Invalid webhook payload.",
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object || {};
      const userId = session.client_reference_id || session.metadata?.userId;

      if (userId && mongoose.isValidObjectId(userId)) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            stripeCustomerId: String(session.customer || ""),
            stripeSubscriptionId: String(session.subscription || ""),
            subscriptionStatus: "active",
            subscriptionPlan: "pro",
          },
        });
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data?.object || {};

      const active =
        event.type !== "customer.subscription.deleted" &&
        ["active", "trialing"].includes(subscription.status);

      await User.findOneAndUpdate(
        {
          stripeCustomerId: String(subscription.customer || ""),
        },
        {
          $set: {
            stripeSubscriptionId: String(subscription.id || ""),
            subscriptionStatus: active ? "active" : "free",
            subscriptionPlan: active ? "pro" : "free",
            subscriptionCurrentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        }
      );
    }

    return res.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error.message);

    return res.status(500).json({
      message: "Webhook processing failed.",
    });
  }
}