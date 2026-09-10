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

  const data = await response.json().catch(() => ({}));

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
            "Email service is not configured on the server",
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


      const otp =
        createOtp();


      user.emailOtpHash =
        otpHash(otp);


      user.emailOtpExpires =
        otpExpiry();


      user.emailOtpSentAt =
        new Date();


      await user.save();


      await sendEmailWithBrevo({

        to:
          user.email,

        subject:
          "AI Interview Arena - Email Verification OTP",

        text:
          `Your AI Interview Arena verification OTP is ${otp}. It expires in 10 minutes.`,

        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:30px">

            <h2>
              AI Interview Arena
            </h2>

            <p>
              Use the OTP below to verify your email address.
            </p>

            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:18px 0">
              ${otp}
            </div>

            <p>
              This OTP expires in 10 minutes.
            </p>

            <p>
              If you did not request this, you can safely ignore this email.
            </p>

          </div>
        `,
      });


      res.json({

        message:
          "Email OTP sent successfully",
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

      const { otp } = req.body;


      if (!otp) {

        return res.status(400).json({

          message:
            "OTP is required",

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
        !user.emailOtpHash ||
        !user.emailOtpExpires
      ) {

        return res.status(400).json({

          message:
            "Please request a new OTP",

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
            "OTP has expired. Please request a new one",

        });

      }


      if (
        otpHash(otp) !==
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
        "";

      user.emailOtpExpires =
        null;

      user.emailOtpSentAt =
        null;


      await user.save();


      res.json({

        message:
          "Email verified successfully",

      });

    } catch (error) {

      console.log(
        "Verify email OTP error:",
        error
      );


      res.status(500).json({

        message:
          "Failed to verify email",

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

      const { phone } =
        req.body;


      if (!phone) {

        return res.status(400).json({

          message:
            "Phone number is required",

        });

      }


      if (
        !/^\+[1-9]\d{7,14}$/.test(
          phone
        )
      ) {

        return res.status(400).json({

          message:
            "Use international format, e.g. +919876543210",

        });

      }


      if (!twilioClient) {

        return res.status(500).json({

          message:
            "SMS service is not configured on the server",

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


      const otp =
        createOtp();


      user.phone =
        phone;

      user.phoneVerified =
        false;

      user.phoneOtpHash =
        otpHash(otp);

      user.phoneOtpExpires =
        otpExpiry();

      user.phoneOtpSentAt =
        new Date();


      await user.save();


      await twilioClient.messages.create({

        body:
          `AI Interview Arena verification OTP: ${otp}. It expires in 10 minutes.`,

        from:
          process.env.TWILIO_PHONE_NUMBER,

        to:
          phone,

      });


      res.json({

        message:
          "Phone OTP sent successfully",

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
        phone
      ) {

        return res.status(400).json({

          message:
            "Phone number does not match the OTP request",

        });

      }


      if (
        !user.phoneOtpHash ||
        !user.phoneOtpExpires
      ) {

        return res.status(400).json({

          message:
            "Please request a new OTP",

        });

      }


      if (
        new Date() >
        new Date(
          user.phoneOtpExpires
        )
      ) {

        return res.status(400).json({

          message:
            "OTP has expired. Please request a new one",

        });

      }


      if (
        otpHash(otp) !==
        user.phoneOtpHash
      ) {

        return res.status(400).json({

          message:
            "Invalid OTP",

        });

      }


      user.phoneVerified =
        true;

      user.phoneOtpHash =
        "";

      user.phoneOtpExpires =
        null;

      user.phoneOtpSentAt =
        null;


      await user.save();


      res.json({

        message:
          "Phone verified successfully",

      });

    } catch (error) {

      console.log(
        "Verify phone OTP error:",
        error
      );


      res.status(500).json({

        message:
          "Failed to verify phone",

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
      } = req.body;

      if (!interviewType || !role) {
        return res.status(400).json({
          message:
            "Interview type and role are required",
        });
      }

      const interview =
        await Interview.create({
          userId:
            req.user.userId,

          interviewType:
            interviewType,

          role:
            role,

          answers: [],
        });

      console.log(
        "Interview created:",
        interview._id
      );

      res.status(201).json({
        message:
          "Interview created successfully",

        interview:
          interview,
      });

    } catch (error) {

      console.log(
        "Error creating interview:",
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
// SAVE INTERVIEW ANSWER
// ========================================

app.post(
  "/api/interviews/:id/answer",
  authMiddleware,
  async (req, res) => {
    try {

      const {
        question,
        answer,
      } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          message:
            "Question and answer are required",
        });
      }

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

      interview.answers.push({
        question:
          question,

        answer:
          answer,
      });

      await interview.save();

      console.log(
        "Answer saved successfully"
      );

      res.json({
        message:
          "Answer saved successfully",

        interview:
          interview,
      });

    } catch (error) {

      console.log(
        "Error saving answer:",
        error
      );

      res.status(500).json({
        message:
          "Failed to save answer",

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
          createdAt: -1,
        });

      res.json({
        interviews:
          interviews,
      });

    } catch (error) {

      console.log(
        "Error fetching interviews:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch interviews",

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
        interview:
          interview,
      });

    } catch (error) {

      console.log(
        "Error fetching interview:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch interview",

        error:
          error.message,
      });
    }
  }
);


// ========================================
// GENERATE INTERVIEW QUESTIONS
// ========================================

app.post(
  "/api/interviews/:id/questions",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        interviewType,
        role,
      } = req.body;

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

      const geminiKey =
        process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        return res.status(500).json({
          message:
            "Gemini API key is missing",
        });
      }

      const prompt = `
You are an expert professional interviewer.

Generate interview questions for:

Interview Type:
${interviewType || interview.interviewType}

Role:
${role || interview.role}

Generate 5 relevant interview questions.

Rules:

- Questions should match the selected role.
- Questions should be realistic.
- Include a mixture of conceptual and practical questions.
- Do not include answers.
- Return ONLY a JSON array of strings.

Example:

[
  "Question 1",
  "Question 2",
  "Question 3",
  "Question 4",
  "Question 5"
]
`;

      console.log(
        "Generating interview questions..."
      );

      const geminiResponse =
        await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                geminiKey,
            },

            body:
              JSON.stringify({
                model:
                  "gemini-3.6-flash",

                input:
                  prompt,

                response_format: {
                  type:
                    "text",

                  mime_type:
                    "application/json",
                },
              }),
          }
        );

      const geminiData =
        await geminiResponse.json();

      if (!geminiResponse.ok) {

        console.log(
          "Gemini question error:",
          geminiData
        );

        return res.status(
          geminiResponse.status
        ).json({
          message:
            "Gemini API request failed",

          error:
            geminiData?.error?.message ||
            "Unknown Gemini API error",
        });
      }

      let aiText = "";

      if (
        geminiData?.output_text
      ) {

        aiText =
          geminiData.output_text;

      } else if (
        geminiData?.output
      ) {

        aiText =
          typeof geminiData.output ===
          "string"
            ? geminiData.output
            : JSON.stringify(
                geminiData.output
              );

      } else if (
        geminiData?.response
      ) {

        aiText =
          typeof geminiData.response ===
          "string"
            ? geminiData.response
            : JSON.stringify(
                geminiData.response
              );

      }


      aiText =
        aiText
          .replace(
            /```json/gi,
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
            aiText
          );

      } catch (parseError) {

        console.log(
          "Question JSON parse error:",
          parseError
        );

        return res.status(500).json({
          message:
            "AI returned invalid question format",

          error:
            aiText,
        });
      }


      if (
        !Array.isArray(
          questions
        )
      ) {

        return res.status(500).json({
          message:
            "AI did not return a question array",
        });
      }


      console.log(
        "Questions generated successfully"
      );


      res.json({
        questions:
          questions,
      });

    } catch (error) {

      console.log(
        "Question generation error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to generate questions",

        error:
          error.message,
      });
    }
  }
);


// ========================================
// GEMINI AI EVALUATION
// ========================================

app.post(
  "/api/interviews/:id/evaluate",
  authMiddleware,
  async (req, res) => {

    try {

      console.log(
        "================================"
      );

      console.log(
        "Starting Gemini evaluation..."
      );

      const geminiKey =
        process.env.GEMINI_API_KEY;

      if (!geminiKey) {

        return res.status(500).json({
          message:
            "Gemini API key is missing",

          error:
            "GEMINI_API_KEY was not found in .env",
        });
      }


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


      if (
        !interview.answers ||
        interview.answers.length === 0
      ) {

        return res.status(400).json({
          message:
            "No answers found for this interview",
        });
      }


      const answerText =
        interview.answers
          .map(
            (item, index) =>
              `Question ${
                index + 1
              }: ${item.question}\nAnswer: ${item.answer}`
          )
          .join("\n\n");


      console.log(
        "Interview answers prepared."
      );


      const prompt = `
You are an expert professional interview evaluator.

Evaluate this candidate's interview.

Interview Type:
${interview.interviewType}

Role:
${interview.role}

Candidate Answers:

${answerText}

Evaluate the candidate based on the actual answers.

Give these four scores:

1. Overall score
2. Communication score
3. Relevance score
4. Clarity score

Every score MUST be between 0 and 10.

Use decimal scores when appropriate.

Also provide:

- Short overall feedback
- Specific improvement suggestions

Be realistic and fair.

Do not give 10 unless the candidate is excellent.

The output must follow the provided JSON schema.
`;


      const responseSchema = {

        type:
          "object",

        properties: {

          score: {
            type:
              "number",

            description:
              "Overall interview score from 0 to 10",
          },

          communicationScore: {
            type:
              "number",

            description:
              "Communication score from 0 to 10",
          },

          relevanceScore: {
            type:
              "number",

            description:
              "Relevance score from 0 to 10",
          },

          clarityScore: {
            type:
              "number",

            description:
              "Clarity score from 0 to 10",
          },

          feedback: {
            type:
              "string",

            description:
              "Short overall feedback",
          },

          improvements: {
            type:
              "string",

            description:
              "Specific improvement suggestions",
          },
        },

        required: [
          "score",
          "communicationScore",
          "relevanceScore",
          "clarityScore",
          "feedback",
          "improvements",
        ],
      };


      console.log(
        "Sending request to Gemini..."
      );


      const geminiResponse =
        await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "x-goog-api-key":
                geminiKey,
            },

            body:
              JSON.stringify({

                model:
                  "gemini-3.6-flash",

                input:
                  prompt,

                response_format: {

                  type:
                    "text",

                  mime_type:
                    "application/json",

                  schema:
                    responseSchema,
                },
              }),
          }
        );


      const geminiData =
        await geminiResponse.json();


      console.log(
        "Gemini HTTP status:",
        geminiResponse.status
      );


      if (!geminiResponse.ok) {

        return res.status(
          geminiResponse.status
        ).json({

          message:
            "Gemini API request failed",

          error:
            geminiData?.error?.message ||
            "Unknown Gemini API error",
        });
      }


      let aiText = "";


      if (
        geminiData?.output_text
      ) {

        aiText =
          geminiData.output_text;

      } else if (
        geminiData?.output
      ) {

        aiText =
          typeof geminiData.output ===
          "string"
            ? geminiData.output
            : JSON.stringify(
                geminiData.output
              );

      } else if (
        geminiData?.response
      ) {

        aiText =
          typeof geminiData.response ===
          "string"
            ? geminiData.response
            : JSON.stringify(
                geminiData.response
              );

      }


      aiText =
        aiText
          .replace(
            /```json/gi,
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
            aiText
          );

      } catch (parseError) {

        console.log(
          "Evaluation JSON parse error:",
          parseError
        );

        return res.status(500).json({

          message:
            "AI returned invalid evaluation format",

          error:
            aiText,
        });
      }


      interview.score =
        evaluation.score;

      interview.communicationScore =
        evaluation.communicationScore;

      interview.relevanceScore =
        evaluation.relevanceScore;

      interview.clarityScore =
        evaluation.clarityScore;

      interview.feedback =
        evaluation.feedback;

      interview.improvements =
        evaluation.improvements;


      await interview.save();


      console.log(
        "Evaluation saved successfully."
      );


      res.json({

        message:
          "Interview evaluated successfully",

        evaluation:
          evaluation,

        interview:
          interview,
      });

    } catch (error) {

      console.log(
        "Evaluation error:",
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
// SERVER START
// ========================================

const PORT =
  process.env.PORT || 5000;


// ========================================
// MONGODB CONNECTION
// ========================================

mongoose
  .connect(
    process.env.MONGO_URI
  )

  .then(() => {

    console.log(
      "MongoDB connected successfully"
    );


    app.listen(
      PORT,

      () => {

        console.log(
          `Server running on port ${PORT}`
        );

      }
    );

  })

  .catch((error) => {

    console.log(
      "MongoDB connection error:",
      error
    );

  });