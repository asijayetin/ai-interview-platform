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
// GEMINI CONFIG
// ========================================

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

// Questions ke liye models
const QUESTION_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

// Evaluation ke liye models
const EVALUATION_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

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

    // AI generated questions
    questions: {
      type: [String],
      default: [],
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
// GEMINI HELPER
// ========================================

async function callGemini(
  prompt,
  responseSchema,
  models
) {
  const geminiKey =
    process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    throw new Error(
      "GEMINI_API_KEY was not found in environment variables."
    );
  }

  let lastError =
    "Gemini request failed.";

  for (const model of models) {
    console.log(
      `Trying Gemini model: ${model}`
    );

    const controller =
      new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 20000);

    try {
      const response = await fetch(
        GEMINI_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              geminiKey,
          },

          body: JSON.stringify({
            model,

            input: prompt,

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

          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      let data = {};

      try {
        data =
          await response.json();
      } catch (error) {
        data = {};
      }

      console.log(
        `Gemini ${model} status: ${response.status}`
      );

      // ====================================
      // SUCCESS
      // ====================================

      if (response.ok) {
        console.log(
          `Gemini success using ${model}`
        );

        return {
          data,
          model,
        };
      }

      // ====================================
      // ERROR MESSAGE
      // ====================================

      const errorMessage =
        data?.error?.message ||
        data?.message ||
        "Unknown Gemini error";

      lastError =
        errorMessage;

      console.log(
        `Gemini ${model} error:`,
        errorMessage
      );

      // ====================================
      // TEMPORARY ERROR
      // ====================================

      const temporaryError =
        response.status === 429 ||
        response.status === 503 ||
        /high demand/i.test(
          errorMessage
        ) ||
        /temporarily/i.test(
          errorMessage
        ) ||
        /try again later/i.test(
          errorMessage
        ) ||
        /overloaded/i.test(
          errorMessage
        ) ||
        /resource exhausted/i.test(
          errorMessage
        ) ||
        /quota/i.test(
          errorMessage
        );

      if (temporaryError) {
        console.log(
          `${model} unavailable. Trying next model...`
        );

        continue;
      }

      // Other errors
      throw new Error(
        errorMessage
      );
    } catch (error) {
      clearTimeout(timeout);

      // ====================================
      // TIMEOUT
      // ====================================

      if (
        error.name ===
        "AbortError"
      ) {
        lastError =
          `Gemini model ${model} timed out.`;

        console.log(
          lastError
        );

        continue;
      }

      // ====================================
      // NETWORK / OTHER ERROR
      // ====================================

      console.log(
        `Gemini ${model} error:`,
        error.message
      );

      lastError =
        error.message;

      continue;
    }
  }

  throw new Error(
    `All Gemini models are currently unavailable. Last error: ${lastError}`
  );
}

// ========================================
// EXTRACT GEMINI TEXT
// ========================================

function extractGeminiText(
  geminiData
) {
  let aiText = "";

  // Interactions API
  if (
    Array.isArray(
      geminiData?.steps
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
    typeof geminiData?.output_text ===
      "string"
  ) {
    aiText =
      geminiData.output_text;
  }

  // outputs fallback
  if (
    !aiText &&
    Array.isArray(
      geminiData?.outputs
    )
  ) {
    for (
      const output of
        geminiData.outputs
    ) {
      if (
        typeof output?.text ===
        "string"
      ) {
        aiText +=
          output.text;
      }

      if (
        Array.isArray(
          output?.content
        )
      ) {
        for (
          const content of
            output.content
        ) {
          if (
            typeof content?.text ===
            "string"
          ) {
            aiText +=
              content.text;
          }
        }
      }
    }
  }

  return aiText.trim();
}

// ========================================
// CLEAN AI JSON
// ========================================

function cleanAIJson(
  text
) {
  let cleaned =
    text.trim();

  cleaned =
    cleaned.replace(
      /^```json\s*/i,
      ""
    );

  cleaned =
    cleaned.replace(
      /^```\s*/i,
      ""
    );

  cleaned =
    cleaned.replace(
      /\s*```$/i,
      ""
    );

  return cleaned.trim();
}

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
            email.toLowerCase(),
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
          name,
          email:
            email.toLowerCase(),
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
            email.toLowerCase(),
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

        token,

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

      if (
        !interviewType ||
        !role
      ) {
        return res.status(400).json({
          message:
            "Interview type and role are required",
        });
      }

      const interview =
        await Interview.create({
          userId:
            req.user.userId,

          interviewType,

          role,

          questions: [],

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

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GENERATE AI QUESTIONS
// ========================================

app.post(
  "/api/interviews/:id/questions",
  authMiddleware,
  async (req, res) => {
    try {
      console.log(
        "================================"
      );

      console.log(
        "Generating AI questions..."
      );

      const interview =
        await Interview.findOne({
          _id: req.params.id,

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
      // IMPORTANT:
      // Already generated questions
      // ====================================

      if (
        Array.isArray(
          interview.questions
        ) &&
        interview.questions.length ===
          5
      ) {
        console.log(
          "Questions already exist. Returning saved questions."
        );

        return res.json({
          message:
            "Questions already generated",

          questions:
            interview.questions,
        });
      }

      // ====================================
      // GEMINI KEY
      // ====================================

      if (
        !process.env.GEMINI_API_KEY
      ) {
        return res.status(500).json({
          message:
            "Gemini API key is missing",
        });
      }

      // ====================================
      // PROMPT
      // ====================================

      const prompt = `
You are an expert professional interviewer.

Generate exactly 5 interview questions.

Interview Type:
${interview.interviewType}

Target Role:
${interview.role}

IMPORTANT RULES:

1. Questions must be highly relevant to BOTH the interview type and the selected role.

2. Do not generate generic questions when a role-specific question is possible.

3. Questions should match the expected skill level of the selected role.

4. If the role is Data Analyst:
   - HR interviews should focus on behavioral questions relevant to analytics work.
   - Technical interviews should focus on SQL, Excel, statistics, data cleaning, dashboards, Python/pandas, analytics concepts, etc.
   - Coding interviews should contain coding/data problems appropriate for a Data Analyst.

5. If the role is Frontend Developer:
   - HR interviews should focus on frontend-related behavioral situations.
   - Technical interviews should focus on HTML, CSS, JavaScript, React, browser concepts, APIs, performance, etc.
   - Coding interviews should contain frontend/JavaScript coding problems.

6. If the role is Backend Developer:
   - Questions should be related to APIs, databases, backend architecture, authentication, Node.js/server concepts, etc.

7. If the role is Java Developer:
   - Technical questions should cover Java, OOP, collections, exceptions, multithreading, JVM, Spring/backend concepts where appropriate.
   - Coding questions should be Java coding problems.

8. If the role is Software Engineer:
   - Questions should cover programming, DSA, software engineering concepts, APIs, databases, system concepts, debugging, etc.

9. HR questions must still be related to the selected role.

10. Avoid repeating the same question.

11. Keep questions clear and interview-ready.

12. Return exactly 5 questions.

Return ONLY valid JSON.

Format:

{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ]
}
`;

      // ====================================
      // RESPONSE SCHEMA
      // ====================================

      const responseSchema = {
        type: "object",

        properties: {
          questions: {
            type: "array",

            items: {
              type: "string",
            },

            minItems: 5,

            maxItems: 5,
          },
        },

        required: [
          "questions",
        ],
      };

      // ====================================
      // CALL GEMINI WITH FALLBACK
      // ====================================

      const result =
        await callGemini(
          prompt,
          responseSchema,
          QUESTION_MODELS
        );

      const aiText =
        extractGeminiText(
          result.data
        );

      console.log(
        "Gemini question response received."
      );

      if (!aiText) {
        return res.status(500).json({
          message:
            "Gemini returned an empty response",
        });
      }

      // ====================================
      // PARSE JSON
      // ====================================

      const cleanedText =
        cleanAIJson(
          aiText
        );

      let resultData;

      try {
        resultData =
          JSON.parse(
            cleanedText
          );
      } catch (error) {
        console.log(
          "Question JSON parse error:",
          error.message
        );

        console.log(
          "AI TEXT:",
          aiText
        );

        return res.status(500).json({
          message:
            "Gemini returned invalid question JSON",

          error:
            error.message,
        });
      }

      // ====================================
      // VALIDATE QUESTIONS
      // ====================================

      if (
        !Array.isArray(
          resultData.questions
        )
      ) {
        return res.status(500).json({
          message:
            "Gemini returned invalid questions",
        });
      }

      const questions =
        resultData.questions
          .map((question) =>
            String(
              question
            ).trim()
          )
          .filter(
            (question) =>
              question.length > 0
          );

      if (
        questions.length !== 5
      ) {
        return res.status(500).json({
          message:
            "Gemini did not return exactly 5 questions",

          received:
            questions.length,
        });
      }

      // ====================================
      // SAVE QUESTIONS
      // ====================================

      interview.questions =
        questions;

      await interview.save();

      console.log(
        "AI questions saved successfully."
      );

      console.log(
        `Questions generated using ${result.model}`
      );

      return res.json({
        message:
          "AI questions generated successfully",

        questions,
      });
    } catch (error) {
      console.log(
        "QUESTION GENERATION ERROR:",
        error
      );

      return res.status(503).json({
        message:
          "AI question generation is temporarily unavailable. Please try again.",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// GET SAVED QUESTIONS
// ========================================

app.get(
  "/api/interviews/:id/questions",
  authMiddleware,
  async (req, res) => {
    try {
      const interview =
        await Interview.findOne({
          _id: req.params.id,

          userId:
            req.user.userId,
        });

      if (!interview) {
        return res.status(404).json({
          message:
            "Interview not found",
        });
      }

      return res.json({
        questions:
          interview.questions || [],
      });
    } catch (error) {
      console.log(
        "Error fetching questions:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch questions",

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

      if (
        !question ||
        !answer
      ) {
        return res.status(400).json({
          message:
            "Question and answer are required",
        });
      }

      const interview =
        await Interview.findOne({
          _id: req.params.id,

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

      const startTime =
        Date.now();

      // ====================================
      // FIND INTERVIEW
      // ====================================

      const interview =
        await Interview.findOne({
          _id: req.params.id,

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
        interview.answers.length ===
          0
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
      // PROMPT
      // ====================================

      const prompt = `
You are an expert interview evaluator.

Interview Type:
${interview.interviewType}

Role:
${interview.role}

Evaluate the candidate's answers below.

${answerText}

Give fair scores from 0 to 10.

Evaluate:

1. Overall score
2. Communication
3. Relevance of answers
4. Clarity
5. Overall feedback
6. Specific improvements

Consider the selected interview type and role while evaluating.

Return ONLY valid JSON.

Format:

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
      // CALL GEMINI WITH FALLBACK
      // ====================================

      const result =
        await callGemini(
          prompt,
          responseSchema,
          EVALUATION_MODELS
        );

      const aiText =
        extractGeminiText(
          result.data
        );

      console.log(
        `Evaluation received using ${result.model}`
      );

      if (!aiText) {
        return res.status(500).json({
          message:
            "Gemini returned an empty response",
        });
      }

      // ====================================
      // CLEAN JSON
      // ====================================

      const cleanedText =
        cleanAIJson(
          aiText
        );

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
          "Evaluation JSON parse error:",
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
      // SAVE EVALUATION
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
        Date.now() -
        startTime;

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

      return res.status(503).json({
        message:
          "AI evaluation is temporarily unavailable. Please try again.",

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