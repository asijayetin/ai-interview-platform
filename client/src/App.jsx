import { useState } from "react";
import "./App.css";

import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Interview from "./Interview";

function App() {

  // ========================================
  // GET INITIAL PAGE
  // ========================================

  const getInitialPage = () => {

    const savedPage =
      localStorage.getItem("currentPage");

    const token =
      localStorage.getItem("token");

    // Public pages can stay on the same page
    // even when user is not logged in.
    const publicPages = [
      "home",
      "login",
      "signup",
    ];

    // If saved page exists and:
    // 1. User is logged in
    // OR
    // 2. Saved page is a public page
    //
    // then restore that page.
    if (
      savedPage &&
      (
        token ||
        publicPages.includes(savedPage)
      )
    ) {
      return savedPage;
    }

    // If user is logged in but
    // no valid page was saved
    if (token) {
      return "dashboard";
    }

    // Otherwise open home
    return "home";
  };


  const [page, setPageState] =
    useState(getInitialPage);


  // ========================================
  // CHANGE PAGE
  // ========================================

  const setPage = (newPage) => {

    setPageState(newPage);

    localStorage.setItem(
      "currentPage",
      newPage
    );
  };


  return (
    <div className="app">

      {/* ====================================
          NAVBAR
      ==================================== */}

      {page !== "dashboard" &&
        page !== "interview" && (

          <header className="navbar">

            <div
              className="logo"
              onClick={() =>
                setPage("home")
              }
              style={{
                cursor: "pointer",
              }}
            >
              AI Interview Arena
            </div>


            <nav className="nav-links">

              <a href="#home">
                Home
              </a>

              <a href="#features">
                Features
              </a>

              <a href="#about">
                About
              </a>

            </nav>


            <div className="nav-buttons">

              <button
                className="login-btn"
                onClick={() =>
                  setPage("login")
                }
              >
                Login
              </button>


              <button
                className="signup-btn"
                onClick={() =>
                  setPage("signup")
                }
              >
                Sign Up
              </button>

            </div>

          </header>
        )}


      {/* ====================================
          LOGIN
      ==================================== */}

      {page === "login" && (

        <Login

          onSignupClick={() =>
            setPage("signup")
          }

          onLoginSuccess={() =>
            setPage("dashboard")
          }

        />

      )}


      {/* ====================================
          SIGNUP
      ==================================== */}

      {page === "signup" && (

        <Signup

          onLoginClick={() =>
            setPage("login")
          }

        />

      )}


      {/* ====================================
          DASHBOARD
      ==================================== */}

      {page === "dashboard" && (

        <Dashboard

          onStartInterview={() =>
            setPage("interview")
          }


          onLogout={() => {

            // Remove login data
            localStorage.removeItem(
              "token"
            );

            localStorage.removeItem(
              "user"
            );

            // Remove current page
            localStorage.removeItem(
              "currentPage"
            );

            // Remove saved interview session
            localStorage.removeItem(
              "activeInterviewSession"
            );

            // Go to home
            setPageState("home");

          }}

        />

      )}


      {/* ====================================
          INTERVIEW
      ==================================== */}

      {page === "interview" && (

        <Interview

          onBackToDashboard={() =>
            setPage("dashboard")
          }

        />

      )}


      {/* ====================================
          HOME
      ==================================== */}

      {page === "home" && (

        <>

          <main>

            {/* ====================================
                HERO
            ==================================== */}

            <section
              id="home"
              className="hero"
            >

              <div className="hero-content">

                <p className="small-heading">
                  AI POWERED INTERVIEW PRACTICE
                </p>


                <h1>
                  Ace Your Next
                  <span> Interview</span>
                </h1>


                <p className="hero-text">
                  Practice realistic interviews with an AI
                  interviewer, get instant feedback and improve
                  your confidence.
                </p>


                <div className="hero-buttons">

                  <button
                    className="primary-btn"
                    onClick={() =>
                      setPage("signup")
                    }
                  >
                    Start Interview →
                  </button>


                  <button className="secondary-btn">
                    Learn More
                  </button>

                </div>

              </div>


              {/* HERO CARD */}

              <div className="hero-card">

                <div className="card-header">

                  <span>
                    ●
                  </span>

                  Live AI Interview

                </div>


                <div className="question-box">

                  <p className="ai-label">
                    AI INTERVIEWER
                  </p>


                  <h3>
                    Tell me about yourself.
                  </h3>


                  <div className="fake-input">
                    Type your answer...
                  </div>


                  <button className="card-btn">
                    Submit Answer
                  </button>

                </div>

              </div>

            </section>


            {/* ====================================
                FEATURES
            ==================================== */}

            <section
              id="features"
              className="features"
            >

              <div className="section-heading">

                <p className="small-heading">
                  FEATURES
                </p>


                <h2>
                  Everything you need to prepare
                </h2>


                <p>
                  Practice smarter and become
                  interview-ready.
                </p>

              </div>


              <div className="feature-grid">

                {/* FEATURE 1 */}

                <div className="feature-card">

                  <div className="feature-icon">
                    🤖
                  </div>


                  <h3>
                    AI Interviewer
                  </h3>


                  <p>
                    Practice with AI-generated
                    interview questions based
                    on your role.
                  </p>

                </div>


                {/* FEATURE 2 */}

                <div className="feature-card">

                  <div className="feature-icon">
                    🎯
                  </div>


                  <h3>
                    Personalized Practice
                  </h3>


                  <p>
                    Choose HR, Technical or
                    Coding rounds according
                    to your needs.
                  </p>

                </div>


                {/* FEATURE 3 */}

                <div className="feature-card">

                  <div className="feature-icon">
                    📊
                  </div>


                  <h3>
                    Detailed Feedback
                  </h3>


                  <p>
                    Get scores and actionable
                    feedback to improve your
                    performance.
                  </p>

                </div>

              </div>

            </section>


            {/* ====================================
                ABOUT
            ==================================== */}

            <section
              id="about"
              className="about"
            >

              <h2>
                Prepare. Practice. Perform.
              </h2>


              <p>
                AI Interview Arena helps you
                practice interviews in a realistic
                environment before facing the real one.
              </p>

            </section>

          </main>


          {/* ====================================
              FOOTER
          ==================================== */}

          <footer className="footer">

            <div>

              <h3>
                AI Interview Arena
              </h3>


              <p>
                Your AI-powered interview
                practice partner.
              </p>

            </div>


            <div className="footer-links">

              <a href="#home">
                Home
              </a>

              <a href="#features">
                Features
              </a>

              <a href="#about">
                About
              </a>

              <a href="#">
                Terms
              </a>

              <a href="#">
                Privacy
              </a>

            </div>


            <p className="copyright">
              © 2026 AI Interview Arena.
              All rights reserved.
            </p>

          </footer>

        </>

      )}

    </div>
  );
}

export default App;