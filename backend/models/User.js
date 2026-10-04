// ======================================================
// GoldTrade V18 - User Model
// ======================================================

const mongoose = require("mongoose");

// ======================================================
// USER SCHEMA
// ======================================================

const userSchema = new mongoose.Schema(
  {
    // ==================================================
    // BASIC ACCOUNT INFORMATION
    // ==================================================

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    // ==================================================
    // ROLE
    // ==================================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      lowercase: true,
      trim: true,
      index: true,
    },

    // ==================================================
    // PROFILE
    // ==================================================

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // ACCOUNT STATUS
    // ==================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ==================================================
    // LAST LOGIN
    // ==================================================

    lastLogin: {
      type: Date,
      default: null,
    },
  },

  // ====================================================
  // TIMESTAMPS
  // ====================================================

  {
    timestamps: true,
  }
);

// ======================================================
// EXPORT MODEL
// ======================================================

module.exports =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );