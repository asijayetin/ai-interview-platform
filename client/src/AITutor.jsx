import { useEffect, useRef, useState } from "react";
import "./AITutor.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const QUICK_PROMPTS = [
  "Explain binary search with a small example",
  "Quiz me on Java arrays, one question at a time",
  "Make me a 7-day coding interview study plan",
];
const getTutorStorageKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return "arenaTutor:" + (user.email || user._id || "guest");
  } catch {
    return "arenaTutor:guest";
  }
};
const loadTutorMessages = () => {
  try {
    const messages = JSON.parse(localStorage.getItem(getTutorStorageKey()) || "[]");
    return Array.isArray(messages) ? messages.slice(-40) : [];
  } catch {
    return [];
  }
};

function AITutor() {
  const [storageKey] = useState(getTutorStorageKey);
  const [messages, setMessages] = useState(loadTutorMessages);
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState("Coding interviews");
  const [level, setLevel] = useState("Beginner");
  const [replyLanguage, setReplyLanguage] = useState("Hinglish");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // Keep the current conversation usable if browser storage is unavailable.
    }
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendMessage = async (prompt) => {
    const content = String(prompt ?? input).trim();
    if (!content || sending) return;
    if (!API_URL) {
      setError("The app server is not configured.");
      return;
    }
    const previousMessages = messages.slice(-10).map(({ role, content: text }) => ({ role, content: text }));
    setMessages((current) => [...current, { role: "user", content }]);
    setInput("");
    setError("");
    setSending(true);
    try {
      const response = await fetch(API_URL + "/api/ai/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ message: content, history: previousMessages, focus, level, replyLanguage }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "The tutor couldn't reply. Please try again.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply || "I couldn't form a reply. Try asking that another way." }]);
    } catch (sendError) {
      setError(sendError.message || "The tutor couldn't reply. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError("");
    localStorage.removeItem(storageKey);
  };

  return (
    <section className="ai-tutor-page">
      <header className="ai-tutor-heading">
        <div>
          <p className="small-heading">AI TUTOR</p>
          <h1>Learn it. Practise it. Explain it.</h1>
          <p>Get clear lessons, one-at-a-time quizzes, and interview prep tailored to you.</p>
        </div>
        <span className="ai-tutor-status"><i /> Ready to help</span>
      </header>

      <div className="ai-tutor-workspace">
        <div className="ai-tutor-controls">
          <label>Learning focus
            <select value={focus} onChange={(event) => setFocus(event.target.value)}>
              <option>Coding interviews</option>
              <option>Data structures & algorithms</option>
              <option>Java</option>
              <option>C++</option>
              <option>Python</option>
              <option>Technical concepts</option>
              <option>Behavioral interviews</option>
              <option>Study planning</option>
            </select>
          </label>
          <label>Level
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label>Reply language
            <select value={replyLanguage} onChange={(event) => setReplyLanguage(event.target.value)}>
              <option>Hinglish</option>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </label>
          <button className="ai-tutor-clear" type="button" onClick={clearConversation} disabled={!messages.length || sending}>Clear chat</button>
        </div>

        <div className="ai-tutor-messages" aria-live="polite">
          {!messages.length && (
            <div className="ai-tutor-welcome">
              <span className="ai-tutor-orb" aria-hidden="true">✦</span>
              <h2>Your learning session starts here</h2>
              <p>Ask a question, paste code you are stuck on, or pick a quick prompt.</p>
              <div className="ai-tutor-quick-prompts">
                {QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)} disabled={sending}>{prompt}<span>→</span></button>)}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <article className={"ai-tutor-message " + (message.role === "user" ? "from-user" : "from-tutor")} key={index}>
              <span className="ai-tutor-avatar">{message.role === "user" ? "You" : "✦ Tutor"}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {sending && <div className="ai-tutor-thinking"><span className="ai-tutor-avatar">✦ Tutor</span><span><i /> Thinking through it…</span></div>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="ai-tutor-error" role="alert">{error}</p>}
        <form className="ai-tutor-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
            placeholder="Ask a question, request a hint, or paste code…"
            aria-label="Message your AI tutor"
            rows="2"
            maxLength={4000}
          />
          <div className="ai-tutor-composer-footer">
            <span>Enter to send · Shift + Enter for a new line</span>
            <button type="submit" disabled={sending || !input.trim()}>{sending ? "Thinking…" : "Send message"} <span>→</span></button>
          </div>
        </form>
      </div>
      <p className="ai-tutor-disclaimer">Tutor replies use your configured Azure AI Foundry model. Check important details against your course material.</p>
    </section>
  );
}

export default AITutor;
