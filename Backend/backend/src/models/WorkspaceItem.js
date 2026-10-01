import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  section: { type: String, enum: ["activities", "contacts", "companies", "roadmap", "learning"], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", maxlength: 10000 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: "Planned", maxlength: 80 },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: null },
  durationMinutes: { type: Number, min: 0, max: 100000, default: null },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });
schema.index({ user: 1, section: 1, updatedAt: -1 });
export default mongoose.model("WorkspaceItem", schema);
