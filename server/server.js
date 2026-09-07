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

    // AI GENERATED QUESTIONS
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
// HOME ROUTE
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
        "Starting Gemini question generation..."
      );

      // ------------------------------------
      // CHECK GEMINI KEY
      // ------------------------------------

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

      // ------------------------------------
      // FIND INTERVIEW
      // ------------------------------------

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

      // ------------------------------------
      // IF QUESTIONS ALREADY EXIST
      // ------------------------------------

      if (
        interview.questions &&
        interview.questions.length === 5
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

      // ------------------------------------
      // INTERVIEW DETAILS
      // ------------------------------------

      const interviewType =
        interview.interviewType;

      const role =
        interview.role;

      console.log(
        "Interview Type:",
        interviewType
      );

      console.log(
        "Role:",
        role
      );

      // ------------------------------------
      // GEMINI PROMPT
      // ------------------------------------

      const prompt = `
You are an expert professional interviewer.

Generate exactly 5 interview questions for a candidate.

INTERVIEW TYPE:
${interviewType}

JOB ROLE:
${role}

The questions MUST be appropriate for BOTH the selected interview type AND the selected job role.

Important rules:

1. If interview type is HR:
   Ask behavioral, situational, personality, teamwork,
   communication, leadership and career-related questions.

2. If interview type is Technical:
   Ask technical concept questions specifically related
   to the selected job role.

3. If interview type is Coding:
   Ask programming, coding, algorithm, debugging or
   problem-solving questions appropriate for the selected role.

4. The JOB ROLE is extremely important.

Examples:

HR + Frontend Developer:
Ask HR/behavioral questions involving frontend development,
projects, teamwork, deadlines, communication and technical situations.

Technical + Frontend Developer:
Ask JavaScript, React, HTML, CSS, browser, API and frontend
technical questions.

Coding + Java Developer:
Ask Java coding, OOP, arrays, strings, data structures,
algorithms and problem-solving questions.

Technical + Data Analyst:
Ask SQL, Excel, statistics, data cleaning, dashboards,
Python/pandas and analytical concepts.

HR + Data Analyst:
Ask behavioral questions related to data analysis projects,
business problems, communication with stakeholders and
working with data.

Coding + Data Analyst:
Ask coding/problem-solving questions using Python, SQL,
data manipulation and analytical problem solving.

Technical + Java Developer:
Ask Java, OOP, collections, exception handling, multithreading,
JVM and related technical questions.

Technical + Backend Developer:
Ask APIs, Node.js, Express, databases, authentication,
server-side concepts and backend architecture.

Technical + Full Stack Developer:
Ask frontend, backend, APIs, databases and full-stack concepts.

Technical + Data Scientist:
Ask Python, statistics, machine learning, pandas,
model evaluation and data science concepts.

Do NOT give generic questions that could apply to every role.

The questions should progress from easier to more challenging.

Do not include answers.

Return ONLY valid JSON.

Return exactly this structure:

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

      // ------------------------------------
      // CALL GEMINI
      // ------------------------------------

      console.log(
        "Sending question request to Gemini..."
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
                type:
                  "object",
              },
            }),
          }
        );

      // ------------------------------------
      // READ GEMINI RESPONSE
      // ------------------------------------

      const geminiData =
        await geminiResponse.json();

      console.log(
        "Gemini HTTP status:",
        geminiResponse.status
      );

      // ------------------------------------
      // GEMINI ERROR
      // ------------------------------------

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

      // ------------------------------------
      // EXTRACT AI TEXT
      // ------------------------------------

      let aiText = "";

      // output_text
      if (
        typeof geminiData.output_text ===
        "string"
      ) {
        aiText =
          geminiData.output_text;
      }

      // output array
      if (
        !aiText &&
        Array.isArray(
          geminiData.output
        )
      ) {
        for (
          const item of
            geminiData.output
        ) {
          if (
            typeof item ===
            "string"
          ) {
            aiText += item;
          }

          if (
            item &&
            typeof item.text ===
            "string"
          ) {
            aiText +=
              item.text;
          }

          if (
            item &&
            typeof item.content ===
            "string"
          ) {
            aiText +=
              item.content;
          }
        }
      }

      // steps
      if (
        !aiText &&
        Array.isArray(
          geminiData.steps
        )
      ) {
        for (
          const step of
            geminiData.steps
        ) {
          if (
            Array.isArray(
              step.content
            )
          ) {
            for (
              const content of
                step.content
            ) {
              if (
                typeof content.text ===
                "string"
              ) {
                aiText +=
                  content.text;
              }
            }
          }

          if (
            typeof step.text ===
            "string"
          ) {
            aiText +=
              step.text;
          }
        }
      }

      console.log(
        "Gemini raw question response:"
      );

      console.log(
        aiText
      );

      // ------------------------------------
      // EMPTY RESPONSE
      // ------------------------------------

      if (!aiText) {
        return res.status(500).json({
          message:
            "Gemini returned an empty response",

          error:
            "Could not extract text from Gemini response",

          rawResponse:
            geminiData,
        });
      }

      // ------------------------------------
      // CLEAN JSON
      // ------------------------------------

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

      // ------------------------------------
      // PARSE JSON
      // ------------------------------------

      let parsedData;

      try {
        parsedData =
          JSON.parse(
            cleanedText
          );
      } catch (parseError) {
        console.log(
          "Gemini question JSON parse error:",
          parseError
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

      // ------------------------------------
      // VALIDATE QUESTIONS
      // ------------------------------------

      if (
        !parsedData ||
        !Array.isArray(
          parsedData.questions
        )
      ) {
        return res.status(500).json({
          message:
            "Gemini returned invalid question data",

          error:
            "questions array was not found",
        });
      }

      const questions =
        parsedData.questions
          .filter(
            (question) =>
              typeof question ===
              "string"
          )
          .map(
            (question) =>
              question.trim()
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
            "Gemini did not generate exactly 5 questions",

          error:
            `Expected 5 questions but received ${questions.length}`,

          questions:
            questions,
        });
      }

      // ------------------------------------
      // SAVE QUESTIONS
      // ------------------------------------

      interview.questions =
        questions;

      await interview.save();

      console.log(
        "AI questions saved successfully."
      );

      console.log(
        questions
      );

      // ------------------------------------
      // SEND QUESTIONS
      // ------------------------------------

      res.json({
        message:
          "AI questions generated successfully",

        questions:
          questions,
      });

      console.log(
        "================================"
      );
    } catch (error) {
      console.log(
        "================================"
      );

      console.log(
        "GEMINI QUESTION GENERATION ERROR:"
      );

      console.log(
        error
      );

      console.log(
        "================================"
      );

      res.status(500).json({
        message:
          "Failed to generate AI questions",

        error:
          error.message ||
          "Unknown Gemini error",
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
        questions:
          interview.questions || [],
      });
    } catch (error) {
      console.log(
        "Error fetching questions:",
        error
      );

      res.status(500).json({
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

      // ------------------------------------
      // CHECK GEMINI API KEY
      // ------------------------------------

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

      // ------------------------------------
      // FIND INTERVIEW
      // ------------------------------------

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

      // ------------------------------------
      // CHECK ANSWERS
      // ------------------------------------

      if (
        !interview.answers ||
        interview.answers.length === 0
      ) {
        return res.status(400).json({
          message:
            "No answers found for this interview",
        });
      }

      // ------------------------------------
      // PREPARE ANSWERS
      // ------------------------------------

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

      // ------------------------------------
      // PROMPT
      // ------------------------------------

      const prompt = `
You are an expert professional interview evaluator.

Evaluate the candidate's interview answers.

Interview Type:
${interview.interviewType}

Role:
${interview.role}

Candidate Answers:

${answerText}

Evaluate the candidate from 0 to 10 in these areas:

1. Overall score
2. Communication
3. Relevance
4. Clarity

Also provide:

5. Short overall feedback
6. Specific improvement suggestions

Important:

- Evaluate the actual answers.
- Be realistic and fair.
- Consider the candidate's role.
- Consider the interview type.
- Do not give 10 unless the answer is excellent.
- Keep feedback concise.
- Return ONLY a JSON object.
- Do NOT use markdown.
- Do NOT use code fences.

Return exactly:

{
  "score": 0,
  "communicationScore": 0,
  "relevanceScore": 0,
  "clarityScore": 0,
  "feedback": "short overall feedback",
  "improvements": "specific improvement suggestions"
}
`;

      // ------------------------------------
      // GEMINI API
      // ------------------------------------

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
                type:
                  "object",
              },
            }),
          }
        );

      // ------------------------------------
      // READ RESPONSE
      // ------------------------------------

      const geminiData =
        await geminiResponse.json();

      console.log(
        "Gemini HTTP status:",
        geminiResponse.status
      );

      // ------------------------------------
      // HANDLE GEMINI ERROR
      // ------------------------------------

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

      // ------------------------------------
      // EXTRACT RESPONSE
      // ------------------------------------

      let aiText = "";

      if (
        typeof geminiData.output_text ===
        "string"
      ) {
        aiText =
          geminiData.output_text;
      }

      if (
        !aiText &&
        Array.isArray(
          geminiData.output
        )
      ) {
        for (
          const item of
            geminiData.output
        ) {
          if (
            typeof item ===
            "string"
          ) {
            aiText += item;
          }

          if (
            item &&
            typeof item.text ===
            "string"
          ) {
            aiText +=
              item.text;
          }

          if (
            item &&
            typeof item.content ===
            "string"
          ) {
            aiText +=
              item.content;
          }
        }
      }

      if (
        !aiText &&
        Array.isArray(
          geminiData.steps
        )
      ) {
        for (
          const step of
            geminiData.steps
        ) {
          if (
            Array.isArray(
              step.content
            )
          ) {
            for (
              const content of
                step.content
            ) {
              if (
                typeof content.text ===
                "string"
              ) {
                aiText +=
                  content.text;
              }
            }
          }

          if (
            typeof step.text ===
            "string"
          ) {
            aiText +=
              step.text;
          }
        }
      }

      console.log(
        "Gemini raw response:"
      );

      console.log(
        aiText
      );

      // ------------------------------------
      // EMPTY RESPONSE
      // ------------------------------------

      if (!aiText) {
        return res.status(500).json({
          message:
            "Gemini returned an empty response",

          error:
            "Could not extract text from Gemini response",

          rawResponse:
            geminiData,
        });
      }

      // ------------------------------------
      // CLEAN JSON
      // ------------------------------------

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

      // ------------------------------------
      // PARSE JSON
      // ------------------------------------

      let evaluation;

      try {
        evaluation =
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
            "Gemini returned invalid JSON",

          error:
            parseError.message,

          rawResponse:
            aiText,
        });
      }

      // ------------------------------------
      // VALIDATE SCORES
      // ------------------------------------

      const scores = [
        evaluation.score,
        evaluation.communicationScore,
        evaluation.relevanceScore,
        evaluation.clarityScore,
      ];

      const invalidScore =
        scores.some(
          (score) =>
            typeof score !==
              "number" ||
            score < 0 ||
            score > 10
        );

      if (invalidScore) {
        return res.status(500).json({
          message:
            "Gemini returned invalid scores",

          error:
            "Scores must be numbers between 0 and 10",

          evaluation:
            evaluation,
        });
      }

      // ------------------------------------
      // SAVE EVALUATION
      // ------------------------------------

      interview.score =
        evaluation.score;

      interview.communicationScore =
        evaluation.communicationScore;

      interview.relevanceScore =
        evaluation.relevanceScore;

      interview.clarityScore =
        evaluation.clarityScore;

      interview.feedback =
        evaluation.feedback ||
        "";

      interview.improvements =
        evaluation.improvements ||
        "";

      await interview.save();

      console.log(
        "Gemini evaluation saved successfully."
      );

      // ------------------------------------
      // SEND RESULT
      // ------------------------------------

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
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);