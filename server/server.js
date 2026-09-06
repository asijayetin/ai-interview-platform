const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

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

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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

const Interview = mongoose.model(
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

      if (!name || !email || !password) {
        return res.status(400).json({
          message:
            "All fields are required",
        });
      }

      const existingUser =
        await User.findOne({
          email: email,
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
          email: email,
          password: hashedPassword,
        });

      console.log(
        "User created:",
        user._id
      );

      res.status(201).json({
        message:
          "Signup successful",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
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

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      const user =
        await User.findOne({
          email: email,
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
            userId: user._id,
            email: user.email,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      console.log(
        "User logged in:",
        user.email
      );

      res.json({
        message:
          "Login successful",

        token: token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
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
        "Interview saved:",
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
// SAVE ANSWER
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

      // ====================================
      // GEMINI KEY
      // ====================================

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

      // ====================================
      // FIND INTERVIEW
      // ====================================

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

      // ====================================
      // CHECK ANSWERS
      // ====================================

      if (
        !interview.answers ||
        interview.answers.length === 0
      ) {
        return res.status(400).json({
          message:
            "No answers found for this interview",
        });
      }

      // ====================================
      // PREPARE ANSWERS
      // ====================================

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

      // ====================================
      // PROMPT
      // ====================================

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

Use decimal scores when appropriate, for example:
8
8.5
9

Do not use:
"8"
"8/10"
"80%"
"8 out of 10"

Also provide:

- Short overall feedback
- Specific improvement suggestions

Be realistic and fair.
Do not give 10 unless the candidate is excellent.

The output must follow the provided JSON schema.
`;

      // ====================================
      // JSON SCHEMA
      // ====================================

      const responseSchema = {
        type: "object",

        properties: {
          score: {
            type: "number",
            description:
              "Overall interview score from 0 to 10",
          },

          communicationScore: {
            type: "number",
            description:
              "Communication score from 0 to 10",
          },

          relevanceScore: {
            type: "number",
            description:
              "Relevance score from 0 to 10",
          },

          clarityScore: {
            type: "number",
            description:
              "Clarity score from 0 to 10",
          },

          feedback: {
            type: "string",
            description:
              "Short overall feedback",
          },

          improvements: {
            type: "string",
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

      // ====================================
      // GEMINI REQUEST
      // ====================================

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

            body: JSON.stringify({
              model:
                "gemini-3.6-flash",

              input:
                prompt,

              response_format: {
                type: "text",

                mime_type:
                  "application/json",

                schema:
                  responseSchema,
              },
            }),
          }
        );

      // ====================================
      // READ RESPONSE
      // ====================================

      const geminiData =
        await geminiResponse.json();

      console.log(
        "Gemini HTTP status:",
        geminiResponse.status
      );

      console.log(
        "Complete Gemini response:"
      );

      console.log(
        JSON.stringify(
          geminiData,
          null,
          2
        )
      );

      // ====================================
      // GEMINI ERROR
      // ====================================

      if (!geminiResponse.ok) {
        console.log(
          "Gemini API error:"
        );

        console.log(
          JSON.stringify(
            geminiData,
            null,
            2
          )
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

      // ====================================
      // EXTRACT OUTPUT
      // ====================================

      let aiText = "";

      // New Interactions API structure:
      // steps -> model_output -> content -> text

      if (
        Array.isArray(
          geminiData.steps
        )
      ) {
        for (
          const step of
            geminiData.steps
        ) {
          if (
            step.type ===
              "model_output" &&
            Array.isArray(
              step.content
            )
          ) {
            for (
              const content of
                step.content
            ) {
              if (
                content.type ===
                  "text" &&
                typeof content.text ===
                  "string"
              ) {
                aiText +=
                  content.text;
              }
            }
          }
        }
      }

      // Fallback: output_text

      if (
        !aiText &&
        typeof geminiData.output_text ===
          "string"
      ) {
        aiText =
          geminiData.output_text;
      }

      // Fallback: outputs legacy format

      if (
        !aiText &&
        Array.isArray(
          geminiData.outputs
        )
      ) {
        for (
          const output of
            geminiData.outputs
        ) {
          if (
            typeof output.text ===
              "string"
          ) {
            aiText +=
              output.text;
          }
        }
      }

      console.log(
        "Gemini extracted response:"
      );

      console.log(
        aiText
      );

      // ====================================
      // EMPTY RESPONSE
      // ====================================

      if (!aiText) {
        return res.status(500).json({
          message:
            "Gemini returned an empty response",

          error:
            "Gemini completed the request but did not return model output.",

          rawResponse:
            geminiData,
        });
      }

      // ====================================
      // CLEAN JSON
      // ====================================

      let cleanedText =
        aiText.trim();

      cleanedText =
        cleanedText.replace(
          /^```json\s*/i,
          ""
        );

      cleanedText =
        cleanedText.replace(
          /^```\s*/i,
          ""
        );

      cleanedText =
        cleanedText.replace(
          /\s*```$/i,
          ""
        );

      cleanedText =
        cleanedText.trim();

      // ====================================
      // PARSE JSON
      // ====================================

      let evaluation;

      try {
        evaluation =
          JSON.parse(
            cleanedText
          );
      } catch (parseError) {
        console.log(
          "JSON parse error:",
          parseError.message
        );

        return res.status(500).json({
          message:
            "Gemini returned invalid JSON",

          error:
            parseError.message,

          rawResponse:
            aiText,
        });
      }

      // ====================================
      // VALIDATE SCORES
      // ====================================

      const scoreFields = [
        "score",
        "communicationScore",
        "relevanceScore",
        "clarityScore",
      ];

      for (
        const field of scoreFields
      ) {
        const value =
          Number(
            evaluation[field]
          );

        if (
          !Number.isFinite(value) ||
          value < 0 ||
          value > 10
        ) {
          return res.status(500).json({
            message:
              "Gemini returned invalid scores",

            error:
              "Scores must be numbers between 0 and 10",

            evaluation:
              evaluation,
          });
        }

        evaluation[field] =
          value;
      }

      // ====================================
      // FEEDBACK
      // ====================================

      evaluation.feedback =
        String(
          evaluation.feedback ||
            ""
        );

      evaluation.improvements =
        String(
          evaluation.improvements ||
            ""
        );

      // ====================================
      // SAVE TO MONGODB
      // ====================================

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
        "Gemini evaluation saved successfully."
      );

      // ====================================
      // SEND RESULT
      // ====================================

      res.json({
        message:
          "Interview evaluated successfully",

        evaluation: {
          score:
            interview.score,

          communicationScore:
            interview.communicationScore,

          relevanceScore:
            interview.relevanceScore,

          clarityScore:
            interview.clarityScore,

          feedback:
            interview.feedback,

          improvements:
            interview.improvements,
        },
      });

      console.log(
        "================================"
      );
    } catch (error) {
      console.log(
        "================================"
      );

      console.log(
        "GEMINI EVALUATION ERROR:"
      );

      console.log(
        error
      );

      console.log(
        "================================"
      );

      res.status(500).json({
        message:
          "Failed to evaluate interview",

        error:
          error.message ||
          "Unknown Gemini error",
      });
    }
  }
);

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
  })
  .catch((error) => {
    console.log(
      "MongoDB connection error:",
      error
    );
  });

// ========================================
// START SERVER
// ========================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);