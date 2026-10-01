import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config.js";
import { asyncHandler } from "../utils.js";

function makeToken(user) {
  return jwt.sign({ id: user._id.toString(), email: user.email, fullName: user.fullName }, config.jwtSecret, { expiresIn: "7d" });
}
function publicUser(user) {
  return { id: user._id.toString(), fullName: user.fullName, email: user.email };
}

export const signup = asyncHandler(async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (fullName.length < 2) return res.status(400).json({ message: "Enter your full name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "An account with this email already exists." });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ fullName, email, passwordHash });
  res.status(201).json({ message: "Account created successfully.", token: makeToken(user), user: publicUser(user) });
});

export const signin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }
  res.json({ message: "Signed in successfully.", token: makeToken(user), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: publicUser(user) });
});
