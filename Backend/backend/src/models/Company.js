import mongoose from "mongoose";

const openingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    location: { type: String, default: "", maxlength: 160 },
    type: { type: String, default: "", maxlength: 80 },
    status: {
      type: String,
      enum: ["Open", "Closed", "Filled", "Archived"],
      default: "Open",
    },
    url: { type: String, default: "", maxlength: 1000 },
    openedAt: { type: Date, default: null },
    notes: { type: String, default: "", maxlength: 3000 },
  },
  { timestamps: true },
);

const companySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    website: { type: String, default: "", maxlength: 1000 },
    industry: { type: String, default: "", maxlength: 120 },
    location: { type: String, default: "", maxlength: 160 },
    notes: { type: String, default: "", maxlength: 5000 },
    openings: { type: [openingSchema], default: [] },
  },
  { timestamps: true },
);

companySchema.index({ user: 1, name: 1 });
export default mongoose.model("Company", companySchema);
