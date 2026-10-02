import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentItem",
      required: true,
      index: true,
    },
    percent: { type: Number, min: 0, max: 100, default: 0 },
    positionSeconds: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
    lastOpenedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ user: 1, content: 1 }, { unique: true });
export default mongoose.model("LearningProgress", schema);
