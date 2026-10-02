import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import { PLAN_LIMITS } from "../middleware/planLimits.js";

const router = Router();
router.use(requireAuth);

const PLAN_INFO = {
  free: { name: "Free", priceEnv: null, description: "Core career workspace." },
  fresher: {
    name: "Fresher",
    priceEnv: "STRIPE_PRICE_ID_FRESHER",
    description: "Higher AI limits for students and freshers.",
  },
  experience: {
    name: "Experience",
    priceEnv: "STRIPE_PRICE_ID_EXPERIENCE",
    description: "Higher limits for experienced professionals.",
  },
};

router.get("/plans", (_req, res) => {
  res.json({
    plans: Object.entries(PLAN_INFO).map(([id, info]) => ({
      id,
      name: info.name,
      description: info.description,
      limits: PLAN_LIMITS[id],
      configured: id === "free" || Boolean(process.env[info.priceEnv || ""]),
    })),
  });
});

router.get("/status", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "subscriptionStatus subscriptionPlan subscriptionCurrentPeriodEnd usage usagePeriod",
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      subscription: {
        status: user.subscriptionStatus || "free",
        plan: user.subscriptionPlan || "free",
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
        usage: user.usage || {},
        usagePeriod: user.usagePeriod || null,
        limits: PLAN_LIMITS[user.subscriptionPlan] || PLAN_LIMITS.free,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", async (req, res, next) => {
  try {
    const plan = String(req.body?.plan || "fresher");
    if (!["fresher", "experience"].includes(plan))
      return res.status(400).json({ message: "Choose a paid plan." });

    const secret = String(process.env.STRIPE_SECRET_KEY || "").trim();
    const priceId = String(process.env[PLAN_INFO[plan].priceEnv] || "").trim();
    if (!secret || !priceId)
      return res
        .status(503)
        .json({ message: `Stripe is not configured for the ${plan} plan.` });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const appUrl = (
      process.env.CLIENT_APP_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("success_url", `${appUrl}/billing?checkout=success&plan=${plan}`);
    body.set("cancel_url", `${appUrl}/billing?checkout=cancelled`);
    body.set("client_reference_id", user._id.toString());
    body.set("customer_email", user.email);
    body.set("line_items[0][price]", priceId);
    body.set("line_items[0][quantity]", "1");
    body.set("metadata[userId]", user._id.toString());
    body.set("metadata[plan]", plan);
    body.set("subscription_data[metadata][plan]", plan);

    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(20000),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      const error = new Error(
        data.error?.message || "Stripe could not create a checkout session.",
      );
      error.status = response.status === 401 ? 502 : response.status || 502;
      throw error;
    }
    res.json({ url: data.url, sessionId: data.id, plan });
  } catch (error) {
    next(error);
  }
});

export default router;
