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
  console.log("WARNING: GEMINI_API_KEY is missing");
} else {
  console.log("Gemini API key loaded successfully");
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
    message: "AI Interview Arena Backend is running!",
  });
});

// ========================================
// SIGNUP
// ========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    console.log("User created:", user._id);

    res.status(201).json({
      message: "Signup successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Signup error:", error);

    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
});

// ========================================
// LOGIN
// ========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log("User logged in:", user.email);

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Login error:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

// ========================================
// CREATE INTERVIEW
// ========================================

app.post(
  "/api/interviews",
  authMiddleware,
  async (req, res) => {
    try {
      const { interviewType, role } = req.body;

      if (!interviewType || !role) {
        return res.status(400).json({
          message:
            "Interview type and role are required",
        });
      }

      const interview = await Interview.create({
        userId: req.user.userId,
        interviewType,
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
        error: error.message,
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
      const { question, answer } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          message:
            "Question and answer are required",
        });
      }

      const interview =
        await Interview.findOne({
          _id: req.params.id,
          userId: req.user.userId,
        });

      if (!interview) {
        return res.status(404).json({
          message: "Interview not found",
        });
      }

      interview.answers.push({
        question,
        answer,
      });

      await interview.save();

      console.log(
        "Answer saved successfully"
      );

      res.json({
        message:
          "Answer saved successfully",
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
        error: error.message,
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
          userId: req.user.userId,
        }).sort({
          createdAt: -1,
        });

      res.json({
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
        error: error.message,
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

      const startTime = Date.now();

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
            "GEMINI_API_KEY was not found",
        });
      }

      // ====================================
      // FIND INTERVIEW
      // ====================================

      const interview =
        await Interview.findOne({
          _id: req.params.id,
          userId: req.user.userId,
        });

      if (!interview) {
        return res.status(404).json({
          message: "Interview not found",
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
              `Q${index + 1}: ${item.question}\nA: ${item.answer}`
          )
          .join("\n\n");

      // ====================================
      // SHORT PROMPT
      // ====================================

      const prompt = `
You are an expert interview evaluator.

Interview type: ${interview.interviewType}
Role: ${interview.role}

Evaluate these candidate answers:

${answerText}

Give fair scores from 0 to 10.

Return ONLY valid JSON in exactly this format:

{
  "score": 0,
  "communicationScore": 0,
  "relevanceScore": 0,
  "clarityScore": 0,
  "feedback": "short feedback",
  "improvements": "specific improvements"
}

Scores must be numbers between 0 and 10.
Do not use percentages.
Do not write /10.
`;

      // ====================================
      // RESPONSE SCHEMA
      // ====================================

      const responseSchema = {
        type: "object",

        properties: {
          score: {
            type: "number",
          },

          communicationScore: {
            type: "number",
          },

          relevanceScore: {
            type: "number",
          },

          clarityScore: {
            type: "number",
          },

          feedback: {
            type: "string",
          },

          improvements: {
            type: "string",
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

      let geminiResponse = null;
      let geminiData = null;

      const maxAttempts = 2;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {
        console.log(
          `Gemini attempt ${attempt}/${maxAttempts}`
        );

        try {
          geminiResponse =
            await fetch(
              "https://generativelanguage.googleapis.com/v1beta/interactions",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  "x-goog-api-key":
                    geminiKey,
                },

                body: JSON.stringify({
                  model:
                    "gemini-3.5-flash-lite",

                  input:
                    prompt,

                  // IMPORTANT:
                  // thinking level is inside generation_config
                  generation_config: {
                    thinking_level:
                      "minimal",
                  },

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

          geminiData =
            await geminiResponse.json();

        } catch (fetchError) {
          console.log(
            "Gemini network error:",
            fetchError.message
          );

          if (attempt === maxAttempts) {
            return res.status(500).json({
              message:
                "Unable to connect to Gemini",

              error:
                fetchError.message,
            });
          }

          await new Promise(
            (resolve) =>
              setTimeout(resolve, 1000)
          );

          continue;
        }

        console.log(
          "Gemini status:",
          geminiResponse.status
        );

        // ====================================
        // SUCCESS
        // ====================================

        if (geminiResponse.ok) {
          break;
        }

        // ====================================
        // ERROR
        // ====================================

        const errorMessage =
          geminiData?.error?.message ||
          "";

        console.log(
          "Gemini error:",
          errorMessage
        );

        // ====================================
        // TEMPORARY ERROR
        // ====================================

        const temporaryError =
          geminiResponse.status === 429 ||
          geminiResponse.status === 503 ||
          /high demand|temporarily|try again later|overloaded|quota/i.test(
            errorMessage
          );

        if (
          !temporaryError ||
          attempt === maxAttempts
        ) {
          break;
        }

        // Only 1 second retry
        console.log(
          "Retrying Gemini in 1 second..."
        );

        await new Promise(
          (resolve) =>
            setTimeout(resolve, 1000)
        );
      }

      // ====================================
      // FINAL GEMINI ERROR
      // ====================================

      if (
        !geminiResponse ||
        !geminiResponse.ok
      ) {
        const message =
          geminiData?.error?.message ||
          "Gemini API request failed";

        console.log(
          "Final Gemini error:",
          message
        );

        // Special quota message
        if (
          geminiResponse?.status === 429 ||
          /quota exceeded/i.test(
            message
          )
        ) {
          return res.status(429).json({
            message:
              "Gemini API quota exceeded. Please try again after the quota resets.",

            error: message,
          });
        }

        return res.status(
          geminiResponse?.status || 500
        ).json({
          message:
            "AI evaluation is temporarily unavailable",

          error: message,
        });
      }

      // ====================================
      // EXTRACT AI RESPONSE
      // ====================================

      let aiText = "";

      // Interactions API
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

      // output_text fallback
      if (
        !aiText &&
        typeof geminiData.output_text ===
          "string"
      ) {
        aiText =
          geminiData.output_text;
      }

      // outputs fallback
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
        "Gemini response received."
      );

      // ====================================
      // EMPTY RESPONSE
      // ====================================

      if (!aiText) {
        return res.status(500).json({
          message:
            "Gemini returned an empty response",

          error:
            "No AI output was returned.",
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
      } catch (error) {
        console.log(
          "JSON parse error:",
          error.message
        );

        console.log(
          "AI TEXT:",
          aiText
        );

        return res.status(500).json({
          message:
            "Gemini returned invalid JSON",

          error:
            error.message,
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

      const totalTime =
        Date.now() - startTime;

      console.log(
        `Gemini evaluation saved successfully in ${totalTime} ms`
      );

      // ====================================
      // SEND RESULT
      // ====================================

      return res.json({
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

    } catch (error) {
      console.log(
        "GEMINI EVALUATION ERROR:",
        error
      );

      return res.status(500).json({
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
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);