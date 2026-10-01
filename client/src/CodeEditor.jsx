import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { indentUnit, StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { keymap } from "@codemirror/view";
import { closeBrackets } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import "./CodeEditor.css";

const LANGUAGE_EXTENSIONS = {
  javascript,
  python,
  java,
  cpp,
  csharp: () => StreamLanguage.define(csharp),
};

function CodeEditor({ language = "javascript", value, onChange, onRun, ariaLabel = "Code editor", className = "" }) {
  const onRunRef = useRef(onRun);
  useEffect(() => { onRunRef.current = onRun; }, [onRun]);

  const extensions = useMemo(() => [
    LANGUAGE_EXTENSIONS[language]?.() || javascript(),
    indentUnit.of("    "),
    closeBrackets(),
    keymap.of([{ key: "Mod-Enter", run: () => { onRunRef.current?.(); return true; } }]),
  ], [language]);

  return (
    <div className={`arena-code-editor ${className}`.trim()}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={oneDark}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
          tabSize: 4,
        }}
        aria-label={ariaLabel}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
      />
    </div>
  );
}

export default CodeEditor;
