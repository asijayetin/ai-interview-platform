import { useEffect, useState } from "react";
import CodeEditor from "./CodeEditor";
import "./CodingPractice.css";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : ""))
  .trim().replace(/\/+$/, "").replace(/\/api$/i, "");

const LANGUAGE_INFO = {
  javascript: { label: "JavaScript", ext: "js", starter: `// Write and run your code here\nconst input = require('fs').readFileSync(0, 'utf8').trim();\nconsole.log(input || 'Hello, world!');` },
  python: { label: "Python", ext: "py", starter: `# Write and run your code here\nimport sys\n\ntext = sys.stdin.read().strip()\nprint(text or "Hello, world!")` },
  java: { label: "Java", ext: "java", starter: `import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String input = scanner.hasNextLine() ? scanner.nextLine() : "Hello, world!";\n        System.out.println(input);\n    }\n}` },
  cpp: { label: "C++", ext: "cpp", starter: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << (input.empty() ? "Hello, world!" : input) << endl;\n    return 0;\n}` },
  csharp: { label: "C#", ext: "cs", starter: `using System;\n\nclass Program {\n    static void Main() {\n        var input = Console.ReadLine();\n        Console.WriteLine(string.IsNullOrEmpty(input) ? "Hello, world!" : input);\n    }\n}` },
};

const getSavedLanguage = () => {
  const saved = localStorage.getItem("practiceLanguage");
  return Object.prototype.hasOwnProperty.call(LANGUAGE_INFO, saved) ? saved : "javascript";
};
const getSavedCode = (language) => localStorage.getItem(`practiceCode:${language}`) || LANGUAGE_INFO[language]?.starter || LANGUAGE_INFO.javascript.starter;

function CodingPractice() {
  const [language, setLanguage] = useState(getSavedLanguage);
  const [code, setCode] = useState(() => getSavedCode(getSavedLanguage()));
  const [stdin, setStdin] = useState("");
  const [runtimeInfo, setRuntimeInfo] = useState({ loading: true, configured: false, languages: [], message: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/code/runtimes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        setRuntimeInfo({ loading: false, configured: Boolean(data.configured), languages: data.languages || [], message: data.message || "" });
      })
      .catch(() => setRuntimeInfo({ loading: false, configured: false, languages: [], message: "Could not reach the app server." }));
  }, []);

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem("practiceLanguage", nextLanguage);
    setCode(getSavedCode(nextLanguage));
    setResult(null);
    setError("");
  };

  const runCode = async () => {
    setError("");
    setResult(null);
    if (!runtimeInfo.configured) {
      setError("The hosted compiler is temporarily unavailable. Please try again shortly.");
      return;
    }
    setRunning(true);
    try {
      const response = await fetch(`${API_URL}/api/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ language, code, stdin }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not run this code.");
      setResult(data);
    } catch (runError) {
      setError(runError.message || "Could not run this code.");
    } finally {
      setRunning(false);
    }
  };

  const available = runtimeInfo.languages.filter((item) => item.available).map((item) => item.id);

  return (
    <section className="practice-page">
      <header className="practice-heading">
        <div>
          <p className="small-heading">CODING PRACTICE</p>
          <h1>Your coding workspace</h1>
          <p>Write code, provide input, and see the output in one place.</p>
        </div>
        <span className={`runner-status ${runtimeInfo.configured ? "is-ready" : "is-pending"}`}>
          <i />{runtimeInfo.loading ? "Connecting compiler" : runtimeInfo.configured ? "Compiler ready" : "Compiler unavailable"}
        </span>
      </header>

      <div className="practice-workbench">
        <div className="practice-toolbar">
          <label className="practice-language-select">Language
            <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {Object.entries(LANGUAGE_INFO).map(([id, info]) => {
                const isAvailable = available.includes(id);
                return <option key={id} value={id} disabled={runtimeInfo.configured && !isAvailable}>{info.label}{runtimeInfo.configured && !isAvailable ? " — unavailable" : ""}</option>;
              })}
            </select>
          </label>
          <div className="practice-toolbar-actions">
            <button className="practice-reset-btn" onClick={() => changeLanguage(language)}>Reset code</button>
            <button className="practice-run-btn" onClick={runCode} disabled={running || runtimeInfo.loading}>
              <span aria-hidden="true">{running ? "◌" : "▶"}</span> {running ? "Running…" : "Run code"}<kbd>Ctrl ↵</kbd>
            </button>
          </div>
        </div>

        <div className="practice-editor-shell">
          <div className="practice-editor-title"><span className="practice-file-dot" />{language === "java" || language === "csharp" ? "Main" : "main"}.{LANGUAGE_INFO[language].ext}<span>Starter playground</span></div>
          <div className="practice-editor">
            <CodeEditor
              language={language}
              value={code}
              onChange={(nextCode) => { setCode(nextCode); localStorage.setItem(`practiceCode:${language}`, nextCode); }}
              onRun={runCode}
              ariaLabel={`${LANGUAGE_INFO[language].label} coding workspace`}
              className="practice-code-mirror"
            />
          </div>
        </div>

        <div className="practice-io-grid">
          <label className="practice-io-panel"><span>Custom input <small>stdin</small></span>
            <textarea value={stdin} onChange={(event) => setStdin(event.target.value)} placeholder="Type input for your program…" />
          </label>
          <div className="practice-io-panel practice-output-panel"><span>Output <small>{result?.runtime ? `runtime ${result.runtime}` : "program result"}</small></span>
            <pre>{running ? "Running your code…" : error || (result ? [result.compileOutput, result.stdout, result.stderr].filter(Boolean).join("\n") || "Program finished with no output." : "Run your code to see output here.")}</pre>
            {result && !error && <em className={result.exitCode === 0 ? "output-success" : "output-failure"}>{result.exitCode === 0 ? "Finished successfully" : result.message || `Exited with code ${result.exitCode ?? "unknown"}`}</em>}
          </div>
        </div>
        {!runtimeInfo.loading && !runtimeInfo.configured && <div className="practice-setup-note"><strong>Online compiler unavailable</strong><span>{runtimeInfo.message || "The hosted compiler service did not respond. Try again in a moment."}</span></div>}
        {runtimeInfo.configured && available.length < Object.keys(LANGUAGE_INFO).length && <div className="practice-setup-note"><strong>Some languages are temporarily unavailable</strong><span>Choose one of the available languages above or try again later.</span></div>}
      </div>
      <p className="practice-shortcut-hint">Code is saved in this browser as you work. Use <kbd>Tab</kbd> to indent and <kbd>Ctrl + Enter</kbd> to run. Code runs on Wandbox’s hosted compiler; runs are submitted with saving disabled.</p>
    </section>
  );
}

export default CodingPractice;
