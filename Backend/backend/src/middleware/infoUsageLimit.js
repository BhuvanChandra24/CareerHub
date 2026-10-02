import User from "../models/User.js";

function periodKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function infoUsageLimit(req, res, next) {
  User.findById(req.user.id)
    .select("subscriptionPlan infoUsage infoUsagePeriod")
    .then(async (user) => {
      if (!user) return res.status(404).json({ message: "User not found." });
      const period = periodKey();
      if (user.infoUsagePeriod !== period) {
        user.infoUsagePeriod = period;
        user.infoUsage = 0;
      }
      const plan = user.subscriptionPlan || "free";
      const used = Number(user.infoUsage || 0);
      if (plan === "free" && used >= 5) {
        return res.status(429).json({
          message:
            "You have used the 5 free information accesses for this month. Please subscribe to continue.",
          code: "INFO_USAGE_LIMIT_REACHED",
          used,
          limit: 5,
          plan,
        });
      }
      user.infoUsage = used + 1;
      await user.save();
      req.infoUsage = {
        used: user.infoUsage,
        limit: plan === "free" ? 5 : null,
        plan,
      };
      next();
    })
    .catch(next);
}
