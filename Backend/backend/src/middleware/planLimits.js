import User from "../models/User.js";

export const PLAN_LIMITS = {
  free: {
    resumeAnalysis: 2,
    coverLetters: 2,
    mockInterviews: 2,
    careerAssistant: 10,
    resumes: 2,
  },
  fresher: {
    resumeAnalysis: 10,
    coverLetters: 10,
    mockInterviews: 10,
    careerAssistant: 50,
    resumes: 5,
  },
  experience: {
    resumeAnalysis: 30,
    coverLetters: 30,
    mockInterviews: 30,
    careerAssistant: 150,
    resumes: 15,
  },
  pro: {
    resumeAnalysis: 100,
    coverLetters: 100,
    mockInterviews: 100,
    careerAssistant: 500,
    resumes: 30,
  },
};

function periodKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function planLimit(feature) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select(
        "subscriptionPlan usage usagePeriod",
      );
      if (!user) return res.status(404).json({ message: "User not found." });

      const plan = PLAN_LIMITS[user.subscriptionPlan]
        ? user.subscriptionPlan
        : "free";
      const period = periodKey();
      if (user.usagePeriod !== period) {
        user.usagePeriod = period;
        user.usage = {};
      }

      const limit = PLAN_LIMITS[plan][feature];
      const used = Number(user.usage?.[feature] || 0);
      if (used >= limit) {
        return res.status(429).json({
          message: `${feature} limit reached for the ${plan} plan.`,
          code: "PLAN_LIMIT_REACHED",
          feature,
          plan,
          limit,
          used,
        });
      }

      user.usage[feature] = used + 1;
      await user.save();
      req.plan = { plan, feature, limit, used: used + 1 };
      next();
    } catch (error) {
      next(error);
    }
  };
}
