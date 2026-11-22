import { useEffect, useRef, useState } from "react";
import "./VoiceInterview.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
function VoiceInterview() {
  const [type, setType] = useState("");
  const [role, setRole] = useState("");
  const [interviewId, setInterviewId] = useState("");
  const [setup, setSetup] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState([]);
  const [report, setReport] = useState(null);
  const [starting, setStarting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const recordingRef = useRef(false);
  const submittingRef = useRef(false);
  const submitTimerRef = useRef(null);
  const noResponseTimerRef = useRef(null);
  const answerRef = useRef("");
  const spokenTextRef = useRef("");
  const startedRef = useRef(false);
  const recognitionErrorRef = useRef("");
  const ignoreRecognitionEndRef = useRef(false);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      window.clearTimeout(submitTimerRef.current);
      window.clearTimeout(noResponseTimerRef.current);
      try { recognitionRef.current?.abort(); } catch { /* no active mic session */ }
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!question || report) return undefined;
    const timer = window.setTimeout(() => speakQuestion(), 180);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(noResponseTimerRef.current);
    };
  }, [question, report]);

  const speakQuestion = () => {
    if (!question) return;
    stopRecording();
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setSpeechStatus("The question is shown below. Listening for your answer…");
      armNoResponseTimer();
      startRecording();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenTextRef.current || question);
    spokenTextRef.current = "";
    utterance.lang = "en-IN";
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeechStatus("Interviewer is speaking");
    utterance.onend = () => {
      setSpeechStatus("");
      armNoResponseTimer();
      startRecording();
    };
    utterance.onerror = () => {
      setSpeechStatus("The question is shown below. Listening for your answer…");
      armNoResponseTimer();
      startRecording();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startInterview = async () => {
    setError("");
    setStarting(true);
    setReport(null);
    setTurns([]);
    setAnswer("");
    try {
      const response = await fetch(API_URL + "/api/ai/voice-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not start the voice interview.");
      setInterviewId(data.interviewId);
      setQuestion(data.question);
      setSetup(Boolean(data.setup));
      setType(data.interviewType || "");
      setRole(data.role || "");
    } catch (requestError) {
      setError(requestError.message || "Could not start the voice interview.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startInterview();
  }, []);

  const stopRecording = () => {
    if (!recognitionRef.current) {
      recordingRef.current = false;
      setRecording(false);
      return;
    }
    ignoreRecognitionEndRef.current = true;
    try { recognitionRef.current.stop(); } catch { recordingRef.current = false; setRecording(false); ignoreRecognitionEndRef.current = false; }
  };

  const handleNoResponse = () => {
    if (answerRef.current.trim() || submittingRef.current || !interviewId) return;
    setSpeechStatus("No response received. Submitting the interview…");
    window.clearTimeout(noResponseTimerRef.current);
    stopRecording();
    window.speechSynthesis?.cancel();
    const submitWithoutAnswer = () => submitAnswer(true);
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      submitWithoutAnswer();
      return;
    }
    const notice = new window.SpeechSynthesisUtterance("I didn't receive a response. I'll submit your interview now.");
    notice.lang = "en-IN";
    notice.onend = submitWithoutAnswer;
    notice.onerror = submitWithoutAnswer;
    window.speechSynthesis.speak(notice);
  };

  const armNoResponseTimer = () => {
    window.clearTimeout(noResponseTimerRef.current);
    noResponseTimerRef.current = window.setTimeout(handleNoResponse, 20000);
  };

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      recognitionErrorRef.current = "unsupported";
      setSpeechStatus("Voice recognition is unavailable in this browser. Please open the interview in Chrome or Edge.");
      return;
    }
    try {
      if (recordingRef.current) return;
      recognitionErrorRef.current = "";
      const recognition = new Recognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onstart = () => { recordingRef.current = true; setRecording(true); setSpeechStatus("Listening automatically — speak naturally"); };
      recognition.onresult = (event) => {
        let spoken = "";
        for (let index = 0; index < event.results.length; index += 1) spoken += event.results[index][0].transcript + (event.results[index].isFinal ? " " : "");
        answerRef.current = spoken.trim();
        setAnswer(answerRef.current);
        if (answerRef.current) window.clearTimeout(noResponseTimerRef.current);
        window.clearTimeout(submitTimerRef.current);
        submitTimerRef.current = window.setTimeout(() => {
          if (answerRef.current.trim()) submitAnswer();
        }, 2600);
      };
      recognition.onerror = (event) => {
        const messages = {
          "not-allowed": "Microphone access is blocked. Allow microphone access in your browser, then refresh this page.",
          "service-not-allowed": "The browser blocked speech recognition. Allow microphone access and refresh the page.",
          "audio-capture": "No microphone was found. Connect a microphone and refresh this page.",
          "network": "Speech recognition lost its network connection. Check your connection and refresh the page.",
          "no-speech": "I didn’t catch that. Listening again…",
        };
        setSpeechStatus(messages[event.error] || "Speech recognition stopped. Check microphone permission and refresh the page.");
        recognitionErrorRef.current = event.error === "no-speech" ? "" : event.error || "recognition-error";
        recordingRef.current = false;
        setRecording(false);
      };
      recognition.onend = () => {
        recordingRef.current = false;
        setRecording(false);
        if (ignoreRecognitionEndRef.current) {
          ignoreRecognitionEndRef.current = false;
          return;
        }
        if (submittingRef.current) return;
        if (answerRef.current.trim()) {
          window.clearTimeout(submitTimerRef.current);
          setSpeechStatus("Answer captured. Moving to the next question…");
          window.setTimeout(() => submitAnswer(), 350);
        } else if (!recognitionErrorRef.current && interviewId && !report) {
          setSpeechStatus("No speech detected yet. Listening again…");
          window.setTimeout(() => startRecording(), 500);
        }
      };
      recognitionRef.current = recognition;
      answerRef.current = "";
      setAnswer("");
      recognition.start();
    } catch {
      recordingRef.current = false;
      setRecording(false);
      recognitionErrorRef.current = "recognition-error";
      setSpeechStatus("Could not start the microphone. Check browser permission and refresh the page.");
    }
  };

  const submitAnswer = async (finishEarly = false) => {
    const submittedAnswer = (answerRef.current || answer).trim() || (finishEarly ? "No response provided." : "");
    if (!submittedAnswer || submittingRef.current || !interviewId) return;
    submittingRef.current = true;
    window.clearTimeout(submitTimerRef.current);
    window.clearTimeout(noResponseTimerRef.current);
    setError("");
    stopRecording();
    window.speechSynthesis?.cancel();
    const submittedQuestion = question;
    try {
      const response = await fetch(API_URL + "/api/ai/voice-interview/" + encodeURIComponent(interviewId) + "/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({ answer: submittedAnswer, question: submittedQuestion, finishEarly }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not submit your answer.");
      if (!setup && !data.setup) {
        const savedTurn = data.savedTurn || { question: submittedQuestion, answer: submittedAnswer };
        setTurns((items) => [...items, { ...savedTurn, feedback: data.feedback || "" }]);
      }
      setAnswer("");
      answerRef.current = "";
      recognitionErrorRef.current = "";
      setSpeechStatus("");
      if (data.interviewType) setType(data.interviewType);
      if (data.role) setRole(data.role);
      setSetup(Boolean(data.setup));
      if (data.complete) {
        setReport(data.report);
        setQuestion("");
        if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
          const closing = new window.SpeechSynthesisUtterance(data.closingMessage || "I think that is enough for today. Thanks for your answers; your report is ready.");
          closing.lang = "en-IN";
          closing.rate = 0.96;
          window.speechSynthesis.speak(closing);
        }
      } else {
        spokenTextRef.current = [data.feedback, data.question].filter(Boolean).join(" ");
        setQuestion(data.question);
      }
    } catch (requestError) {
      setError(requestError.message || "Could not submit your answer.");
      answerRef.current = "";
      setAnswer("");
      recognitionErrorRef.current = "";
      setSpeechStatus("I couldn’t process that reply. I’ll listen again so you can answer this question.");
      window.setTimeout(() => startRecording(), 800);
    } finally {
      submittingRef.current = false;
    }
  };

  const reset = () => {
    stopRecording();
    window.speechSynthesis?.cancel();
    setInterviewId("");
    setQuestion("");
    setAnswer("");
    setTurns([]);
    setReport(null);
    setError("");
    setSpeechStatus("");
    window.clearTimeout(noResponseTimerRef.current);
    recognitionErrorRef.current = "";
    setType("");
    setRole("");
    setSetup(true);
    startedRef.current = false;
    window.setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      startInterview();
    }, 0);
  };

  return (
    <main className="voice-interview-page">
      <header className="voice-interview-hero">
        <div><p className="voice-eyebrow">YOUR AI INTERVIEWER</p><h1>Let’s talk through your next interview.</h1><p>Speak naturally. The AI will learn what you’re preparing for and adapt its follow-up questions.</p></div>
        <span className="voice-ready"><i /> Voice conversation</span>
      </header>

      {!interviewId && !report && <section className="voice-setup voice-conversation-loading" aria-live="polite"><span className="voice-loading-orb">✦</span><h2>{starting ? "Your interviewer is joining…" : "Getting your conversation ready…"}</h2><p>The interviewer will greet you and ask what kind of role you want to practise for.</p>{error && <p className="voice-error" role="alert">{error}<button type="button" onClick={startInterview}>Try again</button></p>}</section>}

      {interviewId && !report && <section className="voice-session">
        <div className="voice-session-top"><div><p className="voice-eyebrow">{setup ? "GETTING TO KNOW YOUR GOAL" : `${type.toUpperCase()} · ${role.toUpperCase()}`}</p><h2>{setup ? "Let’s choose your interview" : "Live practice"}</h2></div><span>{setup ? "Quick setup" : "Open conversation"}</span></div>
        <div className="voice-stage">
          <div className="voice-interviewer-avatar"><span>AI</span><i>●</i></div>
          <div className="voice-question-copy"><span>AI INTERVIEWER {speechStatus === "Interviewer is speaking" ? "· SPEAKING" : ""}</span><h2>{question}</h2></div>
        </div>
        {turns.length > 0 && <div className="voice-last-feedback"><span>INTERVIEWER FEEDBACK</span><p>{turns[turns.length - 1].feedback}</p></div>}
        <div className="voice-answer-box">
          <div className="voice-answer-heading"><div><strong>Your answer</strong><small>Your spoken words appear here automatically.</small></div><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span></div>
          <div className={"voice-transcript-display" + (answer ? "" : " is-empty")} role="log" aria-live="polite" aria-label="Live speech transcript">{answer || (recording ? "Listening for your answer…" : "Your spoken answer will appear here automatically…")}</div>
          <div className="voice-answer-actions">
            <span className={"voice-speech-status" + (recording ? " is-recording" : "")}>{recording && <i />}{speechStatus || (speechSupported ? "The mic starts automatically after each question." : "Voice recognition is not available in this browser.")}</span>
          </div>
        </div>
        <p className="voice-privacy-note">Your answer transcript and feedback are saved to interview history. Audio isn’t stored by the app; your browser handles speech recognition and may use its own service.</p>
        {error && <p className="voice-error" role="alert">{error}</p>}
      </section>}

      {report && <section className="voice-report">
        <div className="voice-report-header"><div><p className="voice-eyebrow">INTERVIEW COMPLETE</p><h2>Your practice report</h2><p>{type} interview · {role}</p></div><button type="button" onClick={reset}>Start another interview</button></div>
        <div className="voice-score-hero"><div className="voice-overall-score"><strong>{report.scores?.overall ?? "—"}</strong><span>/100</span></div><div><span>OVERALL SCORE</span><p>{report.feedback}</p></div></div>
        <div className="voice-report-grid">{[
          ["Role knowledge", "roleKnowledge"],
          ["Communication", "communication"],
          ["Answer structure", "answerStructure"],
          ["Problem solving", "problemSolving"],
        ].map(([label, key]) => {
          const score = report.scores?.[key];
          return <article className="voice-report-skill" key={key}><div><strong>{label}</strong><span>{score === null || score === undefined ? "Not enough evidence" : score + "%"}</span></div><i><b style={{ width: (score ?? 0) + "%" }} /></i><p>{report.skillEvidence?.[key] || "Not enough interview evidence to assess this skill."}</p></article>;
        })}</div>
        <p className="voice-transcript-caveat">Scores use the recognized answer transcript. This browser feature does not measure voice tone, accent, or vocal confidence.</p>
        <div className="voice-report-columns"><article><h3>What went well</h3>{report.strengths?.length ? <ul>{report.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>Keep practising to build a stronger evidence base.</p>}</article><article><h3>Work on next</h3>{report.improvements?.length ? <ul>{report.improvements.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No major gap was identified in this short round.</p>}</article></div>
        <article className="voice-next-steps"><h3>Your next practice steps</h3><ol>{(report.nextSteps || []).map((item, index) => <li key={index}>{item}</li>)}</ol></article>
        <div className="voice-answer-review"><h3>Answer-by-answer feedback</h3>{turns.map((turn, index) => <details key={index}><summary>Question {index + 1}: {turn.question}</summary><p className="voice-review-answer"><strong>Your answer:</strong> {turn.answer}</p><p>{report.answerFeedback?.find((item) => item.questionIndex === index)?.improvement || turn.feedback}</p></details>)}</div>
      </section>}
    </main>
  );
}

export default VoiceInterview;
