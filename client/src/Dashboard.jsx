import { useEffect, useState } from "react";

function Dashboard({ onStartInterview, onLogout }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/interviews",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to fetch interviews"
        );
        setLoading(false);
        return;
      }

      setInterviews(data.interviews || []);
    } catch (error) {
      console.log(error);
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  // =========================================
  // STATS
  // =========================================

  const totalInterviews = interviews.length;

  const completedInterviews = interviews.filter(
    (interview) =>
      interview.answers &&
      interview.answers.length === 5
  ).length;

  // Abhi AI score nahi hai,
  // isliye average score baad mein add karenge.
  const averageScore = "--";

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

        <button
          className="logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>

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
                onClick={onStartInterview}
              >
                Start Your First Interview
              </button>

            </div>

          )}


        {!loading &&
          !error &&
          interviews.length > 0 && (

            <div className="interview-history">

              {interviews.map((interview) => (

                <div
                  className="history-card"
                  key={interview._id}
                >

                  <div className="history-info">

                    <div className="history-icon">
                      {interview.interviewType === "HR"
                        ? "👔"
                        : interview.interviewType ===
                          "Technical"
                        ? "💻"
                        : "⌨️"}
                    </div>

                    <div>

                      <h3>
                        {interview.interviewType} Interview
                      </h3>

                      <p>
                        {interview.role}
                      </p>

                    </div>

                  </div>


                  <div className="history-details">

                    <span>
                      {interview.answers?.length || 0}/5
                      Answers
                    </span>

                    <span>
                      {new Date(
                        interview.createdAt
                      ).toLocaleDateString()}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

      </section>

    </div>
  );
}

export default Dashboard;