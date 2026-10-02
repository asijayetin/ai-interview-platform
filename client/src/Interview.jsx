import { useEffect, useRef, useState } from "react";
import "./CodingInterview.css";
import CodeEditor from "./CodeEditor";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const INTERVIEW_SESSION_KEY =
  "activeInterviewSession";

const ROLE_OPTIONS = [
  "Software Developer",
  "Java Developer",
  "C++ Developer",
  "Python Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
];
const CODING_ROLE_OPTIONS = ROLE_OPTIONS.filter((roleOption) =>
  ["Software Developer", "Java Developer", "C++ Developer", "Python Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer"].includes(roleOption)
);
const CODING_LANGUAGES = ["Java", "C++", "Python", "JavaScript", "C#"];
const INTERVIEW_FLOW_STAGES = {
  HR: ["Introduction & career story", "Role motivation", "Behavioral · STAR", "Collaboration & conflict", "Strengths & growth"],
  Technical: ["Core role concepts", "Applied problem-solving", "Debugging & edge cases", "Design & trade-offs", "Role-specific depth"],
};
const RUNNER_LANGUAGE_IDS = { Java: "java", "C++": "cpp", Python: "python", JavaScript: "javascript", "C#": "csharp" };
const getQuestionText = (item) => typeof item === "string" ? item : item?.question || "";
const ensureJavaUtilityImport = (source) => {
  if (!source || /^\s*import\s+java\.util\.\*\s*;/m.test(source)) return source || "";
  const packageDeclaration = /^[ \t]*package\s+[^;]+;[ \t]*(?:\r?\n|$)/m.exec(source);
  const insertAt = packageDeclaration ? packageDeclaration.index + packageDeclaration[0].length : 0;
  return `${source.slice(0, insertAt)}import java.util.*;\n${source.slice(insertAt)}`;
};
const getCodingStarter = (item, language) => {
  const source = item?.starterCode || "";
  if (language !== "Java") return source;
  const withImport = ensureJavaUtilityImport(source);
  const helperBegin = /^[ \t]*\/\/[ \t]*BEGIN HELPERS[ \t]*$/m.exec(withImport);
  if (helperBegin) {
    const endPattern = /^[ \t]*\/\/[ \t]*END HELPERS[ \t]*$/gm;
    endPattern.lastIndex = helperBegin.index + helperBegin[0].length;
    const helperEnd = endPattern.exec(withImport);
    if (!helperEnd) return withImport;
    const bodyStart = withImport.indexOf("\n", helperBegin.index + helperBegin[0].length) + 1;
    if (withImport.slice(bodyStart, helperEnd.index).trim()) return withImport;
    const lineStart = withImport.lastIndexOf("\n", helperBegin.index - 1) + 1;
    const indent = `${withImport.slice(lineStart, helperBegin.index).match(/^[ \t]*/)?.[0] || ""}    `;
    return `${withImport.slice(0, bodyStart)}${indent}// Add optional static helper methods here.\n${withImport.slice(helperEnd.index)}`;
  }
  if (!/\bclass\s+Solution\b/.test(withImport)) return withImport;
  const driverStart = /^[ \t]*\/\/[ \t]*BEGIN DRIVER[ \t]*$/m.exec(withImport)?.index ?? withImport.length;
  const solutionEnd = withImport.lastIndexOf("}", driverStart);
  if (solutionEnd < 0) return withImport;
  const lineStart = withImport.lastIndexOf("\n", solutionEnd - 1) + 1;
  const indent = withImport.slice(lineStart, solutionEnd).match(/^[ \t]*/)?.[0] || "";
  const helperIndent = `${indent}    `;
  const helperSection = `\n${helperIndent}// BEGIN HELPERS\n${helperIndent}// Optional static helper methods go here.\n${helperIndent}// END HELPERS\n${indent}`;
  return `${withImport.slice(0, solutionEnd)}${helperSection}${withImport.slice(solutionEnd)}`;
};
const getCodingTestCases = (item) => Array.isArray(item?.testCases) && item.testCases.length
  ? item.testCases
  : item?.exampleInput != null ? [{ input: item.exampleInput, output: item.exampleOutput || "" }] : [];

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

  const [codingLanguage, setCodingLanguage] = useState(
    savedSession?.codingLanguage || "Java"
  );
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileError, setResumeFileError] = useState("");
  const resumeContextInputRef = useRef(null);

  const availableRoles = interviewType === "Coding" ? CODING_ROLE_OPTIONS : ROLE_OPTIONS;

  const selectInterviewType = (type) => {
    setInterviewType(type);
    setResumeFileError("");
    if (type === "Coding") setResumeFile(null);
    if (type === "Coding" && !CODING_ROLE_OPTIONS.includes(role)) {
      setRole("");
    }
  };

  const selectResumeContext = (file) => {
    setResumeFileError("");
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeFileError("Resume must be 5 MB or smaller.");
      setResumeFile(null);
      return;
    }
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setResumeFileError("Choose a PDF or DOCX resume.");
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
  };

  const handleAnswerEditorKeyDown = (event) => {
    if (interviewType !== "Coding") return;
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runCodingCode();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const editor = event.currentTarget;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const nextAnswer = `${answer.slice(0, start)}    ${answer.slice(end)}`;
      setAnswer(nextAnswer);
      requestAnimationFrame(() => editor.setSelectionRange(start + 4, start + 4));
    }
  };

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
  const [codingStdin, setCodingStdin] = useState(savedSession?.codingStdin || "");
  const [codingTestIndex, setCodingTestIndex] = useState(0);
  const [codingOutput, setCodingOutput] = useState(null);
  const [codingRunError, setCodingRunError] = useState("");
  const [codingRunning, setCodingRunning] = useState(false);
  const [codingDrafts, setCodingDrafts] = useState(savedSession?.codingDrafts || {});
  const [completedCodingQuestions, setCompletedCodingQuestions] = useState(savedSession?.completedCodingQuestions || []);

  useEffect(() => {
    if (interviewType !== "Coding" || codingLanguage !== "Java" || !answer) return;
    const answerWithJavaImports = ensureJavaUtilityImport(answer);
    if (answerWithJavaImports !== answer) setAnswer(answerWithJavaImports);
  }, [interviewType, codingLanguage, answer]);

  useEffect(() => {
    if (interviewType !== "Coding" || !answer || !questions[currentQuestion]) return;
    setCodingDrafts((drafts) => drafts[currentQuestion] === answer
      ? drafts
      : { ...drafts, [currentQuestion]: answer });
  }, [interviewType, questions, currentQuestion, answer]);

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

  const answersRef = useRef(savedSession?.answers || []);

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
      codingLanguage,
      role,
      started,
      showQuestions,
      interviewId,
      questions,
      currentQuestion,
      answer,
      codingDrafts,
      completedCodingQuestions,
      codingStdin,
      completed,
      evaluation,
      answers: answersRef.current,
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
    codingLanguage,
    role,
    started,
    showQuestions,
    interviewId,
    questions,
    currentQuestion,
    answer,
    codingDrafts,
    completedCodingQuestions,
    codingStdin,
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

  useEffect(() => () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already have stopped as the page unmounts.
      }
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

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

      const generationFields = {
        role,
        interviewType,
        codingLanguage,
        interviewId,
        difficulty: "Medium",
        count: interviewType === "Coding" ? 3 : 5,
      };
      let requestBody = JSON.stringify(generationFields);
      const requestHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (resumeFile && interviewType !== "Coding") {
        const formData = new FormData();
        formData.append("role", role);
        formData.append("interviewType", interviewType);
        formData.append("resume", resumeFile);
        requestBody = formData;
        delete requestHeaders["Content-Type"];
      }

      const response =
        await fetch(
          `${API_URL}/api/ai/generate`,
          {
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          }
        );

      const data =
        await response.json();

      console.log(
        "Questions response:",
        data
      );

      if (!response.ok) {
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

      const generatedQuestions = data.questions
        .map((item) => {
          if (interviewType === "Coding") {
            if (typeof item === "string") return { question: item, category: "Coding challenge", starterCode: "" };
            return { ...item, question: item?.question || "", category: item?.category || "Coding challenge" };
          }
          if (typeof item === "string") return { question: item, category: "Interview question" };
          return { question: item?.question || "", category: item?.category || "Interview question" };
        })
        .filter((item) => interviewType === "Coding"
          ? typeof item?.question === "string" && item.question.trim()
          : typeof item?.question === "string" && item.question.trim());

      if (interviewType === "Coding" && generatedQuestions.length !== 3) {
        setError("The AI could not prepare all 3 coding problems. Please try again.");
        setQuestionsLoading(false);
        return false;
      }

      if (generatedQuestions.length === 0) {
        setError("AI did not return any usable questions. Please try again.");
        setQuestionsLoading(false);
        return false;
      }

      setQuestions(generatedQuestions);

      setCurrentQuestion(0);
      if (interviewType === "Coding") {
        setCompletedCodingQuestions([]);
        const firstStarter = getCodingStarter(generatedQuestions[0], codingLanguage);
        setAnswer(firstStarter);
        setCodingDrafts({ 0: firstStarter });
        const firstTestCase = getCodingTestCases(generatedQuestions[0])[0];
        setCodingStdin(firstTestCase?.input ?? generatedQuestions[0]?.exampleInput ?? "");
        setCodingTestIndex(0);
        setCodingOutput(null);
        setCodingRunError("");
      }

      console.log(
        "AI questions generated:",
        generatedQuestions
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
      !role ||
      (interviewType === "Coding" && !codingLanguage)
    ) {

      setError("Choose an interview type and role. For coding, also choose a language.");

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
    answersRef.current = [];

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
              codingLanguage: interviewType === "Coding" ? codingLanguage : "",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        const message = data.error || data.message || "Failed to start interview.";
        setError(response.status === 404
          ? `${message} (${API_URL}${data.path || "/api/interviews"})`
          : message);

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

  const runCodingCode = async () => {
    setCodingRunError("");
    setCodingOutput(null);
    if (!API_URL) {
      setCodingRunError("The app server is not configured.");
      return null;
    }
    const testCases = getCodingTestCases(questions[currentQuestion]).map((testCase) => ({
      input: String(testCase.input ?? ""),
      output: String(testCase.output ?? ""),
    }));
    if (!testCases.length) {
      setCodingRunError("This problem has no test cases. Generate the interview again.");
      return null;
    }
    if (!answer.trim()) {
      setCodingRunError("Write your function first, then run it.");
      return null;
    }
    const activeIndex = Math.min(codingTestIndex, testCases.length - 1);
    testCases[activeIndex] = { ...testCases[activeIndex], input: codingStdin };
    setCodingRunError("");
    setCodingOutput(null);
    setCodingRunning(true);
    try {
      const response = await fetch(`${API_URL}/api/code/run-tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          language: RUNNER_LANGUAGE_IDS[codingLanguage],
          code: answer,
          testCases,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not run this code.");
      setCodingOutput(data);
      if (data.results?.length === 3 && data.results.every((testCase) => testCase.accepted)) {
        setCompletedCodingQuestions((done) => done.includes(currentQuestion) ? done : [...done, currentQuestion]);
      }
      return data;
    } catch (runError) {
      setCodingRunError(runError.message || "Could not run this code.");
      return null;
    } finally {
      setCodingRunning(false);
    }
  };

  const goToCodingQuestion = (index) => {
    if (index < 0 || index > currentQuestion || index >= questions.length || codingRunning || loading) return;
    const nextQuestion = questions[index];
    const nextAnswer = Object.prototype.hasOwnProperty.call(codingDrafts, index)
      ? codingDrafts[index]
      : getCodingStarter(nextQuestion, codingLanguage);
    setCodingDrafts((drafts) => ({ ...drafts, [currentQuestion]: answer }));
    setCurrentQuestion(index);
    setAnswer(nextAnswer);
    setCodingStdin(getCodingTestCases(nextQuestion)[0]?.input ?? nextQuestion?.exampleInput ?? "");
    setCodingTestIndex(0);
    setCodingOutput(null);
    setCodingRunError("");
    setError("");
  };

  // ==========================================
  // CONTINUE TO QUESTIONS
  // ==========================================

  const continueToQuestions = async () => {

    setError("");

    setSpeechError("");

    // Start camera + microphone

    if (interviewType !== "Coding") {
      await startCamera();
    }

    // Generate AI questions

    const success =
      await generateQuestions();

    if (success) {

      setShowQuestions(true);

      setCurrentQuestion(0);

      if (interviewType !== "Coding") setAnswer("");

    }

  };

  // ==========================================
  // SUBMIT ANSWER
  // ==========================================

  const submitAnswer = async (continueWithoutPassingTests = false) => {

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

    if (interviewType === "Coding" && !continueWithoutPassingTests) {
      const testRun = await runCodingCode();
      if (!testRun?.accepted) {
        const passed = testRun?.passedCount || 0;
        const total = testRun?.results?.length || getCodingTestCases(questions[currentQuestion]).length;
        setError(testRun ? `Fix the failing test cases before submitting (${passed}/${total} passed).` : "The solution could not be verified. Fix the error and run the tests again.");
        return;
      }
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
              question: getQuestionText(questions[currentQuestion]),

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

      answersRef.current = data.interview.answers || answersRef.current;

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

        const nextQuestion = questions[currentQuestion + 1];
        const nextAnswer = interviewType === "Coding"
          ? (codingDrafts[currentQuestion + 1] ?? getCodingStarter(nextQuestion, codingLanguage))
          : "";
        setCodingDrafts((drafts) => interviewType === "Coding"
          ? { ...drafts, [currentQuestion]: answer, [currentQuestion + 1]: nextAnswer }
          : drafts);
        setCurrentQuestion(currentQuestion + 1);
        setAnswer(nextAnswer);
        setCodingStdin(interviewType === "Coding" ? getCodingTestCases(nextQuestion)[0]?.input ?? nextQuestion?.exampleInput ?? "" : "");
        setCodingTestIndex(0);
        setCodingOutput(null);
        setCodingRunError("");

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
          `${API_URL}/api/ai/evaluate`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              questions: questions.map(getQuestionText),
              answers: answersRef.current,
              role,
              interviewType,
              codingLanguage,
            }),
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

      const saveResponse = await fetch(`${API_URL}/api/interviews/${interviewId}/result`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ evaluation: data.evaluation }),
      });
      if (!saveResponse.ok) {
        const saveData = await saveResponse.json().catch(() => ({}));
        setError(saveData.message || "Interview completed, but the result could not be saved.");
        return;
      }

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
  // PRACTICE AGAIN
  // ==========================================

  const practiceAgain = () => {
    stopCamera();

    localStorage.removeItem(
      INTERVIEW_SESSION_KEY
    );

    setInterviewType("");
    setRole("");
    setResumeFile(null);
    setResumeFileError("");
    if (resumeContextInputRef.current) resumeContextInputRef.current.value = "";
    setStarted(false);
    setShowQuestions(false);
    setInterviewId(null);
      setQuestions([]);
      setCompletedCodingQuestions([]);
    answersRef.current = [];
    setCurrentQuestion(0);
    setAnswer("");
    setCodingDrafts({});
    setCodingStdin("");
    setCodingOutput(null);
    setCodingRunError("");
    setCompleted(false);
    setEvaluation(null);
    setError("");
    setCameraError("");
    setMicError("");
    setSpeechError("");
    setQuestionsLoading(false);
    setLoading(false);
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

  const currentCodingTests = interviewType === "Coding" ? getCodingTestCases(questions[currentQuestion]) : [];
  const selectedCodingTest = currentCodingTests[Math.min(codingTestIndex, Math.max(0, currentCodingTests.length - 1))];

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="interview-page">

      <div className={`interview-container${interviewType === "Coding" && showQuestions ? " coding-interview-container" : ""}`}>

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

              <p className="setup-eyebrow">YOUR PRACTICE SESSION</p>
              <h2>Choose your interview format</h2>

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
                  type="button"
                  aria-pressed={interviewType === "HR"}
                  onClick={() => selectInterviewType("HR")}
                >
                  <span className="type-icon type-icon-hr">HR</span>
                  <div className="type-card-copy"><h3>HR Interview</h3><p>Behavioral questions, communication, and workplace scenarios.</p></div>
                  {interviewType === "HR" && <span className="type-selected-check">✓</span>}

                </button>

                {/* TECHNICAL */}

                <button
                  className={
                    interviewType ===
                    "Technical"
                      ? "type-card selected"
                      : "type-card"
                  }
                  type="button"
                  aria-pressed={interviewType === "Technical"}
                  onClick={() => selectInterviewType("Technical")}
                >
                  <span className="type-icon type-icon-technical">T</span>
                  <div className="type-card-copy"><h3>Technical Interview</h3><p>Concepts, system knowledge, and role-specific questions.</p></div>
                  {interviewType === "Technical" && <span className="type-selected-check">✓</span>}

                </button>

                {/* CODING */}

                <button
                  className={
                    interviewType ===
                    "Coding"
                      ? "type-card selected"
                      : "type-card"
                  }
                  type="button"
                  aria-pressed={interviewType === "Coding"}
                  onClick={() => selectInterviewType("Coding")}
                >
                  <span className="type-icon type-icon-coding">{`</>`}</span>
                  <div className="type-card-copy"><h3>Coding Interview</h3><p>Three focused data-structure and algorithm challenges.</p></div>
                  {interviewType === "Coding" && <span className="type-selected-check">✓</span>}

                </button>

              </div>

              {(interviewType === "HR" || interviewType === "Technical") && (
                <div className={`interview-flow-preview interview-flow-${interviewType.toLowerCase()}`}>
                  <div className="interview-flow-preview-heading">
                    <span className="interview-flow-preview-mark">{interviewType === "HR" ? "HR" : "T"}</span>
                    <div><strong>{interviewType === "HR" ? "HR interview flow" : "Technical interview flow"}</strong><small>{interviewType === "HR" ? "Practice clear, structured answers about your experience." : `Role-focused questions for ${role || "your chosen role"}, from fundamentals to design.`}</small></div>
                  </div>
                  <ol>{INTERVIEW_FLOW_STAGES[interviewType].map((stage, index) => <li key={stage}><span>{String(index + 1).padStart(2, "0")}</span>{stage}</li>)}</ol>
                  <p><span>5 questions</span><i /> One at a time <i /> Personalized AI feedback at the end</p>
                </div>
              )}

              {/* ROLE */}

              <div className="role-section">

                <h2>Select your role</h2>

                <p>
                  {interviewType === "Coding"
                    ? "Choose a software role to get coding problems matched to your interview."
                    : "Choose the role you are preparing for."}
                </p>

                <select
                  id="interview-role"
                  aria-label="Select your role"
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

                  {availableRoles.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>{roleOption}</option>
                  ))}
                </select>

              </div>

              {(interviewType === "HR" || interviewType === "Technical") && (
                <div className="interview-resume-context">
                  <div className="interview-resume-context-copy"><span>OPTIONAL PERSONALIZATION</span><strong>Tailor questions to your resume</strong><small>We’ll use your projects and skills to make questions more relevant.</small></div>
                  <input ref={resumeContextInputRef} className="interview-resume-context-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { selectResumeContext(event.target.files?.[0] || null); event.target.value = ""; }} aria-label="Choose resume for personalized interview questions" />
                  {resumeFile ? <div className="interview-resume-selected"><span>✓</span><strong title={resumeFile.name}>{resumeFile.name}</strong><button type="button" onClick={() => { selectResumeContext(null); if (resumeContextInputRef.current) resumeContextInputRef.current.value = ""; }}>Remove</button></div> : <button type="button" className="interview-resume-upload-btn" onClick={() => resumeContextInputRef.current?.click()}>Choose resume <span>↑</span></button>}
                  {resumeFileError && <p className="interview-resume-context-error" role="alert">{resumeFileError}</p>}
                  <p className="interview-resume-privacy">PDF or DOCX · up to 5 MB. Extracted text is sent to the configured AI service for this interview and isn’t saved by the app.</p>
                </div>
              )}

              {interviewType === "Coding" && (
                <div className="role-section coding-language-section">
                  <label htmlFor="coding-language">Choose your coding language</label>
                  <p>Challenges and AI feedback will use this language.</p>
                  <select id="coding-language" value={codingLanguage} onChange={(event) => setCodingLanguage(event.target.value)}>
                    {CODING_LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                  </select>
                  <div className="coding-session-note">
                    <strong>3 coding problems</strong>
                    <span>Fresh topic mix each round: arrays, strings, linked lists, stacks, queues, trees, and more · Medium difficulty</span>
                  </div>
                </div>
              )}

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

          <div className={`questions-section${interviewType === "Coding" ? " coding-interview-section" : ""}`}>

            <div className={`question-card${interviewType === "Coding" ? " coding-interview-card" : ""}`}>

              {/* HEADER */}

              <div className="question-header">

                <div>

                  <p className="small-heading">
                    {interviewType} INTERVIEW
                  </p>

                  <h2>
                    {role}
                  </h2>

                  {interviewType === "Coding" && <span className="coding-language-chip">{codingLanguage}</span>}

                </div>

                {interviewType === "Coding" ? (
                  <div className="coding-question-nav" aria-label="Choose a coding question">
                    {questions.map((_, index) => (
                      <button
                        type="button"
                        key={index}
                        className={`${index === currentQuestion ? "is-current" : ""}${completedCodingQuestions.includes(index) ? " is-complete" : ""}`}
                        aria-label={`Open question ${index + 1}${completedCodingQuestions.includes(index) ? ", completed" : ""}`}
                        aria-current={index === currentQuestion ? "step" : undefined}
                        onClick={() => goToCodingQuestion(index)}
                        disabled={index > currentQuestion || codingRunning || loading}
                      >
                        <span>{index + 1}</span>{completedCodingQuestions.includes(index) && <span className="coding-question-complete-check" aria-hidden="true">✓</span>}
                      </button>
                    ))}
                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                  </div>
                ) : (
                  <div className="question-count">Question {currentQuestion + 1} of {questions.length}</div>
                )}

              </div>

              {/* ================================= */}
              {/* FLOATING CAMERA */}
              {/* ================================= */}

              {interviewType !== "Coding" && (<div
                className="interview-camera-preview"
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

              </div>)}

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

              <div className={`question-content${interviewType === "Coding" ? " coding-question-content" : ""}`}>

                <p className="question-label">
                  {interviewType === "Coding" ? "CODING PROBLEM" : "QUESTION"}{" "}
                  {currentQuestion + 1}
                </p>

                {interviewType !== "Coding" && questions[currentQuestion]?.category && (
                  <div className={`interview-stage-tag interview-stage-${interviewType.toLowerCase()}`}>
                    <span>{interviewType === "HR" ? "HR ROUND" : "TECHNICAL ROUND"}</span>
                    <strong>{questions[currentQuestion].category}</strong>
                  </div>
                )}

                {interviewType === "Coding" && (
                  <div className="coding-challenge-meta">
                    <span className="coding-topic-tag">{questions[currentQuestion]?.category || "Coding challenge"}</span>
                    <span className="coding-progress-tag">Problem {currentQuestion + 1} of {questions.length}</span>
                    {questions[currentQuestion]?.functionName && <span className="coding-function-tag">{questions[currentQuestion].functionName}()</span>}
                  </div>
                )}

                <h2>
                  {getQuestionText(questions[currentQuestion])}
                </h2>

                {interviewType === "Coding" && (questions[currentQuestion]?.exampleInput || questions[currentQuestion]?.exampleOutput) && (
                  <div className="coding-example-grid">
                    <div><span>Example input</span><pre>{questions[currentQuestion]?.exampleInput || "(no input)"}</pre></div>
                    <div><span>Expected output</span><pre>{questions[currentQuestion]?.exampleOutput || "(not provided)"}</pre></div>
                  </div>
                )}

              </div>

              {/* ================================= */}
              {/* ANSWER */}
              {/* ================================= */}

              <div className={`answer-section${interviewType === "Coding" ? " coding-answer-section" : ""}`}>

                {interviewType === "Coding" && (
                  <div className="coding-editor-toolbar">
                    <div><label htmlFor="coding-solution-editor">Your solution</label><span className="coding-language-pill">{codingLanguage}</span></div>
                    <div className="coding-toolbar-actions">
                      {currentQuestion > 0 && (
                        <button type="button" className="coding-previous-question-btn" onClick={() => goToCodingQuestion(currentQuestion - 1)} disabled={codingRunning || loading}>
                          ← Previous Question
                        </button>
                      )}
                      <button type="button" className="coding-next-question-btn" onClick={() => submitAnswer(true)} disabled={codingRunning || loading}>
                        {currentQuestion === questions.length - 1 ? "Finish interview →" : "Next Question →"}
                      </button>
                      <button type="button" className="coding-run-button" onClick={runCodingCode} disabled={codingRunning || loading}>
                        {codingRunning ? "Running tests…" : "▶ Run tests"}<kbd>Ctrl ↵</kbd>
                      </button>
                    </div>
                  </div>
                )}

                {interviewType !== "Coding" && <label>Your Answer</label>}

                {interviewType === "Coding" ? (
                  <div className="coding-editor-window">
                    <div className="coding-file-bar"><span className="coding-file-dots"><i /><i /><i /></span><code>{codingLanguage === "Java" || codingLanguage === "C#" ? "Solution" : "solution"}.{({ Java: "java", "C++": "cpp", Python: "py", JavaScript: "js", "C#": "cs" })[codingLanguage]}</code><span>Function body{codingLanguage === "Java" ? " + helper methods" : ""} editable · Main locked</span></div>
                    <div className="coding-source-editor">
                      <CodeEditor
                        key={`coding-editor-${currentQuestion}-${codingLanguage}`}
                        language={RUNNER_LANGUAGE_IDS[codingLanguage]}
                        value={answer}
                        onChange={(nextAnswer) => { setAnswer(nextAnswer); setCodingDrafts((drafts) => ({ ...drafts, [currentQuestion]: nextAnswer })); setCompletedCodingQuestions((done) => done.filter((questionIndex) => questionIndex !== currentQuestion)); setCodingOutput(null); setCodingRunError(""); }}
                        onRun={runCodingCode}
                        lockOutsideSolution
                        ariaLabel={`${codingLanguage} coding interview editor`}
                        className="coding-interview-code"
                      />
                    </div>
                  </div>
                ) : (
                  <textarea
                    onKeyDown={handleAnswerEditorKeyDown}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder={isListening ? "🔴 Listening... Speak your answer." : "Type your answer or click Start Answer and speak..."}
                    rows="8"
                  />
                )}
                {interviewType === "Coding" && (
                  <div className="coding-compiler-grid">
                    <div className="coding-console-panel coding-testcase-panel">
                      <span>Test cases <small>{currentCodingTests.length} cases</small></span>
                      <div className="coding-testcase-tabs">
                        {currentCodingTests.map((testCase, index) => {
                          const result = codingOutput?.results?.[index];
                          return <button type="button" key={index} className={index === codingTestIndex ? "is-active" : ""} onClick={() => { setCodingTestIndex(index); setCodingStdin(testCase.input ?? ""); }}>
                            Case {index + 1}{result ? <i className={result.accepted ? "is-pass" : "is-fail"}>{result.accepted ? "✓" : "×"}</i> : null}
                          </button>;
                        })}
                      </div>
                      <label className="coding-test-input">Input <small>stdin</small>
                        <textarea value={codingStdin} readOnly placeholder="Input passed to your program" />
                      </label>
                      <p className="coding-expected-output"><strong>Expected</strong><code>{selectedCodingTest?.output || "(empty output)"}</code></p>
                    </div>
                    <div className="coding-console-panel coding-output-panel"><span>Test results <small>{codingOutput?.runtime || "run all cases"}</small></span>
                      <pre>{codingRunning ? "Compiling and running test cases…" : codingRunError || (codingOutput ? codingOutput.results.map((testCase) => testCase.accepted
                        ? `Case ${testCase.caseNumber}: Accepted`
                        : `Case ${testCase.caseNumber}: ${testCase.status}\nExpected: ${testCase.expectedOutput || "(empty)"}\nReceived: ${testCase.actualOutput || "(empty)"}${testCase.compileOutput ? `\n${testCase.compileOutput}` : ""}${testCase.stderr ? `\n${testCase.stderr}` : ""}`
                      ).join("\n\n") : "Run tests to see Accepted or the failing case details.")}</pre>
                      {codingOutput && !codingRunError && <em className={codingOutput.accepted ? "compiler-success" : "compiler-failure"}>{codingOutput.accepted ? `Accepted · ${codingOutput.passedCount}/${codingOutput.results.length} test cases` : `Not accepted · ${codingOutput.passedCount}/${codingOutput.results.length} passed`}</em>}
                    </div>
                  </div>
                )}
                {interviewType === "Coding" && <p className="coding-review-note">Only the marked function body and optional Java helper methods are editable; the runner stays locked. Run checks all visible cases; Submit saves your answer and advances only after every case passes.</p>}

              </div>

              {/* ================================= */}
              {/* SPEECH CONTROLS */}
              {/* ================================= */}

              {interviewType !== "Coding" && (speechSupported ? (

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

              ))}

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

                disabled={loading || codingRunning}
              >
                {loading
                  ? "Processing..."
                  : currentQuestion ===
                    questions.length - 1
                  ? interviewType === "Coding" ? "Submit solution & finish →" : "Finish & Get AI Score 🤖"
                  : interviewType === "Coding" ? "Submit solution →" : "Submit Answer →"}
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

              <button
                type="button"
                className="back-btn"
                onClick={handleBackToDashboard}
              >
                ← Dashboard
              </button>

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

              <div className="interview-result-meta">

                <span>
                  {interviewType} Interview
                </span>

                <span>
                  {role}
                </span>

                {interviewType === "Coding" && <span>{codingLanguage}</span>}

              </div>

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
                    {interviewType === "Coding" ? "Code Quality" : "Communication"}
                  </span>

                  <strong>
                    {evaluation.communicationScore}
                    /10
                  </strong>

                </div>

                <div className="score-box">

                  <span>
                    {interviewType === "Coding" ? "Correctness" : interviewType === "HR" ? "Relevant examples" : "Technical accuracy"}
                  </span>

                  <strong>
                    {evaluation.relevanceScore}
                    /10
                  </strong>

                </div>

                <div className="score-box">

                  <span>
                    {interviewType === "Coding" ? "Complexity & edge cases" : interviewType === "HR" ? "Answer structure" : "Reasoning & trade-offs"}
                  </span>

                  <strong>
                    {evaluation.clarityScore}
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

              <section className="answer-review-section" aria-labelledby="answer-review-title">
                <div className="answer-review-heading">
                  <div><p>DETAILED REPORT</p><h3 id="answer-review-title">Answer-by-answer review</h3><span>Specific notes based on each response you gave.</span></div>
                  <span className="answer-review-count">{(evaluation.answerFeedback || []).length} reviewed</span>
                </div>

                {(evaluation.answerFeedback || []).length > 0 ? (
                  <div className="answer-review-list">
                    {evaluation.answerFeedback.map((review, index) => {
                      const questionIndex = Number.isInteger(review.questionIndex) ? review.questionIndex : index;
                      const originalQuestion = getQuestionText(questions[questionIndex]) || answersRef.current[questionIndex]?.question || `Question ${questionIndex + 1}`;
                      const originalAnswer = answersRef.current[questionIndex]?.answer || "";
                      const hasScore = review.score !== null && review.score !== undefined && Number.isFinite(Number(review.score));
                      const scoreClass = !hasScore ? "" : Number(review.score) >= 7 ? "is-strong" : Number(review.score) >= 4 ? "is-developing" : "is-needs-work";
                      return (
                        <article className="answer-review-card" key={`${questionIndex}-${index}`}>
                          <header className="answer-review-card-heading">
                            <div><span>QUESTION {questionIndex + 1}</span><h4>{originalQuestion}</h4></div>
                            <strong className={`answer-review-score ${scoreClass}`}>{hasScore ? Number(review.score) : "—"}<small>/10</small></strong>
                          </header>
                          <details className="answer-review-response"><summary>Your response</summary><p>{originalAnswer || "Response not available."}</p></details>
                          <div className="answer-review-notes">
                            <div className="answer-review-note is-strength"><span>WHAT WENT WELL</span><p>{review.strength || "No separate strength note was returned."}</p></div>
                            <div className="answer-review-note is-improvement"><span>WHAT TO IMPROVE</span><p>{review.improvement || "Try adding more specific reasoning and supporting details."}</p></div>
                          </div>
                          {review.strongerApproach && <div className="answer-review-example"><span>{interviewType === "HR" ? "A stronger answer structure" : interviewType === "Coding" ? "A stronger solution approach" : "A stronger answer approach"}</span><p>{review.strongerApproach}</p></div>}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="answer-review-unavailable">Per-answer notes aren’t available for this saved evaluation.</p>
                )}
              </section>

              <div className="result-actions">

                <button
                  type="button"
                  className="primary-btn"
                  onClick={practiceAgain}
                >
                  🔄 Practice Again
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleBackToDashboard}
                >
                  🏠 Back to Dashboard
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Interview;
