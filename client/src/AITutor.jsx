import { useEffect, useRef, useState } from "react";
import "./AITutor.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");

const TUTOR_MODES = [
  { id: "learn", icon: "✦", title: "Learn a concept", detail: "Clear explanation + example" },
  { id: "quiz", icon: "◇", title: "Quiz me", detail: "One question at a time" },
  { id: "debug", icon: "⌘", title: "Debug code", detail: "Find the cause, learn the fix" },
  { id: "interview", icon: "◉", title: "Mock interview", detail: "Practise speaking your answer" },
  { id: "plan", icon: "▦", title: "Study plan", detail: "Build a focused roadmap" },
];

const MODE_PROMPTS = {
  learn: (focus) => [`Explain a tricky ${focus} concept with a simple example`, `Teach me one important ${focus} concept for interviews`],
  quiz: (focus) => [`Quiz me on ${focus}, one question at a time`, `Give me a ${focus} question and wait for my answer`],
  debug: () => ["Help me debug this code. I will paste the code and error next.", "Explain how to approach debugging a coding problem"],
  interview: (focus) => [`Start a mock interview about ${focus}. Ask one question and wait for my answer.`, "Help me structure a strong interview answer using STAR"],
  plan: (focus) => [`Make me a practical 7-day study plan for ${focus}`, "Help me plan a 30-minute daily interview-prep routine"],
};

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

function renderInline(text, keyPrefix) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function TutorMessageContent({ content }) {
  const chunks = String(content || "").split(/```([\s\S]*?)```/g);
  return <div className="ai-tutor-message-content">{chunks.map((chunk, chunkIndex) => {
    if (chunkIndex % 2 === 1) return <pre className="ai-tutor-code-block" key={`code-${chunkIndex}`}><code>{chunk.replace(/^\w+\n/, "").trimEnd()}</code></pre>;
    return chunk.split("\n").map((line, lineIndex) => {
      const key = `text-${chunkIndex}-${lineIndex}`;
      if (!line.trim()) return <div className="ai-tutor-line-space" key={key} />;
      if (/^#{1,3}\s/.test(line)) return <h4 key={key}>{renderInline(line.replace(/^#{1,3}\s/, ""), key)}</h4>;
      if (/^[-*]\s/.test(line)) return <div className="ai-tutor-list-item" key={key}><i />{renderInline(line.replace(/^[-*]\s/, ""), key)}</div>;
      if (/^\d+[.)]\s/.test(line)) return <div className="ai-tutor-list-item is-numbered" key={key}>{renderInline(line, key)}</div>;
      return <p key={key}>{renderInline(line, key)}</p>;
    });
  })}</div>;
}

function AITutor() {
  const [storageKey] = useState(getTutorStorageKey);
  const [messages, setMessages] = useState(loadTutorMessages);
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState("Coding interviews");
  const [level, setLevel] = useState("Beginner");
  const [replyLanguage, setReplyLanguage] = useState("Hinglish");
  const [mode, setMode] = useState("learn");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const activeMode = TUTOR_MODES.find((item) => item.id === mode) || TUTOR_MODES[0];
  const suggestions = MODE_PROMPTS[mode](focus);

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
        body: JSON.stringify({ message: content, history: previousMessages, focus, level, replyLanguage, mode }),
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
          <p className="small-heading">YOUR PERSONAL LEARNING SPACE</p>
          <h1>AI Tutor</h1>
          <p>Learn concepts, practise problems, and get unstuck with a tutor that adapts to you.</p>
        </div>
        <span className="ai-tutor-status"><i /> AI tutor ready</span>
      </header>

      <div className="ai-tutor-workspace">
        <aside className="ai-tutor-sidebar">
          <div className="ai-tutor-panel-heading"><span className="ai-tutor-panel-icon">⚙</span><div><strong>Learning setup</strong><small>Personalize your session</small></div></div>
          <label>Learning focus
            <select value={focus} onChange={(event) => setFocus(event.target.value)}>
              <option>Coding interviews</option><option>Data structures & algorithms</option><option>Java</option><option>C++</option><option>Python</option><option>Technical concepts</option><option>Behavioral interviews</option><option>Study planning</option>
            </select>
          </label>
          <label>Your level
            <select value={level} onChange={(event) => setLevel(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          </label>
          <label>Reply language
            <select value={replyLanguage} onChange={(event) => setReplyLanguage(event.target.value)}><option>Hinglish</option><option>English</option><option>Hindi</option></select>
          </label>

          <div className="ai-tutor-mode-section">
            <div className="ai-tutor-section-title"><span>Choose a session</span><small>5 modes</small></div>
            <div className="ai-tutor-mode-list">
              {TUTOR_MODES.map((item) => <button type="button" key={item.id} className={`ai-tutor-mode${mode === item.id ? " is-active" : ""}`} onClick={() => setMode(item.id)} aria-pressed={mode === item.id}>
                <span className="ai-tutor-mode-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><span className="ai-tutor-mode-arrow">›</span>
              </button>)}
            </div>
          </div>

          <div className="ai-tutor-sidebar-tip"><span>✦</span><div><strong>Learn actively</strong><p>Try explaining the idea back in your own words. The tutor can check your understanding.</p></div></div>
        </aside>

        <div className="ai-tutor-chat">
          <div className="ai-tutor-chat-header">
            <div className="ai-tutor-chat-title"><span className="ai-tutor-chat-avatar">✦</span><div><strong>Your AI learning partner</strong><small>{focus} <i /> {level} <i /> {replyLanguage}</small></div></div>
            <div className="ai-tutor-chat-actions"><span className="ai-tutor-mode-badge">{activeMode.title}</span><button className="ai-tutor-clear" type="button" onClick={clearConversation} disabled={!messages.length || sending}>New chat</button></div>
          </div>

          <div className="ai-tutor-messages" aria-live="polite">
            {!messages.length && <div className="ai-tutor-welcome">
              <span className="ai-tutor-orb" aria-hidden="true">✦</span>
              <p className="ai-tutor-welcome-eyebrow">LET'S MAKE PROGRESS</p>
              <h2>{mode === "quiz" ? "Ready for a quick challenge?" : mode === "debug" ? "Let's solve what you're stuck on." : mode === "plan" ? "Build a plan you can follow." : mode === "interview" ? "Let's practise like it's interview day." : "What would you like to learn today?"}</h2>
              <p>Choose a prompt to get started, or write your own question below.</p>
              <div className="ai-tutor-quick-prompts">{suggestions.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)} disabled={sending}><span>{prompt}</span><b>→</b></button>)}</div>
            </div>}
            {messages.map((message, index) => <article className={`ai-tutor-message ${message.role === "user" ? "from-user" : "from-tutor"}`} key={`${index}-${message.role}`}>
              <span className="ai-tutor-avatar">{message.role === "user" ? "YOU" : "✦ TUTOR"}</span>
              <div className="ai-tutor-message-card"><TutorMessageContent content={message.content} /></div>
            </article>)}
            {sending && <div className="ai-tutor-thinking"><span className="ai-tutor-avatar">✦ TUTOR</span><span><i /><i /><i /> Preparing a helpful answer…</span></div>}
            <div ref={bottomRef} />
          </div>

          {error && <p className="ai-tutor-error" role="alert">{error}</p>}
          <form className="ai-tutor-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={mode === "debug" ? "Paste your code and error message…" : "Ask a question, share your attempt, or paste code…"} aria-label="Message your AI tutor" rows="2" maxLength={4000} />
            <div className="ai-tutor-composer-footer"><span>Enter to send <i /> Shift + Enter for a new line <i /> {input.length}/4000</span><button type="submit" disabled={sending || !input.trim()}>{sending ? "Thinking…" : "Send to tutor"}<b>↑</b></button></div>
          </form>
        </div>
      </div>
      <p className="ai-tutor-disclaimer">Tutor responses use the configured Azure AI Foundry model. Verify important details against your course material.</p>
    </section>
  );
}

export default AITutor;
