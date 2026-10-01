import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  jobId: { type: String, required: true },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  experience: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  portfolio: { type: String, default: "" },
  coverLetter: { type: String, default: "" },
  resumePath: { type: String, required: true },
  resumeOriginalName: { type: String, default: "" },
  status: { type: String, enum: ["submitted", "reviewing", "closed"], default: "submitted" }
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);
