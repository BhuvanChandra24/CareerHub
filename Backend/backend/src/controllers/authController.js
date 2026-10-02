import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/User.js";
import { config } from "../config.js";
import { asyncHandler } from "../utils.js";

function makeToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    },
    config.jwtSecret,
    { expiresIn: "7d" },
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
  };
}

export const googleSignin = asyncHandler(async (req, res) => {
  const credential = String(req.body?.credential || "").trim();
  if (!credential)
    return res.status(400).json({ message: "Google credential is required." });
  if (!config.googleClientId)
    return res
      .status(503)
      .json({ message: "Google Sign-In is not configured on the server." });

  let profile;
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("Google token verification failed.");
    if (
      data.aud !== config.googleClientId ||
      data.email_verified !== "true" ||
      !data.email
    )
      throw new Error("Google account verification failed.");
    profile = data;
  } catch (error) {
    return res
      .status(401)
      .json({
        message: error.message || "Google account verification failed.",
      });
  }

  const email = String(profile.email).trim().toLowerCase();
  let user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    const passwordHash = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      12,
    );
    user = await User.create({
      fullName: String(profile.name || profile.given_name || "CareerHub User")
        .trim()
        .slice(0, 100),
      email,
      passwordHash,
      googleId: String(profile.sub || ""),
      authProvider: "google",
    });
  } else {
    if (!user.googleId) {
      user.googleId = String(profile.sub || "");
      user.authProvider =
        user.authProvider === "local" ? "google+local" : "google";
      await user.save();
    }
  }

  res.json({
    message: "Signed in with Google successfully.",
    token: makeToken(user),
    user: publicUser(user),
  });
});

export const signup = asyncHandler(async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (fullName.length < 2) {
    return res.status(400).json({
      message: "Enter your full name.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: "Enter a valid email address.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must contain at least 8 characters.",
    });
  }

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(409).json({
      message: "An account with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName,
    email,
    passwordHash,
  });

  res.status(201).json({
    message: "Account created successfully.",
    token: makeToken(user),
    user: publicUser(user),
  });
});

export const signin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({
      message: "Incorrect email or password.",
    });
  }

  res.json({
    message: "Signed in successfully.",
    token: makeToken(user),
    user: publicUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  res.json({
    user: publicUser(user),
  });
});
