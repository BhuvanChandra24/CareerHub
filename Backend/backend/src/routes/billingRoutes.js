import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();
router.use(requireAuth);

router.get("/status", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("subscriptionStatus subscriptionPlan subscriptionCurrentPeriodEnd");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ subscription: {
      status: user.subscriptionStatus || "free",
      plan: user.subscriptionPlan || "free",
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
    }});
  } catch (error) { next(error); }
});

router.post("/checkout", async (req, res, next) => {
  try {
    const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
    const priceId = (process.env.STRIPE_PRICE_ID_PRO || "").trim();
    if (!secret || !priceId) return res.status(503).json({ message: "Stripe billing is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO to Backend/backend/.env." });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const appUrl = (process.env.CLIENT_APP_URL || "http://localhost:5173").replace(/\/$/, "");
    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("success_url", `${appUrl}/billing?checkout=success`);
    body.set("cancel_url", `${appUrl}/billing?checkout=cancelled`);
    body.set("client_reference_id", user._id.toString());
    body.set("customer_email", user.email);
    body.set("line_items[0][price]", priceId);
    body.set("line_items[0][quantity]", "1");
    body.set("metadata[userId]", user._id.toString());
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      const error = new Error(data.error?.message || "Stripe could not create a checkout session.");
      error.status = response.status === 401 ? 502 : (response.status || 502);
      throw error;
    }
    res.json({ url: data.url, sessionId: data.id });
  } catch (error) { next(error); }
});

export default router;
