import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/User.js";
import { config } from "../config.js";
import { asyncHandler } from "../utils.js";
import {
  sendTransactionalEmail,
  verificationEmail,
  resetEmail,
} from "../services/emailService.js";

function makeToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role || "user",
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
    emailVerified: Boolean(user.emailVerified),
    role: user.role || "user",
    plan: user.subscriptionPlan || "free",
  };
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueVerification(user) {
  const token = newToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const mail = verificationEmail({ name: user.fullName, token });
  return sendTransactionalEmail({ to: user.email, ...mail });
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
      emailVerified: true,
    });
  } else {
    let changed = false;
    if (!user.googleId) {
      user.googleId = String(profile.sub || "");
      user.authProvider =
        user.authProvider === "local" ? "google+local" : "google";
      changed = true;
    }
    if (!user.emailVerified) {
      user.emailVerified = true;
      changed = true;
    }
    if (changed) await user.save();
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

  if (fullName.length < 2)
    return res.status(400).json({ message: "Enter your full name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Enter a valid email address." });
  if (password.length < 8)
    return res
      .status(400)
      .json({ message: "Password must contain at least 8 characters." });

  if (await User.findOne({ email }))
    return res
      .status(409)
      .json({ message: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    emailVerified: false,
  });
  let verification = null;
  try {
    verification = await issueVerification(user);
  } catch (error) {
    console.error("Verification email failed:", error.message);
  }

  res.status(201).json({
    message: verification?.delivered
      ? "Account created. Check your email to verify your account."
      : "Account created. Email delivery is not configured; use the verification link shown by the development server.",
    token: makeToken(user),
    user: publicUser(user),
    verificationPreview: verification?.preview || null,
  });
});

export const signin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Incorrect email or password." });

  res.json({
    message: user.emailVerified
      ? "Signed in successfully."
      : "Signed in. Please verify your email.",
    token: makeToken(user),
    user: publicUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: publicUser(user) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || req.query?.token || "").trim();
  if (!token)
    return res.status(400).json({ message: "Verification token is required." });
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select("+emailVerificationTokenHash");
  if (!user)
    return res
      .status(400)
      .json({ message: "This verification link is invalid or expired." });
  user.emailVerified = true;
  user.emailVerificationTokenHash = "";
  user.emailVerificationExpiresAt = null;
  await user.save();
  res.json({ message: "Email verified successfully.", user: publicUser(user) });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email }).select(
    "+emailVerificationTokenHash",
  );
  if (!user || user.emailVerified) {
    return res.json({
      message:
        "If that account needs verification, a new email has been requested.",
    });
  }
  const mail = await issueVerification(user);
  res.json({
    message: mail.delivered
      ? "Verification email sent."
      : "Verification email preview generated.",
    verificationPreview: mail.preview || null,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });
  const user = await User.findOne({ email }).select("+passwordResetTokenHash");
  if (!user)
    return res.json({
      message: "If an account exists, reset instructions have been generated.",
    });

  const token = newToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  const mail = resetEmail({ name: user.fullName, token });
  let result;
  try {
    result = await sendTransactionalEmail({ to: user.email, ...mail });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    result = { delivered: false, preview: mail.text };
  }
  res.json({
    message: result.delivered
      ? "Reset instructions sent if the account exists."
      : "Reset instructions generated.",
    resetPreview: result.preview || null,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");
  if (!token)
    return res.status(400).json({ message: "Reset token is required." });
  if (password.length < 8)
    return res
      .status(400)
      .json({ message: "Password must contain at least 8 characters." });

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordHash +passwordResetTokenHash");
  if (!user)
    return res
      .status(400)
      .json({ message: "This reset link is invalid or expired." });

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = "";
  user.passwordResetExpiresAt = null;
  await user.save();
  res.json({ message: "Password reset successfully. You can now sign in." });
});
