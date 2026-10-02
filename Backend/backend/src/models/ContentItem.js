import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["article", "video", "course", "webinar"],
      default: "article",
    },
    body: { type: String, default: "", maxlength: 100000 },
    summary: { type: String, default: "", maxlength: 1000 },
    url: { type: String, default: "", maxlength: 2000 },
    published: { type: Boolean, default: false, index: true },
    plan: {
      type: String,
      enum: ["free", "fresher", "experience", "pro"],
      default: "free",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
export default mongoose.model("ContentItem", schema);
