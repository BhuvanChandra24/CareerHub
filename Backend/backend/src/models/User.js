import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  stripeCustomerId: { type: String, default: "", index: true },
  stripeSubscriptionId: { type: String, default: "" },
  subscriptionStatus: { type: String, default: "free" },
  subscriptionPlan: { type: String, default: "free" },
  subscriptionCurrentPeriodEnd: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
