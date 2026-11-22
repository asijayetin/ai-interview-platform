import { useEffect, useRef, useState } from "react";
import "./VoiceInterview.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const TOTAL_QUESTIONS = 5;

function VoiceInterview() {
  const [type, setType] = useState("");
  const [role, setRole] = useState("");
  const [interviewId, setInterviewId] = useState("");
  const [setup, setSetup] = useState(true);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState([]);
  const [report, setReport] = useState(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const answerRef = useRef("");
  const startedRef = useRef(false);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      try { recognitionRef.current?.abort(); } catch { /* no active mic session */ }
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!question || report) return undefined;
    const timer = window.setTimeout(() => speakQuestion(), 180);
    return () => window.clearTimeout(timer);
  }, [question, report]);

  const speakQuestion = () => {
    if (!question || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-IN";
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeechStatus("Interviewer is speaking");
    utterance.onend = () => setSpeechStatus("");
    utterance.onerror = () => setSpeechStatus("");
    window.speechSynthesis.speak(utterance);
  };

  const startInterview = async () => {
    setError("");
    const targetRole = role.trim();
    if (!targetRole || targetRole.length > 100) {
      setError("Enter a target role (up to 100 characters) so the AI can tailor your questions.");
      return;
    }
    setStarting(true);
    setReport(null);
    setTurns([]);
    setAnswer("");
    try {
      const response = await fetch(API_URL + "/api/ai/voice-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({ role: targetRole, interviewType: type }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not start the voice interview.");
      setInterviewId(data.interviewId);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber || 1);
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
    try { recognitionRef.current?.stop(); } catch { setRecording(false); }
  };

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechStatus("Speech recognition is unavailable. Type your answer below.");
      return;
    }
    try {
      recognitionRef.current?.abort();
      const recognition = new Recognition();
      recognition.lang = "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => { setRecording(true); setSpeechStatus("Listening — speak naturally"); };
      recognition.onresult = (event) => {
        let spoken = "";
        for (let index = 0; index < event.results.length; index += 1) spoken += event.results[index][0].transcript + (event.results[index].isFinal ? " " : "");
        answerRef.current = spoken.trim();
        setAnswer(answerRef.current);
      };
      recognition.onerror = (event) => {
        const messages = {
          "not-allowed": "Microphone access is blocked. Allow microphone access or type your answer.",
          "audio-capture": "No microphone was found. Connect one or type your answer.",
          "network": "Speech recognition needs an internet connection. You can type your answer instead.",
          "no-speech": "I didn’t catch that. Try again or type your answer.",
        };
        setSpeechStatus(messages[event.error] || "Speech recognition stopped. You can continue by typing.");
        setRecording(false);
      };
      recognition.onend = () => {
        setRecording(false);
        setSpeechStatus((status) => status.startsWith("Listening") ? "" : status);
      };
      recognitionRef.current = recognition;
      answerRef.current = "";
      setAnswer("");
      recognition.start();
    } catch {
      setRecording(false);
      setSpeechStatus("Could not start the microphone. Check browser permission or type your answer.");
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || submitting || !interviewId) return;
    setError("");
    setSubmitting(true);
    stopRecording();
    window.speechSynthesis?.cancel();
    const submittedQuestion = question;
    const submittedAnswer = answer.trim();
    try {
      const response = await fetch(API_URL + "/api/ai/voice-interview/" + encodeURIComponent(interviewId) + "/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({ answer: submittedAnswer }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not submit your answer.");
      if (!setup) setTurns((items) => [...items, { question: submittedQuestion, answer: submittedAnswer, feedback: data.feedback || "" }]);
      setAnswer("");
      answerRef.current = "";
      setSpeechStatus("");
      if (data.interviewType) setType(data.interviewType);
      if (data.role) setRole(data.role);
      setSetup(Boolean(data.setup));
      if (data.complete) {
        setReport(data.report);
        setQuestion("");
        setQuestionNumber(TOTAL_QUESTIONS);
      } else {
        setQuestion(data.question);
        setQuestionNumber(data.questionNumber);
      }
    } catch (requestError) {
      setError(requestError.message || "Could not submit your answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    stopRecording();
    window.speechSynthesis?.cancel();
    setInterviewId("");
    setQuestion("");
    setQuestionNumber(0);
    setAnswer("");
    setTurns([]);
    setReport(null);
    setError("");
    setSpeechStatus("");
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
        <div><p className="voice-eyebrow">YOUR AI INTERVIEWER</p><h1>Let’s talk through your next interview.</h1><p>Speak naturally or type. The AI will learn what you’re preparing for and adapt its follow-up questions.</p></div>
        <span className="voice-ready"><i /> Voice + text</span>
      </header>

      {!interviewId && !report && <section className="voice-setup voice-conversation-loading" aria-live="polite"><span className="voice-loading-orb">✦</span><h2>{starting ? "Your interviewer is joining…" : "Getting your conversation ready…"}</h2><p>The interviewer will greet you and ask what kind of role you want to practise for.</p>{error && <p className="voice-error" role="alert">{error}<button type="button" onClick={startInterview}>Try again</button></p>}</section>}

      {interviewId && !report && <section className="voice-session">
        <div className="voice-session-top"><div><p className="voice-eyebrow">{setup ? "GETTING TO KNOW YOUR GOAL" : `${type.toUpperCase()} · ${role.toUpperCase()}`}</p><h2>{setup ? "Let’s choose your interview" : "Live practice"}</h2></div><span>{setup ? "Quick setup" : `Question ${questionNumber} of ${TOTAL_QUESTIONS}`}</span></div>
        <div className="voice-progress"><i style={{ width: ((questionNumber / TOTAL_QUESTIONS) * 100) + "%" }} /></div>
        <div className="voice-stage">
          <div className="voice-interviewer-avatar"><span>AI</span><i>●</i></div>
          <div className="voice-question-copy"><span>AI INTERVIEWER {speechStatus === "Interviewer is speaking" ? "· SPEAKING" : ""}</span><h2>{question}</h2><button className="voice-replay-question" type="button" onClick={speakQuestion}>▶ Play question again</button></div>
        </div>
        {turns.length > 0 && <div className="voice-last-feedback"><span>INTERVIEWER FEEDBACK</span><p>{turns[turns.length - 1].feedback}</p></div>}
        <div className="voice-answer-box">
          <div className="voice-answer-heading"><div><strong>Your answer</strong><small>Speak or type what you would say in a real interview.</small></div><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span></div>
          <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); answerRef.current = event.target.value; }} placeholder="Your spoken answer will appear here. You can edit the transcript or type instead…" rows={5} maxLength={5000} aria-label="Your interview answer" />
          <div className="voice-answer-actions">
            <span className={"voice-speech-status" + (recording ? " is-recording" : "")}>{recording && <i />}{speechStatus || (speechSupported ? "Speech transcript · editable" : "Speech recognition isn’t supported in this browser")}</span>
            <div><button className={"voice-record-button" + (recording ? " is-recording" : "")} type="button" onClick={recording ? stopRecording : startRecording}>{recording ? "■ Stop recording" : "🎙 Answer by voice"}</button><button className="voice-submit-button" type="button" onClick={submitAnswer} disabled={!answer.trim() || submitting}>{submitting ? "Thinking…" : setup ? "Reply to interviewer" : questionNumber === TOTAL_QUESTIONS ? "Finish interview" : "Submit answer"}<b>→</b></button></div>
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
