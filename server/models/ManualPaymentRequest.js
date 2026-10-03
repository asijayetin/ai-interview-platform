const mongoose = require("mongoose");

const manualPaymentRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    plan: { type: String, enum: ["study-plan-monthly"], required: true },
    amount: { type: Number, enum: [259], required: true },
    currency: { type: String, enum: ["INR"], default: "INR" },
    utr: { type: String, required: true, uppercase: true, trim: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManualPaymentRequest", manualPaymentRequestSchema);
