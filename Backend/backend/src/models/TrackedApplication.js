import mongoose from "mongoose";

const statusValues = ["Draft", "Applied", "Interview", "Offer", "Rejected", "Expired", "Archived"];
const activitySchema = new mongoose.Schema({
  type: { type: String, default: "note", maxlength: 60 },
  note: { type: String, default: "", maxlength: 3000 },
  date: { type: Date, default: Date.now }
}, { _id: false });
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 160 },
  jobTitle: { type: String, required: true, trim: true, maxlength: 180 },
  jobDescription: { type: String, default: "", maxlength: 20000 },
  applicationDate: { type: Date, default: Date.now },
  deadline: { type: Date, default: null },
  source: { type: String, default: "", maxlength: 160 },
  location: { type: String, default: "", maxlength: 160 },
  status: { type: String, enum: statusValues, default: "Draft", index: true },
  notes: { type: String, default: "", maxlength: 5000 },
  activityHistory: { type: [activitySchema], default: [] }
}, { timestamps: true });
schema.index({ user: 1, updatedAt: -1 });
export default mongoose.model("TrackedApplication", schema);
