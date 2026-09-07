import { useState } from "react";

function Interview({ onBackToDashboard }) {
  const [interviewType, setInterviewType] = useState("");
  const [role, setRole] = useState("");

  const [started, setStarted] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  const [interviewId, setInterviewId] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");

  const [completed, setCompleted] = useState(false);

  const [evaluation, setEvaluation] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const questions = [
    "Tell me about yourself.",
    "Why should we hire you?",
    "What are your strengths and weaknesses?",
    "Tell me about a challenging project you worked on.",
    "Where do you see yourself in five years?",
  ];

  // --------------------------------
  // START INTERVIEW
  // --------------------------------

  const startInterview = async () => {
    setError("");

    if (!interviewType || !role) {
      setError("Please select interview type and role.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/interviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            interviewType,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            "Failed to start interview."
        );

        setLoading(false);
        return;
      }

      setInterviewId(data.interview._id);

      setStarted(true);

      console.log(
        "Interview created:",
        data.interview
      );
    } catch (error) {
      console.log(
        "Start interview error:",
        error
      );

      setError(
        "Server error. Please make sure the backend is running."
      );
    }

    setLoading(false);
  };

  // --------------------------------
  // CONTINUE TO QUESTIONS
  // --------------------------------

  const continueToQuestions = () => {
    setShowQuestions(true);
    setCurrentQuestion(0);
    setAnswer("");
    setError("");
  };

  // --------------------------------
  // SUBMIT ANSWER
  // --------------------------------

  const submitAnswer = async () => {
    setError("");

    if (!answer.trim()) {
      setError("Please enter your answer.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    if (!interviewId) {
      setError("Interview ID not found.");
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/interviews/${interviewId}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question:
              questions[currentQuestion],
            answer: answer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            "Failed to save answer."
        );

        setLoading(false);
        return;
      }

      console.log(
        "Answer saved:",
        data.interview
      );

      // Last question
      if (
        currentQuestion ===
        questions.length - 1
      ) {
        setAnswer("");

        // Evaluate interview
        await evaluateInterview();
      } else {
        setCurrentQuestion(
          currentQuestion + 1
        );

        setAnswer("");
      }
    } catch (error) {
      console.log(
        "Submit answer error:",
        error
      );

      setError(
        "Server error. Please try again."
      );
    }

    setLoading(false);
  };

  // --------------------------------
  // AI EVALUATION
  // --------------------------------

  const evaluateInterview = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    if (!interviewId) {
      setError("Interview ID not found.");
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      console.log(
        "Starting AI evaluation..."
      );

      const response = await fetch(
        `${API_URL}/api/interviews/${interviewId}/evaluate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Try to read JSON response
      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.log(
          "Could not parse server response:",
          jsonError
        );

        setError(
          `Server returned an invalid response. Status: ${response.status}`
        );

        return;
      }

      console.log(
        "Evaluation response:",
        data
      );

      // --------------------------------
      // HANDLE BACKEND ERROR
      // --------------------------------

      if (!response.ok) {
        const actualError =
          data.error ||
          data.message ||
          `AI evaluation failed. Status: ${response.status}`;

        console.log(
          "Actual AI error:",
          actualError
        );

        setError(actualError);

        return;
      }

      // --------------------------------
      // CHECK EVALUATION DATA
      // --------------------------------

      if (!data.evaluation) {
        setError(
          "AI evaluation completed but no evaluation data was returned."
        );

        return;
      }

      console.log(
        "AI evaluation successful:",
        data.evaluation
      );

      setEvaluation(data.evaluation);

      setCompleted(true);

      setShowQuestions(false);
    } catch (error) {
      console.log(
        "Evaluation error:",
        error
      );

      setError(
        `Failed to evaluate interview: ${error.message}`
      );
    }
  };

  return (
    <div className="interview-page">
      <div className="interview-container">

        {/* -------------------------------- */}
        {/* TOP SECTION */}
        {/* -------------------------------- */}

        <div className="interview-top">
          <button
            className="back-btn"
            onClick={onBackToDashboard}
          >
            ← Dashboard
          </button>

          <h1>
            AI Interview
          </h1>

          <p>
            Practice your interview with our
            AI-powered platform.
          </p>
        </div>

        {/* -------------------------------- */}
        {/* INTERVIEW SETUP */}
        {/* -------------------------------- */}

        {!started && (
          <div className="interview-setup">
            <div className="setup-card">

              <h2>
                Choose Interview Type
              </h2>

              <p>
                Select the type of interview
                you want to practice.
              </p>

              <div className="type-grid">

                {/* HR */}

                <button
                  className={
                    interviewType === "HR"
                      ? "type-card selected"
                      : "type-card"
                  }
                  onClick={() =>
                    setInterviewType("HR")
                  }
                >
                  <span>👔</span>

                  <h3>
                    HR Interview
                  </h3>

                  <p>
                    Behavioral and personality
                    questions.
                  </p>
                </button>

                {/* TECHNICAL */}

                <button
                  className={
                    interviewType ===
                    "Technical"
                      ? "type-card selected"
                      : "type-card"
                  }
                  onClick={() =>
                    setInterviewType(
                      "Technical"
                    )
                  }
                >
                  <span>💻</span>

                  <h3>
                    Technical Interview
                  </h3>

                  <p>
                    Technical and concept-based
                    questions.
                  </p>
                </button>

                {/* CODING */}

                <button
                  className={
                    interviewType === "Coding"
                      ? "type-card selected"
                      : "type-card"
                  }
                  onClick={() =>
                    setInterviewType(
                      "Coding"
                    )
                  }
                >
                  <span>⌨️</span>

                  <h3>
                    Coding Interview
                  </h3>

                  <p>
                    Programming and
                    problem-solving questions.
                  </p>
                </button>

              </div>

              {/* ROLE */}

              <div className="role-section">

                <h2>
                  Select Your Role
                </h2>

                <p>
                  Choose the role you are
                  preparing for.
                </p>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select a role
                  </option>

                  <option value="Software Developer">
                    Software Developer
                  </option>

                  <option value="Java Developer">
                    Java Developer
                  </option>

                  <option value="Frontend Developer">
                    Frontend Developer
                  </option>

                  <option value="Backend Developer">
                    Backend Developer
                  </option>

                  <option value="Full Stack Developer">
                    Full Stack Developer
                  </option>

                  <option value="Data Analyst">
                    Data Analyst
                  </option>

                  <option value="Data Scientist">
                    Data Scientist
                  </option>
                </select>

              </div>

              {/* ERROR */}

              {error && (
                <p className="interview-error">
                  {error}
                </p>
              )}

              {/* START */}

              <button
                className="start-interview-btn"
                onClick={startInterview}
                disabled={loading}
              >
                {loading
                  ? "Starting..."
                  : "Start Interview →"}
              </button>

            </div>
          </div>
        )}

        {/* -------------------------------- */}
        {/* INTERVIEW STARTED */}
        {/* -------------------------------- */}

        {started &&
          !showQuestions &&
          !completed && (
            <div className="interview-started">

              <div className="started-card">

                <div className="success-icon">
                  ✓
                </div>

                <h2>
                  Interview Started!
                </h2>

                <p>
                  Your {interviewType} interview
                  for{" "}
                  <strong>
                    {role}
                  </strong>{" "}
                  has been created.
                </p>

                <p className="interview-id">
                  Interview ID:{" "}
                  {interviewId}
                </p>

                <button
                  className="primary-btn"
                  onClick={
                    continueToQuestions
                  }
                >
                  Continue to Questions →
                </button>

              </div>

            </div>
          )}

        {/* -------------------------------- */}
        {/* QUESTIONS */}
        {/* -------------------------------- */}

        {showQuestions &&
          !completed && (
            <div className="questions-section">

              <div className="question-card">

                {/* HEADER */}

                <div className="question-header">

                  <div>

                    <p className="small-heading">
                      {interviewType} INTERVIEW
                    </p>

                    <h2>
                      {role}
                    </h2>

                  </div>

                  <div className="question-count">
                    Question{" "}
                    {currentQuestion + 1}
                    {" "}
                    of{" "}
                    {questions.length}
                  </div>

                </div>

                {/* PROGRESS */}

                <div className="progress-container">

                  <div
                    className="progress-bar"
                    style={{
                      width:
                        `${
                          (
                            (currentQuestion + 1) /
                            questions.length
                          ) * 100
                        }%`,
                    }}
                  ></div>

                </div>

                {/* QUESTION */}

                <div className="question-content">

                  <p className="question-label">
                    QUESTION{" "}
                    {currentQuestion + 1}
                  </p>

                  <h2>
                    {
                      questions[
                        currentQuestion
                      ]
                    }
                  </h2>

                </div>

                {/* ANSWER */}

                <div className="answer-section">

                  <label>
                    Your Answer
                  </label>

                  <textarea
                    value={answer}
                    onChange={(e) =>
                      setAnswer(
                        e.target.value
                      )
                    }
                    placeholder="Type your answer here..."
                    rows="8"
                  ></textarea>

                </div>

                {/* ERROR */}

                {error && (
                  <p className="interview-error">
                    {error}
                  </p>
                )}

                {/* SUBMIT */}

                <button
                  className="start-interview-btn"
                  onClick={submitAnswer}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : currentQuestion ===
                      questions.length - 1
                    ? "Finish & Get AI Score 🤖"
                    : "Submit Answer →"}
                </button>

              </div>

            </div>
          )}

        {/* -------------------------------- */}
        {/* EVALUATION RESULT */}
        {/* -------------------------------- */}

        {completed &&
          evaluation && (
            <div className="evaluation-section">

              <div className="evaluation-card">

                <div className="success-icon">
                  ✓
                </div>

                <p className="small-heading">
                  AI EVALUATION
                </p>

                <h2>
                  Interview Completed!
                </h2>

                <p className="evaluation-subtitle">
                  Here is your AI-powered
                  interview performance.
                </p>

                {/* OVERALL SCORE */}

                <div className="overall-score">

                  <span>
                    Overall Score
                  </span>

                  <strong>
                    {evaluation.score}
                    <small>
                      /10
                    </small>
                  </strong>

                </div>

                {/* SCORE GRID */}

                <div className="score-grid">

                  <div className="score-box">

                    <span>
                      Communication
                    </span>

                    <strong>
                      {
                        evaluation.communicationScore
                      }
                      /10
                    </strong>

                  </div>

                  <div className="score-box">

                    <span>
                      Relevance
                    </span>

                    <strong>
                      {
                        evaluation.relevanceScore
                      }
                      /10
                    </strong>

                  </div>

                  <div className="score-box">

                    <span>
                      Clarity
                    </span>

                    <strong>
                      {
                        evaluation.clarityScore
                      }
                      /10
                    </strong>

                  </div>

                </div>

                {/* FEEDBACK */}

                <div className="feedback-box">

                  <h3>
                    AI Feedback
                  </h3>

                  <p>
                    {evaluation.feedback}
                  </p>

                </div>

                {/* IMPROVEMENTS */}

                <div className="feedback-box">

                  <h3>
                    Areas to Improve
                  </h3>

                  <p>
                    {evaluation.improvements}
                  </p>

                </div>

                {/* BACK */}

                <button
                  className="primary-btn"
                  onClick={
                    onBackToDashboard
                  }
                >
                  Back to Dashboard →
                </button>

              </div>

            </div>
          )}

      </div>
    </div>
  );
}

export default Interview;