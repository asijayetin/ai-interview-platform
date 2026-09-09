const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    emailOtpHash: {
      type: String,
      default: "",
    },

    emailOtpExpires: {
      type: Date,
      default: null,
    },

    emailOtpSentAt: {
      type: Date,
      default: null,
    },

    phoneOtpHash: {
      type: String,
      default: "",
    },

    phoneOtpExpires: {
      type: Date,
      default: null,
    },

    phoneOtpSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.model("User", userSchema);

module.exports = User;