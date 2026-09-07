import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const INTERVIEW_SESSION_KEY =
  "activeInterviewSession";

const getSavedInterviewSession = () => {
  try {
    const savedSession =
      localStorage.getItem(
        INTERVIEW_SESSION_KEY
      );

    if (!savedSession) {
      return null;
    }

    return JSON.parse(savedSession);
  } catch (error) {
    console.log(
      "Could not restore interview session:",
      error
    );

    localStorage.removeItem(
      INTERVIEW_SESSION_KEY
    );

    return null;
  }
};

function Interview({ onBackToDashboard }) {

  const savedSession =
    getSavedInterviewSession();

  const [interviewType, setInterviewType] =
    useState(
      savedSession?.interviewType || ""
    );

  const [role, setRole] =
    useState(
      savedSession?.role || ""
    );

  const [started, setStarted] =
    useState(
      savedSession?.started || false
    );

  const [showQuestions, setShowQuestions] =
    useState(
      savedSession?.showQuestions || false
    );

  const [interviewId, setInterviewId] =
    useState(
      savedSession?.interviewId || null
    );

  // ==========================================
  // QUESTIONS
  // ==========================================

  const [questions, setQuestions] =
    useState(
      savedSession?.questions || []
    );

  const [questionsLoading, setQuestionsLoading] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(
      savedSession?.currentQuestion || 0
    );

  // ==========================================
  // ANSWER
  // ==========================================

  const [answer, setAnswer] =
    useState(
      savedSession?.answer || ""
    );

  // ==========================================
  // EVALUATION
  // ==========================================

  const [completed, setCompleted] =
    useState(
      savedSession?.completed || false
    );

  const [evaluation, setEvaluation] =
    useState(
      savedSession?.evaluation || null
    );

  // ==========================================
  // GENERAL STATE
  // ==========================================

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ==========================================
  // CAMERA + MICROPHONE
  // ==========================================

  const videoRef = useRef(null);

  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [micActive, setMicActive] =
    useState(false);

  const [micError, setMicError] =
    useState("");

  // ==========================================
  // SPEECH TO TEXT
  // ==========================================

  const recognitionRef = useRef(null);

  const [isListening, setIsListening] =
    useState(false);

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const [speechError, setSpeechError] =
    useState("");

  // ==========================================
  // SAVE INTERVIEW SESSION
  // ==========================================

  useEffect(() => {

    const hasActiveInterview =
      Boolean(interviewId) ||
      started ||
      showQuestions ||
      completed;

    if (!hasActiveInterview) {
      return;
    }

    const session = {
      interviewType,
      role,
      started,
      showQuestions,
      interviewId,
      questions,
      currentQuestion,
      answer,
      completed,
      evaluation,
    };

    try {

      localStorage.setItem(
        INTERVIEW_SESSION_KEY,
        JSON.stringify(session)
      );

    } catch (error) {

      console.log(
        "Could not save interview session:",
        error
      );

    }

  }, [
    interviewType,
    role,
    started,
    showQuestions,
    interviewId,
    questions,
    currentQuestion,
    answer,
    completed,
    evaluation,
  ]);

  // ==========================================
  // SPEECH RECOGNITION SETUP
  // ==========================================

  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      setSpeechSupported(false);

      console.log(
        "Speech recognition is not supported."
      );

      return;
    }

    setSpeechSupported(true);

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";

    recognition.onstart = () => {

      console.log(
        "Speech recognition started"
      );

      setIsListening(true);

      setSpeechError("");

    };

    recognition.onresult = (event) => {

      let finalTranscript = "";

      let interimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const transcript =
          event.results[i][0].transcript;

        if (
          event.results[i].isFinal
        ) {

          finalTranscript += transcript;

        } else {

          interimTranscript += transcript;

        }

      }

      if (finalTranscript) {

        setAnswer(
          (previousAnswer) => {

            const previous =
              previousAnswer.trim();

            if (!previous) {

              return finalTranscript.trim();

            }

            return (
              previous +
              " " +
              finalTranscript.trim()
            );

          }
        );

      }

      console.log(
        "Interim transcript:",
        interimTranscript
      );

    };

    recognition.onerror = (event) => {

      console.log(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error ===
        "not-allowed"
      ) {

        setSpeechError(
          "Microphone permission was denied for speech recognition."
        );

      } else if (
        event.error ===
        "no-speech"
      ) {

        setSpeechError(
          "No speech detected. Please speak clearly."
        );

      } else if (
        event.error ===
        "audio-capture"
      ) {

        setSpeechError(
          "Microphone could not be accessed."
        );

      } else if (
        event.error !==
        "aborted"
      ) {

        setSpeechError(
          `Speech recognition error: ${event.error}`
        );

      }

      setIsListening(false);

    };

    recognition.onend = () => {

      console.log(
        "Speech recognition ended"
      );

      setIsListening(false);

    };

    recognitionRef.current =
      recognition;

    return () => {

      if (recognitionRef.current) {

        try {

          recognitionRef.current.stop();

        } catch (error) {

          console.log(
            "Speech cleanup error:",
            error
          );

        }

        recognitionRef.current = null;

      }

    };

  }, []);

  // ==========================================
  // ATTACH CAMERA STREAM
  // ==========================================

  useEffect(() => {

    if (
      cameraActive &&
      videoRef.current &&
      streamRef.current
    ) {

      videoRef.current.srcObject =
        streamRef.current;

      videoRef.current
        .play()
        .catch((error) => {

          console.log(
            "Video play error:",
            error
          );

        });

    }

  }, [cameraActive]);

  // ==========================================
  // START CAMERA + MICROPHONE
  // ==========================================

  const startCamera = async () => {

    setCameraError("");

    setMicError("");

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      setCameraError(
        "Camera and microphone are not supported by this browser."
      );

      return;

    }

    // Already running

    if (streamRef.current) {

      setCameraActive(true);

      const audioTrack =
        streamRef.current
          .getAudioTracks()[0];

      if (audioTrack) {

        setMicActive(
          audioTrack.enabled
        );

      }

      return;

    }

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },

            height: {
              ideal: 720,
            },

            facingMode: "user",
          },

          audio: true,
        });

      streamRef.current =
        stream;

      // Microphone

      const audioTrack =
        stream.getAudioTracks()[0];

      if (audioTrack) {

        audioTrack.enabled = true;

        setMicActive(true);

        console.log(
          "Microphone started successfully"
        );

      } else {

        setMicActive(false);

        setMicError(
          "Microphone was not found."
        );

      }

      // Camera

      setCameraActive(true);

      console.log(
        "Camera and microphone started successfully"
      );

    } catch (error) {

      console.log(
        "Camera/Microphone error:",
        error
      );

      setCameraActive(false);

      setMicActive(false);

      if (
        error.name ===
        "NotAllowedError"
      ) {

        setCameraError(
          "Camera or microphone permission was denied. Please allow access."
        );

      } else if (
        error.name ===
        "NotFoundError"
      ) {

        setCameraError(
          "Camera or microphone was not found on this device."
        );

      } else if (
        error.name ===
        "NotReadableError"
      ) {

        setCameraError(
          "Camera or microphone is already being used by another application."
        );

      } else {

        setCameraError(
          "Unable to access the camera or microphone."
        );

      }

    }

  };

  // ==========================================
  // TOGGLE MICROPHONE
  // ==========================================

  const toggleMicrophone = () => {

    if (!streamRef.current) {

      setMicError(
        "Microphone is not started yet."
      );

      return;

    }

    const audioTrack =
      streamRef.current
        .getAudioTracks()[0];

    if (!audioTrack) {

      setMicError(
        "No microphone track was found."
      );

      return;

    }

    audioTrack.enabled =
      !audioTrack.enabled;

    setMicActive(
      audioTrack.enabled
    );

    if (
      !audioTrack.enabled &&
      isListening
    ) {

      stopListening();

    }

    setMicError("");

  };

  // ==========================================
  // START SPEECH
  // ==========================================

  const startListening = () => {

    setSpeechError("");

    if (!speechSupported) {

      setSpeechError(
        "Speech-to-text is not supported. Please use Chrome or Edge."
      );

      return;

    }

    if (!micActive) {

      setSpeechError(
        "Please turn on the microphone first."
      );

      return;

    }

    if (!recognitionRef.current) {

      setSpeechError(
        "Speech recognition is not available."
      );

      return;

    }

    try {

      recognitionRef.current.start();

      console.log(
        "Listening started"
      );

    } catch (error) {

      console.log(
        "Speech start error:",
        error
      );

      if (
        error.name ===
        "InvalidStateError"
      ) {

        setSpeechError(
          "Speech recognition is already running."
        );

      } else {

        setSpeechError(
          "Unable to start speech recognition."
        );

      }

    }

  };

  // ==========================================
  // STOP SPEECH
  // ==========================================

  const stopListening = () => {

    if (!recognitionRef.current) {

      return;

    }

    try {

      recognitionRef.current.stop();

      setIsListening(false);

      console.log(
        "Listening stopped"
      );

    } catch (error) {

      console.log(
        "Speech stop error:",
        error
      );

    }

  };

  // ==========================================
  // STOP CAMERA + MICROPHONE
  // ==========================================

  const stopCamera = () => {

    // Stop speech

    if (recognitionRef.current) {

      try {

        recognitionRef.current.stop();

      } catch (error) {

        console.log(
          "Speech stop error:",
          error
        );

      }

    }

    setIsListening(false);

    // Stop media tracks

    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach((track) => {

          track.stop();

        });

      streamRef.current = null;

    }

    if (videoRef.current) {

      videoRef.current.srcObject =
        null;

    }

    setCameraActive(false);

    setMicActive(false);

  };

  // ==========================================
  // GENERATE AI QUESTIONS
  // ==========================================

  const generateQuestions = async () => {

    setQuestionsLoading(true);

    setError("");

    const token =
      localStorage.getItem("token");

    if (!token) {

      setError(
        "Please login first."
      );

      setQuestionsLoading(false);

      return false;

    }

    if (!interviewId) {

      setError(
        "Interview ID not found."
      );

      setQuestionsLoading(false);

      return false;

    }

    if (!API_URL) {

      setError(
        "API URL is not configured."
      );

      setQuestionsLoading(false);

      return false;

    }

    try {

      console.log(
        "Generating AI questions..."
      );

      const response =
        await fetch(
          `${API_URL}/api/interviews/${interviewId}/questions`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      console.log(
        "Questions response:",
        data
      );

      if (!response.ok) {

        // If saved interview no longer exists,
        // remove stale local session.

        if (
          response.status === 404 ||
          (
            data.error &&
            data.error
              .toLowerCase()
              .includes(
                "interview"
              ) &&
            data.error
              .toLowerCase()
              .includes(
                "not found"
              )
          )
        ) {

          localStorage.removeItem(
            INTERVIEW_SESSION_KEY
          );

          setInterviewId(null);

          setStarted(false);

          setShowQuestions(false);

          setQuestions([]);

          setCurrentQuestion(0);

        }

        setError(
          data.error ||
            data.message ||
            "Failed to generate AI questions."
        );

        setQuestionsLoading(false);

        return false;

      }

      if (
        !Array.isArray(
          data.questions
        ) ||
        data.questions.length === 0
      ) {

        setError(
          "AI did not return any questions."
        );

        setQuestionsLoading(false);

        return false;

      }

      setQuestions(
        data.questions
      );

      setCurrentQuestion(0);

      console.log(
        "AI questions generated:",
        data.questions
      );

      setQuestionsLoading(false);

      return true;

    } catch (error) {

      console.log(
        "Generate questions error:",
        error
      );

      setError(
        "Server error while generating AI questions."
      );

      setQuestionsLoading(false);

      return false;

    }

  };

  // ==========================================
  // START INTERVIEW
  // ==========================================

  const startInterview = async () => {

    setError("");

    if (
      !interviewType ||
      !role
    ) {

      setError(
        "Please select interview type and role."
      );

      return;

    }

    const token =
      localStorage.getItem("token");

    if (!token) {

      setError(
        "Please login first."
      );

      return;

    }

    if (!API_URL) {

      setError(
        "API URL is not configured."
      );

      return;

    }

    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/api/interviews`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              interviewType,
              role,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setError(
          data.error ||
            data.message ||
            "Failed to start interview."
        );

        setLoading(false);

        return;

      }

      setInterviewId(
        data.interview._id
      );

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

  // ==========================================
  // CONTINUE TO QUESTIONS
  // ==========================================

  const continueToQuestions = async () => {

    setError("");

    setSpeechError("");

    // Start camera + microphone

    await startCamera();

    // Generate AI questions

    const success =
      await generateQuestions();

    if (success) {

      setShowQuestions(true);

      setCurrentQuestion(0);

      setAnswer("");

    }

  };

  // ==========================================
  // SUBMIT ANSWER
  // ==========================================

  const submitAnswer = async () => {

    setError("");

    // Stop speech recognition

    if (isListening) {

      stopListening();

    }

    if (!answer.trim()) {

      setError(
        "Please enter or speak your answer."
      );

      return;

    }

    const token =
      localStorage.getItem("token");

    if (!token) {

      setError(
        "Please login first."
      );

      return;

    }

    if (!interviewId) {

      setError(
        "Interview ID not found."
      );

      return;

    }

    if (!API_URL) {

      setError(
        "API URL is not configured."
      );

      return;

    }

    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/api/interviews/${interviewId}/answer`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              question:
                questions[
                  currentQuestion
                ],

              answer:
                answer,
            }),
          }
        );

      const data =
        await response.json();

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

      // ========================================
      // LAST QUESTION
      // ========================================

      if (
        currentQuestion ===
        questions.length - 1
      ) {

        setAnswer("");

        await evaluateInterview();

      }

      // ========================================
      // NEXT QUESTION
      // ========================================

      else {

        setCurrentQuestion(
          currentQuestion + 1
        );

        setAnswer("");

        setSpeechError("");

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

  // ==========================================
  // AI EVALUATION
  // ==========================================

  const evaluateInterview = async () => {

    const token =
      localStorage.getItem("token");

    if (!token) {

      setError(
        "Please login first."
      );

      return;

    }

    if (!interviewId) {

      setError(
        "Interview ID not found."
      );

      return;

    }

    if (!API_URL) {

      setError(
        "API URL is not configured."
      );

      return;

    }

    try {

      console.log(
        "Starting AI evaluation..."
      );

      const response =
        await fetch(
          `${API_URL}/api/interviews/${interviewId}/evaluate`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      let data;

      try {

        data =
          await response.json();

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

      if (!response.ok) {

        setError(
          data.error ||
            data.message ||
            `AI evaluation failed. Status: ${response.status}`
        );

        return;

      }

      setEvaluation(
        data.evaluation
      );

      setCompleted(true);

    } catch (error) {

      console.log(
        "Evaluation error:",
        error
      );

      setError(
        "Server error during AI evaluation."
      );

    }

  };
    // ==========================================
  // BACK TO DASHBOARD
  // ==========================================

  const handleBackToDashboard = () => {
    stopCamera();

    localStorage.removeItem(
      INTERVIEW_SESSION_KEY
    );

    onBackToDashboard();
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="interview-page">

      <div className="interview-container">

        {/* ================================== */}
        {/* TOP SECTION */}
        {/* ================================== */}

        <div className="interview-top">

          <button
            className="back-btn"
            onClick={
              handleBackToDashboard
            }
          >
            ← Dashboard
          </button>

          <h1>
            AI Interview
          </h1>

          <p>
            Practice your interview with
            our AI-powered platform.
          </p>

        </div>

        {/* ================================== */}
        {/* INTERVIEW SETUP */}
        {/* ================================== */}

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
                    interviewType ===
                    "HR"
                      ? "type-card selected"
                      : "type-card"
                  }

                  onClick={() =>
                    setInterviewType(
                      "HR"
                    )
                  }
                >
                  <span>
                    👔
                  </span>

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
                  <span>
                    💻
                  </span>

                  <h3>
                    Technical Interview
                  </h3>

                  <p>
                    Technical and
                    concept-based questions.
                  </p>

                </button>

                {/* CODING */}

                <button
                  className={
                    interviewType ===
                    "Coding"
                      ? "type-card selected"
                      : "type-card"
                  }

                  onClick={() =>
                    setInterviewType(
                      "Coding"
                    )
                  }
                >
                  <span>
                    ⌨️
                  </span>

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
                onClick={
                  startInterview
                }
                disabled={loading}
              >
                {loading
                  ? "Starting..."
                  : "Start Interview →"}
              </button>

            </div>

          </div>
        )}

        {/* ================================== */}
        {/* INTERVIEW STARTED */}
        {/* ================================== */}

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
                Your {interviewType}
                interview for{" "}
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
                disabled={
                  questionsLoading
                }
              >
                {questionsLoading
                  ? "🤖 Preparing AI Questions..."
                  : "Continue to Questions →"}
              </button>

              {error && (
                <p className="interview-error">
                  {error}
                </p>
              )}

            </div>

          </div>

        )}

        {/* ================================== */}
        {/* QUESTIONS */}
        {/* ================================== */}

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

              {/* ================================= */}
              {/* FLOATING CAMERA */}
              {/* ================================= */}

              <div
                style={{
                  position: "fixed",
                  top: "80px",
                  right: "24px",
                  width: "220px",
                  height: "140px",
                  background: "#020617",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border:
                    cameraActive
                      ? "2px solid #ef4444"
                      : "2px solid #cbd5e1",
                  boxShadow:
                    "0 8px 25px rgba(0,0,0,0.18)",
                  zIndex: 1000,
                }}
              >

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted

                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display:
                      cameraActive
                        ? "block"
                        : "none",
                    transform:
                      "scaleX(-1)",
                  }}
                />

                {!cameraActive && (

                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexDirection:
                        "column",
                      gap: "6px",
                      color:
                        "#cbd5e1",
                      fontSize:
                        "12px",
                      textAlign:
                        "center",
                    }}
                  >

                    <span
                      style={{
                        fontSize:
                          "28px",
                      }}
                    >
                      📷
                    </span>

                    <span>
                      Camera Off
                    </span>

                  </div>

                )}

                {cameraActive && (

                  <div
                    style={{
                      position:
                        "absolute",
                      top: "8px",
                      right: "8px",
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "5px",
                      padding:
                        "4px 7px",
                      borderRadius:
                        "5px",
                      background:
                        "rgba(220,38,38,0.9)",
                      color:
                        "white",
                      fontSize:
                        "9px",
                      fontWeight:
                        "800",
                    }}
                  >

                    <span>
                      ●
                    </span>

                    LIVE

                  </div>

                )}

              </div>

              {/* ================================= */}
              {/* ERRORS */}
              {/* ================================= */}

              {cameraError && (

                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#fef2f2",
                    color:
                      "#dc2626",
                    fontSize:
                      "12px",
                  }}
                >
                  {cameraError}
                </div>

              )}

              {micError && (

                <div
                  style={{
                    marginTop:
                      "10px",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#fff7ed",
                    color:
                      "#c2410c",
                    fontSize:
                      "12px",
                  }}
                >
                  {micError}
                </div>

              )}

              {speechError && (

                <div
                  style={{
                    marginTop:
                      "10px",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#fff7ed",
                    color:
                      "#c2410c",
                    fontSize:
                      "12px",
                  }}
                >
                  {speechError}
                </div>

              )}

              {/* ================================= */}
              {/* MIC CONTROL */}
              {/* ================================= */}

              {cameraActive && (

                <div
                  style={{
                    marginTop:
                      "14px",
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                    flexWrap:
                      "wrap",
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      toggleMicrophone
                    }

                    style={{
                      padding:
                        "9px 14px",
                      border:
                        "1px solid #dbe1ea",
                      borderRadius:
                        "8px",
                      background:
                        micActive
                          ? "#f0fdf4"
                          : "#fef2f2",
                      color:
                        micActive
                          ? "#15803d"
                          : "#dc2626",
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    {micActive
                      ? "🎤 Mic ON"
                      : "🔇 Mic OFF"}
                  </button>

                  <span
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        "600",
                      color:
                        micActive
                          ? "#15803d"
                          : "#dc2626",
                    }}
                  >
                    {micActive
                      ? "Microphone is active"
                      : "Microphone is muted"}
                  </span>

                </div>

              )}

              {/* ================================= */}
              {/* PROGRESS */}
              {/* ================================= */}

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
                />

              </div>

              {/* ================================= */}
              {/* QUESTION */}
              {/* ================================= */}

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

              {/* ================================= */}
              {/* ANSWER */}
              {/* ================================= */}

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

                  placeholder={
                    isListening
                      ? "🔴 Listening... Speak your answer."
                      : "Type your answer or click Start Answer and speak..."
                  }

                  rows="8"
                />

              </div>

              {/* ================================= */}
              {/* SPEECH CONTROLS */}
              {/* ================================= */}

              {speechSupported ? (

                <div
                  style={{
                    marginTop:
                      "14px",
                    padding:
                      "14px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "10px",
                    background:
                      "#f8fafc",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >

                    {!isListening ? (

                      <button
                        type="button"
                        onClick={
                          startListening
                        }
                        disabled={
                          !micActive
                        }

                        style={{
                          padding:
                            "10px 18px",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          background:
                            micActive
                              ? "#2563eb"
                              : "#94a3b8",
                          color:
                            "white",
                          fontSize:
                            "13px",
                          fontWeight:
                            "700",
                          cursor:
                            micActive
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        🎤 Start Answer
                      </button>

                    ) : (

                      <button
                        type="button"
                        onClick={
                          stopListening
                        }

                        style={{
                          padding:
                            "10px 18px",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          background:
                            "#dc2626",
                          color:
                            "white",
                          fontSize:
                            "13px",
                          fontWeight:
                            "700",
                          cursor:
                            "pointer",
                        }}
                      >
                        🛑 Stop Answer
                      </button>

                    )}

                    {isListening && (

                      <span
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "6px",
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                          color:
                            "#dc2626",
                        }}
                      >
                        🔴 Listening...
                      </span>

                    )}

                    {!isListening &&
                      answer.trim() && (

                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                            fontWeight:
                              "600",
                          }}
                        >
                          ✓ Transcript captured
                        </span>

                      )}

                  </div>

                  <p
                    style={{
                      margin:
                        "10px 0 0",
                      fontSize:
                        "11px",
                      color:
                        "#64748b",
                    }}
                  >
                    Click "Start Answer"
                    and speak clearly.
                    Your speech will
                    appear in the answer
                    box.
                  </p>

                </div>

              ) : (

                <div
                  style={{
                    marginTop:
                      "14px",
                    padding:
                      "12px",
                    borderRadius:
                      "8px",
                    background:
                      "#fff7ed",
                    color:
                      "#c2410c",
                    fontSize:
                      "12px",
                  }}
                >
                  Speech-to-text is not
                  supported in this browser.
                  Please use Google Chrome
                  or Microsoft Edge.
                </div>

              )}

              {/* ================================= */}
              {/* ERROR */}
              {/* ================================= */}

              {error && (

                <p className="interview-error">
                  {error}
                </p>

              )}

              {/* ================================= */}
              {/* SUBMIT */}
              {/* ================================= */}

              <button
                className="start-interview-btn"

                onClick={
                  submitAnswer
                }

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

        {/* ================================== */}
        {/* EVALUATION RESULT */}
        {/* ================================== */}

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

              <div className="feedback-box">

                <h3>
                  AI Feedback
                </h3>

                <p>
                  {evaluation.feedback}
                </p>

              </div>

              <div className="feedback-box">

                <h3>
                  Areas to Improve
                </h3>

                <p>
                  {evaluation.improvements}
                </p>

              </div>

              <button
                className="primary-btn"
                onClick={
                  handleBackToDashboard
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