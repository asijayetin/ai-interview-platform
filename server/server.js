const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const twilio = require("twilio");

require("dotenv").config();

const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(
  cors({
    origin: "https://ai-interview-platform-ten-alpha.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ========================================
// OTP / CONTACT VERIFICATION CONFIG
// ========================================

const otpHash = (otp) =>
  crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");

const createOtp = () =>
  crypto
    .randomInt(100000, 1000000)
    .toString();

const otpExpiry = () =>
  new Date(Date.now() + 10 * 60 * 1000);

const otpRecentlySent = (sentAt) => {
  if (!sentAt) return false;

  return (
    Date.now() - new Date(sentAt).getTime() <
    60 * 1000
  );
};

// ========================================
// EMAIL SERVICE - BREVO API
// ========================================

const sendEmailWithBrevo = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (
    !process.env.BREVO_API_KEY ||
    !process.env.BREVO_FROM_EMAIL
  ) {
    throw new Error(
      "Brevo email service is not configured on the server"
    );
  }

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        Accept: "application/json",
      },

      body: JSON.stringify({
        sender: {
          name: "AI Interview Arena",
          email: process.env.BREVO_FROM_EMAIL,
        },

        to: [
          {
            email: to,
          },
        ],

        subject,

        textContent: text,

        htmlContent: html,
      }),
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.code ||
        "Brevo email request failed"
    );
  }

  return data;
};

// ========================================
// TWILIO
// ========================================

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN
    ? twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
    : null;

const twilioVerifyService =
  twilioClient &&
  process.env.TWILIO_VERIFY_SERVICE_SID
    ? twilioClient.verify.v2.services(
        process.env.TWILIO_VERIFY_SERVICE_SID
      )
    : null;

const sendPhoneVerification = async (phone) => {
  if (!twilioVerifyService) {
    throw new Error(
      "Twilio Verify service is not configured"
    );
  }

  return twilioVerifyService.verifications.create({
    to: phone,
    channel: "sms",
  });
};

const checkPhoneVerification = async (phone, code) => {
  if (!twilioVerifyService) {
    throw new Error(
      "Twilio Verify service is not configured"
    );
  }

  return twilioVerifyService.verificationChecks.create({
    to: phone,
    code: String(code),
  });
};

// ========================================
// GEMINI API KEY CHECK
// ========================================

if (!process.env.GEMINI_API_KEY) {
  console.log(
    "WARNING: GEMINI_API_KEY is missing from .env"
  );
} else {
  console.log(
    "Gemini API key loaded successfully"
  );
}

// ========================================
// INTERVIEW SCHEMA
// ========================================

const interviewSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      interviewType: {
        type: String,

        required: true,
      },

      role: {
        type: String,

        required: true,
      },

      answers: [
        {
          question: String,

          answer: String,
        },
      ],

      score: {
        type: Number,

        default: null,
      },

      communicationScore: {
        type: Number,

        default: null,
      },

      relevanceScore: {
        type: Number,

        default: null,
      },

      clarityScore: {
        type: Number,

        default: null,
      },

      feedback: {
        type: String,

        default: "",
      },

      improvements: {
        type: String,

        default: "",
      },
    },

    {
      timestamps: true,
    }
  );

const Interview =
  mongoose.model(
    "Interview",
    interviewSchema
  );

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.json({
    message:
      "AI Interview Arena Backend is running!",
  });
});

// ========================================
// SIGNUP
// ========================================

app.post(
  "/api/auth/signup",

  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "All fields are required",
        });
      }

      const existingUser =
        await User.findOne({
          email:
            email
              .toLowerCase()
              .trim(),
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "User already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        await User.create({
          name: name,

          email:
            email
              .toLowerCase()
              .trim(),

          password:
            hashedPassword,
        });

      console.log(
        "User created:",
        user._id
      );

      res.status(201).json({
        message:
          "Signup successful",

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone || "",

          phoneVerified:
            user.phoneVerified ||
            false,

          emailVerified:
            user.emailVerified ||
            false,
        },
      });

    } catch (error) {
      console.log(
        "Signup error:",
        error
      );

      res.status(500).json({
        message:
          "Signup failed",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// LOGIN
// ========================================

app.post(
  "/api/auth/login",

  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      const user =
        await User.findOne({
          email:
            email
              .toLowerCase()
              .trim(),
        });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      const isPasswordCorrect =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      const token =
        jwt.sign(
          {
            userId:
              user._id,

            email:
              user.email,
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d",
          }
        );

      console.log(
        "User logged in:",
        user.email
      );

      res.json({
        message:
          "Login successful",

        token:
          token,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone || "",

          phoneVerified:
            user.phoneVerified ||
            false,

          emailVerified:
            user.emailVerified ||
            false,
        },
      });

    } catch (error) {
      console.log(
        "Login error:",
        error
      );

      res.status(500).json({
        message:
          "Login failed",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// CHANGE PASSWORD
// ========================================

app.post(
  "/api/auth/change-password",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "Current password and new password are required",
        });
      }

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          message:
            "New password must be at least 6 characters",
        });
      }

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const passwordCorrect =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordCorrect) {
        return res.status(401).json({
          message:
            "Current password is incorrect",
        });
      }

      user.password =
        await bcrypt.hash(
          newPassword,
          10
        );

      await user.save();

      res.json({
        message:
          "Password changed successfully",
      });

    } catch (error) {
      console.log(
        "Change password error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to change password",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// SEND EMAIL OTP
// ========================================

app.post(
  "/api/auth/send-email-otp",

  authMiddleware,

  async (req, res) => {
    try {
      if (
        !process.env.BREVO_API_KEY ||
        !process.env.BREVO_FROM_EMAIL
      ) {
        return res.status(500).json({
          message:
            "Brevo email service is not configured",
        });
      }

      const {
        email,
      } = req.body;

      if (!email) {
        return res.status(400).json({
          message:
            "Email is required",
        });
      }

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        otpRecentlySent(
          user.emailOtpSentAt
        )
      ) {
        return res.status(429).json({
          message:
            "Please wait 60 seconds before requesting another OTP",
        });
      }

      const normalizedEmail =
        email
          .toLowerCase()
          .trim();

      const otp =
        createOtp();

      user.email =
        normalizedEmail;

      user.emailVerified =
        false;

      user.emailOtpHash =
        otpHash(otp);

      user.emailOtpExpires =
        otpExpiry();

      user.emailOtpSentAt =
        new Date();

      await user.save();

      const text =
        `Your AI Interview Arena verification code is ${otp}. This code will expire in 10 minutes.`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>AI Interview Arena</h2>

          <p>Your email verification code is:</p>

          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>

          <p>This code will expire in 10 minutes.</p>

          <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
      `;

      await sendEmailWithBrevo({
        to:
          normalizedEmail,

        subject:
          "Your AI Interview Arena OTP",

        text,

        html,
      });

      console.log(
        "Email OTP sent to:",
        normalizedEmail
      );

      res.json({
        message:
          "OTP sent successfully",
      });

    } catch (error) {
      console.log(
        "Send email OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send email OTP",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// VERIFY EMAIL OTP
// ========================================

app.post(
  "/api/auth/verify-email-otp",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        email,
        otp,
      } = req.body;

      if (
        !email ||
        !otp
      ) {
        return res.status(400).json({
          message:
            "Email and OTP are required",
        });
      }

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        user.email !==
        email
          .toLowerCase()
          .trim()
      ) {
        return res.status(400).json({
          message:
            "Email does not match",
        });
      }

      if (
        !user.emailOtpHash ||
        !user.emailOtpExpires
      ) {
        return res.status(400).json({
          message:
            "No OTP found. Please request a new OTP.",
        });
      }

      if (
        new Date() >
        new Date(
          user.emailOtpExpires
        )
      ) {
        return res.status(400).json({
          message:
            "OTP has expired. Please request a new OTP.",
        });
      }

      const hashedOtp =
        otpHash(otp);

      if (
        hashedOtp !==
        user.emailOtpHash
      ) {
        return res.status(400).json({
          message:
            "Invalid OTP",
        });
      }

      user.emailVerified =
        true;

      user.emailOtpHash =
        undefined;

      user.emailOtpExpires =
        undefined;

      user.emailOtpSentAt =
        undefined;

      await user.save();

      console.log(
        "Email verified:",
        user.email
      );

      res.json({
        message:
          "Email verified successfully",

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone || "",

          phoneVerified:
            user.phoneVerified ||
            false,

          emailVerified:
            true,
        },
      });

    } catch (error) {
      console.log(
        "Verify email OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to verify email OTP",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// PHONE SIGNUP - SEND OTP
// ========================================

app.post(
  "/api/auth/phone-signup",

  async (req, res) => {
    try {
      const {
        name,
        phone,
      } = req.body;

      if (
        !name ||
        !phone
      ) {
        return res.status(400).json({
          message:
            "Name and phone number are required",
        });
      }

      const normalizedPhone =
        phone
          .replace(/\s+/g, "")
          .trim();

      if (
        !/^\+[1-9]\d{7,14}$/.test(
          normalizedPhone
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid international phone number",
        });
      }

      if (!twilioVerifyService) {
        return res.status(500).json({
          message:
            "Phone OTP service is not configured",
        });
      }

      let user =
        await User.findOne({
          phone:
            normalizedPhone,
        });

      if (
        user &&
        user.phoneVerified
      ) {
        return res.status(400).json({
          message:
            "An account with this phone number already exists. Please login instead.",
        });
      }

      if (
        user &&
        otpRecentlySent(
          user.phoneOtpSentAt
        )
      ) {
        return res.status(429).json({
          message:
            "Please wait 60 seconds before requesting another OTP",
        });
      }

      if (!user) {
        const digits =
          normalizedPhone.replace(
            /\D/g,
            ""
          );

        const temporaryEmail =
          `${digits}@phone.local`;

        const temporaryPassword =
          crypto.randomBytes(32).toString(
            "hex"
          );

        const hashedPassword =
          await bcrypt.hash(
            temporaryPassword,
            10
          );

        user =
          await User.create({
            name:
              name.trim(),

            email:
              temporaryEmail,

            password:
              hashedPassword,

            phone:
              normalizedPhone,

            phoneVerified:
              false,
          });

      } else {
        user.name =
          name.trim();

        user.phone =
          normalizedPhone;

        user.phoneVerified =
          false;
      }

      user.phoneOtpSentAt =
        new Date();

      await user.save();

      await sendPhoneVerification(
        normalizedPhone
      );

      console.log(
        "Phone signup OTP sent to:",
        normalizedPhone
      );

      res.json({
        message:
          "OTP sent successfully",

        userId:
          user._id,
      });

    } catch (error) {
      console.log(
        "Phone signup error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send phone OTP",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// PHONE SIGNUP - VERIFY OTP
// ========================================

app.post(
  "/api/auth/phone-signup-verify",

  async (req, res) => {
    try {
      const {
        userId,
        phone,
        otp,
      } = req.body;

      if (
        !userId ||
        !phone ||
        !otp
      ) {
        return res.status(400).json({
          message:
            "User ID, phone number and OTP are required",
        });
      }

      const normalizedPhone =
        phone
          .replace(/\s+/g, "")
          .trim();

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        user.phone !==
        normalizedPhone
      ) {
        return res.status(400).json({
          message:
            "Phone number does not match",
        });
      }

      let verificationCheck;

      try {
        verificationCheck =
          await checkPhoneVerification(
            normalizedPhone,
            otp
          );
      } catch (verificationError) {
        console.log(
          "Twilio Verify check error:",
          verificationError
        );

        return res.status(400).json({
          message:
            "Invalid or expired OTP",
        });
      }

      if (
        verificationCheck.status !==
        "approved"
      ) {
        return res.status(400).json({
          message:
            "Invalid or expired OTP",
        });
      }

      user.phoneVerified =
        true;

      user.phoneOtpSentAt =
        undefined;

      await user.save();

      const token =
        jwt.sign(
          {
            userId:
              user._id,

            email:
              user.email,
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "7d",
          }
        );

      console.log(
        "Phone signup verified:",
        normalizedPhone
      );

      res.json({
        message:
          "Phone number verified successfully",

        token:        token,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone || "",

          phoneVerified:
            true,

          emailVerified:
            user.emailVerified ||
            false,
        },
      });

    } catch (error) {
      console.log(
        "Verify phone signup OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to verify phone OTP",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// SEND PHONE OTP
// ========================================

app.post(
  "/api/auth/send-phone-otp",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        phone,
      } = req.body;

      if (!phone) {
        return res.status(400).json({
          message:
            "Phone number is required",
        });
      }

      const normalizedPhone =
        phone
          .replace(/\s+/g, "")
          .trim();

      if (
        !/^\+[1-9]\d{7,14}$/.test(
          normalizedPhone
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid international phone number",
        });
      }

      if (!twilioVerifyService) {
        return res.status(500).json({
          message:
            "Phone OTP service is not configured",
        });
      }

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        otpRecentlySent(
          user.phoneOtpSentAt
        )
      ) {
        return res.status(429).json({
          message:
            "Please wait 60 seconds before requesting another OTP",
        });
      }

      user.phone =
        normalizedPhone;

      user.phoneVerified =
        false;

      user.phoneOtpSentAt =
        new Date();

      await user.save();

      await sendPhoneVerification(
        normalizedPhone
      );

      console.log(
        "Phone OTP sent to:",
        normalizedPhone
      );

      res.json({
        message:
          "OTP sent successfully",
      });

    } catch (error) {
      console.log(
        "Send phone OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send phone OTP",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// VERIFY PHONE OTP
// ========================================

app.post(
  "/api/auth/verify-phone-otp",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        phone,
        otp,
      } = req.body;

      if (
        !phone ||
        !otp
      ) {
        return res.status(400).json({
          message:
            "Phone number and OTP are required",
        });
      }

      const normalizedPhone =
        phone
          .replace(/\s+/g, "")
          .trim();

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        user.phone !==
        normalizedPhone
      ) {
        return res.status(400).json({
          message:
            "Phone number does not match",
        });
      }

      let verificationCheck;

      try {
        verificationCheck =
          await checkPhoneVerification(
            normalizedPhone,
            otp
          );
      } catch (verificationError) {
        console.log(
          "Twilio Verify check error:",
          verificationError
        );

        return res.status(400).json({
          message:
            "Invalid or expired OTP",
        });
      }

      if (
        verificationCheck.status !==
        "approved"
      ) {
        return res.status(400).json({
          message:
            "Invalid or expired OTP",
        });
      }

      user.phoneVerified =
        true;

      user.phoneOtpSentAt =
        undefined;

      await user.save();

      console.log(
        "Phone verified:",
        user.phone
      );

      res.json({
        message:
          "Phone number verified successfully",

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone,

          phoneVerified:
            true,

          emailVerified:
            user.emailVerified ||
            false,
        },
      });

    } catch (error) {
      console.log(
        "Verify phone OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to verify phone OTP",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GET CURRENT USER
// ========================================

app.get(
  "/api/auth/me",

  authMiddleware,

  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select(
          "-password -emailOtpHash -phoneOtpHash"
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      res.json({
        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone || "",

          emailVerified:
            user.emailVerified ||
            false,

          phoneVerified:
            user.phoneVerified ||
            false,
        },
      });

    } catch (error) {
      console.log(
        "Get current user error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to get user",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// UPDATE PROFILE
// ========================================

app.put(
  "/api/auth/profile",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        name,
      } = req.body;

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (
        name &&
        name.trim()
      ) {
        user.name =
          name.trim();
      }

      await user.save();

      res.json({
        message:
          "Profile updated successfully",

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone || "",

          emailVerified:
            user.emailVerified ||
            false,

          phoneVerified:
            user.phoneVerified ||
            false,
        },
      });

    } catch (error) {
      console.log(
        "Update profile error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update profile",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// CREATE INTERVIEW
// ========================================

app.post(
  "/api/interviews",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        interviewType,
        role,
        answers,
        score,
        communicationScore,
        relevanceScore,
        clarityScore,
        feedback,
        improvements,
      } = req.body;

      const interview =
        await Interview.create({
          userId:
            req.user.userId,

          interviewType:
            interviewType ||
            "Technical",

          role:
            role ||
            "Software Developer",

          answers:
            answers || [],

          score:
            score ?? null,

          communicationScore:
            communicationScore ??
            null,

          relevanceScore:
            relevanceScore ??
            null,

          clarityScore:
            clarityScore ??
            null,

          feedback:
            feedback || "",

          improvements:
            improvements || "",
        });

      res.status(201).json({
        message:
          "Interview created successfully",

        interview,
      });

    } catch (error) {
      console.log(
        "Create interview error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create interview",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GET ALL INTERVIEWS
// ========================================

app.get(
  "/api/interviews",

  authMiddleware,

  async (req, res) => {
    try {
      const interviews =
        await Interview.find({
          userId:
            req.user.userId,
        }).sort({
          createdAt:
            -1,
        });

      res.json({
        interviews,
      });

    } catch (error) {
      console.log(
        "Get interviews error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to get interviews",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GET SINGLE INTERVIEW
// ========================================

app.get(
  "/api/interviews/:id",

  authMiddleware,

  async (req, res) => {
    try {
      const interview =
        await Interview.findOne({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        });

      if (!interview) {
        return res.status(404).json({
          message:
            "Interview not found",
        });
      }

      res.json({
        interview,
      });

    } catch (error) {
      console.log(
        "Get interview error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to get interview",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// DELETE INTERVIEW
// ========================================

app.delete(
  "/api/interviews/:id",

  authMiddleware,

  async (req, res) => {
    try {
      const interview =
        await Interview.findOneAndDelete({
          _id:
            req.params.id,

          userId:
            req.user.userId,
        });

      if (!interview) {
        return res.status(404).json({
          message:
            "Interview not found",
        });
      }

      res.json({
        message:
          "Interview deleted successfully",
      });

    } catch (error) {
      console.log(
        "Delete interview error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete interview",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GEMINI INTERVIEW GENERATION
// ========================================

app.post(
  "/api/gemini/generate",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        role,
        interviewType,
        difficulty,
        count,
      } = req.body;

      if (
        !process.env.GEMINI_API_KEY
      ) {
        return res.status(500).json({
          message:
            "Gemini API key is not configured",
        });
      }

      const numberOfQuestions =
        Number(count) || 5;

      const prompt = `
Generate ${numberOfQuestions} interview questions.

Role: ${
        role ||
        "Software Developer"
      }

Interview Type: ${
        interviewType ||
        "Technical"
      }

Difficulty: ${
        difficulty ||
        "Medium"
      }

Return ONLY a valid JSON array.

Each object should contain:
{
  "question": "question text",
  "category": "category"
}
`;

      const response =
        await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            process.env.GEMINI_API_KEY,

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text:
                          prompt,
                      },
                    ],
                  },
                ],
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        return res.status(
          response.status
        ).json({
          message:
            data?.error?.message ||
            "Gemini request failed",
        });
      }

      const generatedText =
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text || "";

      let cleanedText =
        generatedText
          .replace(
            /```json/g,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      let questions;

      try {
        questions =
          JSON.parse(
            cleanedText
          );
      } catch (parseError) {
        console.log(
          "Gemini JSON parse error:",
          parseError
        );

        return res.status(500).json({
          message:
            "Gemini returned invalid question data",
        });
      }

      res.json({
        questions,
      });

    } catch (error) {
      console.log(
        "Gemini generation error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate interview questions",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GEMINI EVALUATION
// ========================================

app.post(
  "/api/gemini/evaluate",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        questions,
        answers,
        role,
        interviewType,
      } = req.body;

      if (
        !process.env.GEMINI_API_KEY
      ) {
        return res.status(500).json({
          message:
            "Gemini API key is not configured",
        });
      }

      const prompt = `
Evaluate the following interview.

Role:
${role || "Software Developer"}

Interview Type:
${interviewType || "Technical"}

Questions and answers:
${JSON.stringify(
        {
          questions,
          answers,
        },
        null,
        2
      )}

Return ONLY valid JSON in this exact structure:

{
  "score": 0,
  "communicationScore": 0,
  "relevanceScore": 0,
  "clarityScore": 0,
  "feedback": "",
  "improvements": ""
}

Scores must be from 0 to 100.
`;

      const response =
        await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            process.env.GEMINI_API_KEY,

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text:
                          prompt,
                      },
                    ],
                  },
                ],
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        return res.status(
          response.status
        ).json({
          message:
            data?.error?.message ||
            "Gemini evaluation failed",
        });
      }

      const generatedText =
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text || "";

      const cleanedText =
        generatedText
          .replace(
            /```json/g,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      let evaluation;

      try {
        evaluation =
          JSON.parse(
            cleanedText
          );
      } catch (parseError) {
        console.log(
          "Evaluation JSON parse error:",
          parseError
        );

        return res.status(500).json({
          message:
            "Gemini returned invalid evaluation data",
        });
      }

      res.json({
        evaluation,
      });

    } catch (error) {
      console.log(
        "Gemini evaluation error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to evaluate interview",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// SAVE INTERVIEW RESULT
// ========================================

app.post(
  "/api/interviews/save-result",

  authMiddleware,

  async (req, res) => {
    try {
      const {
        interviewType,
        role,
        answers,
        evaluation,
      } = req.body;

      const interview =
        await Interview.create({
          userId:
            req.user.userId,

          interviewType:
            interviewType ||
            "Technical",

          role:
            role ||
            "Software Developer",

          answers:
            answers || [],

          score:
            evaluation?.score ??
            null,

          communicationScore:
            evaluation?.communicationScore ??
            null,

          relevanceScore:
            evaluation?.relevanceScore ??
            null,

          clarityScore:
            evaluation?.clarityScore ??
            null,

          feedback:
            evaluation?.feedback ||
            "",

          improvements:
            evaluation?.improvements ||
            "",
        });

      res.status(201).json({
        message:
          "Interview result saved successfully",

        interview,
      });

    } catch (error) {
      console.log(
        "Save interview result error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to save interview result",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// DASHBOARD STATS
// ========================================

app.get(
  "/api/dashboard/stats",

  authMiddleware,

  async (req, res) => {
    try {
      const interviews =
        await Interview.find({
          userId:
            req.user.userId,
        });

      const totalInterviews =
        interviews.length;

      const scores =
        interviews
          .map(
            (item) =>
              item.score
          )
          .filter(
            (score) =>
              typeof score ===
                "number" &&
              !Number.isNaN(score)
          );

      const averageScore =
        scores.length
          ? Math.round(
              scores.reduce(
                (
                  sum,
                  score
                ) =>
                  sum + score,
                0
              ) /
                scores.length
            )
          : 0;

      const bestScore =
        scores.length
          ? Math.max(
              ...scores
            )
          : 0;

      res.json({
        totalInterviews,
        averageScore,
        bestScore,
      });

    } catch (error) {
      console.log(
        "Dashboard stats error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to get dashboard stats",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// 404 HANDLER
// ========================================

app.use(
  (req, res) => {
    res.status(404).json({
      message:
        "Route not found",

      path:
        req.originalUrl,
    });
  }
);

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.log(
      "Global server error:",
      error
    );

    res.status(500).json({
      message:
        "Internal server error",

      error:
        error.message,
    });
  }
);

// ========================================
// MONGODB CONNECTION
// ========================================

const PORT =
  process.env.PORT ||
  8080;

const MONGO_URI =
  process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log(
    "WARNING: MONGO_URI is missing from .env"
  );
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server is running on port ${PORT}`
        );
      }
    );
  })
  .catch(
    (error) => {
      console.log(
        "MongoDB connection error:",
        error
      );
    }
  );
  