import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const SELECTED_INTERVIEW_KEY =
  "selectedInterviewId";

function Dashboard({ onStartInterview, onProfile, onLogout }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // HISTORY FILTER + SORT
  // =========================================

  const [interviewTypeFilter, setInterviewTypeFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("newest");

  // =========================================
  // SELECTED INTERVIEW
  // =========================================

  const [selectedInterviewId, setSelectedInterviewId] =
    useState(() => {
      return localStorage.getItem(
        SELECTED_INTERVIEW_KEY
      );
    });

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // =========================================
  // FETCH INTERVIEWS
  // =========================================

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/interviews`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            "Failed to fetch interviews"
        );

        setLoading(false);
        return;
      }

      setInterviews(
        data.interviews || []
      );
    } catch (error) {
      console.log(error);

      setError(
        "Server error. Please try again."
      );
    }

    setLoading(false);
  };

  // =========================================
  // STATS
  // =========================================

  const totalInterviews =
    interviews.length;

  const completedInterviews =
    interviews.filter(
      (interview) =>
        interview.answers &&
        interview.answers.length === 5
    ).length;

  const evaluatedInterviews =
    interviews.filter(
      (interview) =>
        interview.score !== null &&
        interview.score !== undefined
    );

  const averageScore =
    evaluatedInterviews.length > 0
      ? (
          evaluatedInterviews.reduce(
            (total, interview) =>
              total + Number(interview.score),
            0
          ) / evaluatedInterviews.length
        ).toFixed(1)
      : "--";

  const bestScore =
    evaluatedInterviews.length > 0
      ? Math.max(
          ...evaluatedInterviews.map(
            (interview) =>
              Number(interview.score)
          )
        )
      : "--";

  // =========================================
  // FILTER + SORT INTERVIEWS
  // =========================================

  const filteredInterviews = [...interviews]
    .filter((interview) => {
      if (interviewTypeFilter === "All") {
        return true;
      }

      return (
        interview.interviewType ===
        interviewTypeFilter
      );
    })
    .sort((a, b) => {
      // Oldest first
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        );
      }

      // Highest score
      if (sortBy === "highest") {
        const scoreA =
          a.score !== null &&
          a.score !== undefined
            ? Number(a.score)
            : -1;

        const scoreB =
          b.score !== null &&
          b.score !== undefined
            ? Number(b.score)
            : -1;

        return scoreB - scoreA;
      }

      // Lowest score
      if (sortBy === "lowest") {
        const scoreA =
          a.score !== null &&
          a.score !== undefined
            ? Number(a.score)
            : 11;

        const scoreB =
          b.score !== null &&
          b.score !== undefined
            ? Number(b.score)
            : 11;

        return scoreA - scoreB;
      }

      // Newest first
      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    });

  // =========================================
  // OPEN INTERVIEW HISTORY
  // =========================================

  const openInterviewHistory = (
    interview
  ) => {
    setSelectedInterviewId(
      interview._id
    );

    localStorage.setItem(
      SELECTED_INTERVIEW_KEY,
      interview._id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // BACK TO DASHBOARD
  // =========================================

  const backToDashboard = () => {
    setSelectedInterviewId(null);

    localStorage.removeItem(
      SELECTED_INTERVIEW_KEY
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // SELECTED INTERVIEW OBJECT
  // =========================================

  const selectedInterview =
    interviews.find(
      (interview) =>
        interview._id ===
        selectedInterviewId
    );

  // =========================================
  // INTERVIEW HISTORY PAGE
  // =========================================

  if (
    !loading &&
    selectedInterviewId &&
    selectedInterview
  ) {
    const interview =
      selectedInterview;

    const answers =
      interview.answers || [];

    const isCompleted =
      answers.length === 5;

    return (
      <div className="dashboard">

        {/* ================================= */}
        {/* HISTORY HEADER */}
        {/* ================================= */}

        <div
          className="dashboard-header"
        >
          <div>

            <h1>
              Interview History
            </h1>

            <p>
              Review your interview performance
              and answers.
            </p>

          </div>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>


        {/* ================================= */}
        {/* BACK BUTTON */}
        {/* ================================= */}

        <button
          className="secondary-btn"
          onClick={backToDashboard}
          style={{
            marginBottom: "25px",
          }}
        >
          ← Back to Dashboard
        </button>


        {/* ================================= */}
        {/* INTERVIEW SUMMARY */}
        {/* ================================= */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dbe3ef",
            borderRadius: "16px",
            padding: "30px",
            marginBottom: "25px",
            boxShadow:
              "0 8px 25px rgba(15, 23, 42, 0.06)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >

            <div>

              <p
                className="small-heading"
                style={{
                  marginBottom: "8px",
                }}
              >
                {isCompleted
                  ? "COMPLETED INTERVIEW"
                  : "INTERVIEW IN PROGRESS"}
              </p>

              <h2
                style={{
                  marginBottom: "8px",
                }}
              >
                {interview.interviewType}{" "}
                Interview
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                {interview.role}
              </p>

              <p
                style={{
                  marginTop: "8px",
                  marginBottom: 0,
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                {new Date(
                  interview.createdAt
                ).toLocaleDateString()}
              </p>

            </div>


            {/* SCORE */}

            <div
              style={{
                minWidth: "150px",
                textAlign: "center",
                padding: "18px",
                borderRadius: "14px",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Overall Score
              </p>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "34px",
                  color: "#0f172a",
                }}
              >
                {interview.score !==
                  null &&
                interview.score !==
                  undefined
                  ? interview.score
                  : "--"}

                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  /10
                </span>

              </strong>

            </div>

          </div>

        </section>


        {/* ================================= */}
        {/* PERFORMANCE SCORES */}
        {/* ================================= */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dbe3ef",
            borderRadius: "16px",
            padding: "30px",
            marginBottom: "25px",
            boxShadow:
              "0 8px 25px rgba(15, 23, 42, 0.06)",
          }}
        >

          <h2
            style={{
              marginBottom: "22px",
            }}
          >
            Performance Breakdown
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >

            {/* COMMUNICATION */}

            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                Communication
              </p>

              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                  fontSize: "26px",
                }}
              >
                {interview.communicationScore !==
                  null &&
                interview.communicationScore !==
                  undefined
                  ? interview.communicationScore
                  : "--"}

                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  /10
                </span>

              </strong>

            </div>


            {/* RELEVANCE */}

            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                Relevance
              </p>

              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                  fontSize: "26px",
                }}
              >
                {interview.relevanceScore !==
                  null &&
                interview.relevanceScore !==
                  undefined
                  ? interview.relevanceScore
                  : "--"}

                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  /10
                </span>

              </strong>

            </div>


            {/* CLARITY */}

            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                Clarity
              </p>

              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                  fontSize: "26px",
                }}
              >
                {interview.clarityScore !==
                  null &&
                interview.clarityScore !==
                  undefined
                  ? interview.clarityScore
                  : "--"}

                <span
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  /10
                </span>

              </strong>

            </div>

          </div>

        </section>


        {/* ================================= */}
        {/* QUESTIONS & ANSWERS */}
        {/* ================================= */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dbe3ef",
            borderRadius: "16px",
            padding: "30px",
            marginBottom: "25px",
            boxShadow:
              "0 8px 25px rgba(15, 23, 42, 0.06)",
          }}
        >

          <h2
            style={{
              marginBottom: "25px",
            }}
          >
            Questions & Answers
          </h2>


          {answers.length === 0 ? (

            <div
              style={{
                padding: "25px",
                borderRadius: "12px",
                background: "#f8fafc",
                color: "#64748b",
              }}
            >
              No answers have been submitted
              for this interview yet.
            </div>

          ) : (

            <div>

              {answers.map(
                (item, index) => (

                  <div
                    key={index}
                    style={{
                      padding: "22px",
                      marginBottom:
                        index ===
                        answers.length - 1
                          ? "0"
                          : "18px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border:
                        "1px solid #e2e8f0",
                    }}
                  >

                    {/* QUESTION */}

                    <p
                      style={{
                        marginTop: 0,
                        marginBottom:
                          "12px",
                        fontWeight: "700",
                        fontSize: "16px",
                        color: "#0f172a",
                      }}
                    >
                      Q{index + 1}.{" "}
                      {item.question}
                    </p>


                    {/* ANSWER */}

                    <div
                      style={{
                        padding: "16px",
                        background:
                          "#ffffff",
                        borderRadius:
                          "10px",
                        border:
                          "1px solid #e2e8f0",
                      }}
                    >

                      <p
                        style={{
                          marginTop: 0,
                          marginBottom:
                            "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#64748b",
                          textTransform:
                            "uppercase",
                        }}
                      >
                        Your Answer
                      </p>

                      <p
                        style={{
                          margin: 0,
                          lineHeight: "1.7",
                          color: "#334155",
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {item.answer ||
                          "No answer recorded."}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ================================= */}
        {/* AI FEEDBACK */}
        {/* ================================= */}

        {(
          interview.feedback ||
          interview.improvements
        ) && (

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #dbe3ef",
              borderRadius: "16px",
              padding: "30px",
              marginBottom: "25px",
              boxShadow:
                "0 8px 25px rgba(15, 23, 42, 0.06)",
            }}
          >

            <h2
              style={{
                marginBottom: "20px",
              }}
            >
              AI Feedback
            </h2>


            {/* FEEDBACK */}

            {interview.feedback && (

              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  marginBottom:
                    interview.improvements
                      ? "18px"
                      : "0",
                }}
              >

                <h3
                  style={{
                    marginTop: 0,
                    marginBottom:
                      "10px",
                  }}
                >
                  Overall Feedback
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    lineHeight: "1.7",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {interview.feedback}
                </p>

              </div>

            )}


            {/* IMPROVEMENTS */}

            {interview.improvements && (

              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <h3
                  style={{
                    marginTop: 0,
                    marginBottom:
                      "10px",
                  }}
                >
                  Areas to Improve
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    lineHeight: "1.7",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {interview.improvements}
                </p>

              </div>

            )}

          </section>

        )}


        {/* ================================= */}
        {/* BACK BUTTON */}
        {/* ================================= */}

        <button
          className="primary-btn"
          onClick={backToDashboard}
        >
          ← Back to Dashboard
        </button>

      </div>
    );
  }

  // =========================================
  // NORMAL DASHBOARD
  // =========================================

  return (
    <div className="dashboard">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>

          <h1>
            AI Interview Arena
          </h1>

          <p>
            Your personal interview preparation dashboard
          </p>

        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="secondary-btn"
            onClick={onProfile}
          >
            Profile
          </button>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

      </div>


      {/* WELCOME */}

      <section className="welcome-section">

        <p className="small-heading">
          DASHBOARD
        </p>

        <h2>
          Welcome, {user?.name || "User"} 👋
        </h2>

        <p>
          Ready to practice and improve your interview skills?
        </p>

      </section>


      {/* START INTERVIEW */}

      <section className="start-interview-card">

        <div>

          <span className="dashboard-icon">
            🎤
          </span>

          <h3>
            Start a New Interview
          </h3>

          <p>
            Practice HR, Technical, or Coding interviews
            with our AI-powered platform.
          </p>

        </div>

        <button
          className="primary-btn"
          onClick={onStartInterview}
        >
          Start Interview →
        </button>

      </section>


      {/* STATS */}

      <section className="dashboard-stats">

        <div className="stat-card">

          <span>📝</span>

          <div>

            <h3>
              {totalInterviews}
            </h3>

            <p>
              Total Interviews
            </p>

          </div>

        </div>


        <div className="stat-card">

          <span>📊</span>

          <div>

            <h3>
              {averageScore}
            </h3>

            <p>
              Average Score
            </p>

          </div>

        </div>


        <div className="stat-card">

          <span>🏆</span>

          <div>

            <h3>
              {bestScore}
            </h3>

            <p>
              Best Score
            </p>

          </div>

        </div>


        <div className="stat-card">

          <span>✅</span>

          <div>

            <h3>
              {completedInterviews}
            </h3>

            <p>
              Completed
            </p>

          </div>

        </div>

      </section>


      {/* RECENT INTERVIEWS */}

      <section className="recent-section">

        <div className="section-title">

          <h2>
            Recent Interviews
          </h2>

          <p>
            Your latest interview attempts.
          </p>

        </div>


        {loading && (

          <div className="empty-interviews">

            <h3>
              Loading interviews...
            </h3>

          </div>

        )}


        {error && !loading && (

          <div className="empty-interviews">

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error &&
          interviews.length === 0 && (

            <div className="empty-interviews">

              <div className="empty-icon">
                📋
              </div>

              <h3>
                No interviews yet
              </h3>

              <p>
                Start your first interview to see your
                history here.
              </p>

              <button
                className="secondary-btn"
                onClick={
                  onStartInterview
                }
              >
                Start Your First Interview
              </button>

            </div>

          )}


        {!loading &&
          !error &&
          interviews.length > 0 && (

            <div>

              {/* ================================= */}
              {/* FILTER + SORT CONTROLS */}
              {/* ================================= */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >

                  <label
                    style={{
                      fontWeight: "600",
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    Filter:
                  </label>

                  <select
                    value={interviewTypeFilter}
                    onChange={(e) =>
                      setInterviewTypeFilter(
                        e.target.value
                      )
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >

                    <option value="All">
                      All Interviews
                    </option>

                    <option value="HR">
                      HR
                    </option>

                    <option value="Technical">
                      Technical
                    </option>

                    <option value="Coding">
                      Coding
                    </option>

                  </select>

                </div>


                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >

                  <label
                    style={{
                      fontWeight: "600",
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    Sort:
                  </label>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value)
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >

                    <option value="newest">
                      Newest First
                    </option>

                    <option value="oldest">
                      Oldest First
                    </option>

                    <option value="highest">
                      Highest Score
                    </option>

                    <option value="lowest">
                      Lowest Score
                    </option>

                  </select>

                </div>

              </div>


              {filteredInterviews.length === 0 ? (

                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                  }}
                >
                  No interviews found for this filter.
                </div>

              ) : (

                <div className="interview-history">

                  {filteredInterviews.map(
                    (interview) => (

                      <div
                        className="history-card"
                        key={interview._id}
                        onClick={() =>
                          openInterviewHistory(
                            interview
                          )
                        }
                        style={{
                          cursor: "pointer",
                        }}
                        title="Click to view interview history"
                      >

                        <div className="history-info">

                          <div className="history-icon">

                            {interview.interviewType ===
                            "HR"
                              ? "👔"
                              : interview.interviewType ===
                                "Technical"
                              ? "💻"
                              : "⌨️"}

                          </div>

                          <div>

                            <h3>
                              {interview.interviewType}{" "}
                              Interview
                            </h3>

                            <p>
                              {interview.role}
                            </p>

                          </div>

                        </div>


                        <div className="history-details">

                          <span>
                            {interview.answers?.length ||
                              0}
                            /5 Answers
                          </span>


                          {/* SCORE */}

                          <span>
                            {interview.score !==
                              null &&
                            interview.score !==
                              undefined
                              ? `${interview.score}/10`
                              : "Score --"}
                          </span>


                          <span>
                            {new Date(
                              interview.createdAt
                            ).toLocaleDateString()}
                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          )}

      </section>

    </div>
  );
}

export default Dashboard;