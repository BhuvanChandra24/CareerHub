import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feature: { type: String, required: true, trim: true, maxlength: 120 },
    path: { type: String, default: "", maxlength: 300 },
    action: { type: String, default: "view", maxlength: 80 },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: Date.now },
    durationSeconds: { type: Number, min: 0, max: 86400, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);
schema.index({ user: 1, createdAt: -1 });
export default mongoose.model("UsageEvent", schema);
