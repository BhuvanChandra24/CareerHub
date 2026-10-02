import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/careerhub";

const ADMIN = {
  fullName: "admin",
  email: "admin@careerhub.com",
  password: "Admin@12345",
  role: "admin",
};

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected");

    const existingAdmin = await User.findOne({
      email: ADMIN.email,
    });

    const passwordHash = await bcrypt.hash(ADMIN.password, 12);

    if (existingAdmin) {
      existingAdmin.fullName = ADMIN.fullName;
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = "admin";
      existingAdmin.emailVerified = true;
      existingAdmin.authProvider = "local";

      await existingAdmin.save();

      console.log("=================================");
      console.log("Admin account updated successfully");
      console.log("=================================");
    } else {
      await User.create({
        fullName: ADMIN.fullName,
        email: ADMIN.email,
        passwordHash,
        role: ADMIN.role,
        emailVerified: true,
        authProvider: "local",
      });

      console.log("=================================");
      console.log("Admin account created successfully");
      console.log("=================================");
    }

    console.log("Username : admin");
    console.log("Email    : admin@careerhub.com");
    console.log("Password : Admin@12345");
    console.log("Role     : admin");
    console.log("=================================");
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();