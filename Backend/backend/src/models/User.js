import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    googleId: { type: String, default: "", index: true },
    authProvider: {
      type: String,
      enum: ["local", "google", "google+local"],
      default: "local",
    },
    stripeCustomerId: { type: String, default: "", index: true },
    stripeSubscriptionId: { type: String, default: "" },
    subscriptionStatus: { type: String, default: "free" },
    subscriptionCurrentPeriodEnd: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: "", select: false },
    emailVerificationExpiresAt: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: "", select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "fresher", "experience", "pro"],
      default: "free",
    },
    usagePeriod: { type: String, default: "" },
    infoUsagePeriod: { type: String, default: "" },
    infoUsage: { type: Number, default: 0 },
    usage: {
      resumeAnalysis: { type: Number, default: 0 },
      coverLetters: { type: Number, default: 0 },
      mockInterviews: { type: Number, default: 0 },
      careerAssistant: { type: Number, default: 0 },
      resumes: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
