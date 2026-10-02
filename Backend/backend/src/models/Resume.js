import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    label: { type: String, default: "Version", maxlength: 120 },
    fileName: { type: String, default: "", maxlength: 255 },
    text: { type: String, default: "", maxlength: 50000 },
    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    fileName: { type: String, default: "", maxlength: 255 },
    mimeType: { type: String, default: "" },
    text: { type: String, default: "", maxlength: 50000 },
    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    isDefault: { type: Boolean, default: false, index: true },
    versions: { type: [versionSchema], default: [] },
  },
  { timestamps: true },
);
resumeSchema.index({ user: 1, updatedAt: -1 });
export default mongoose.model("Resume", resumeSchema);
