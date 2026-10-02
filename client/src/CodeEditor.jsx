import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { indentUnit, StreamLanguage } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { Decoration, EditorView, keymap } from "@codemirror/view";
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

const getSolutionBodyRange = (source) => {
  const begin = /^[ \t]*(?:\/\/|#)[ \t]*BEGIN SOLUTION[ \t]*$/m.exec(source);
  const endPattern = /^[ \t]*(?:\/\/|#)[ \t]*END SOLUTION[ \t]*$/gm;
  let end = null;
  let match;
  while ((match = endPattern.exec(source))) {
    if (!begin || match.index > begin.index) { end = match; break; }
  }
  if (!begin || !end) return null;
  const beginLineBreak = source.indexOf("\n", begin.index + begin[0].length);
  const from = beginLineBreak === -1 ? begin.index + begin[0].length : beginLineBreak + 1;
  return end.index >= from ? { from, to: end.index } : null;
};

function getDriverRange(source) {
  const begin = /^[ \t]*(?:\/\/|#)[ \t]*BEGIN DRIVER[ \t]*$/m.exec(source);
  if (!begin) return null;
  const endPattern = /^[ \t]*(?:\/\/|#)[ \t]*END DRIVER[ \t]*$/gm;
  endPattern.lastIndex = begin.index + begin[0].length;
  const end = endPattern.exec(source);
  if (!end) return null;
  const endOfLine = source.indexOf("\n", end.index + end[0].length);
  return { from: begin.index, to: endOfLine === -1 ? source.length : endOfLine + 1 };
}

function CodeEditor({ language = "javascript", value, onChange, onRun, ariaLabel = "Code editor", className = "", lockOutsideSolution = false }) {
  const onRunRef = useRef(onRun);
  useEffect(() => { onRunRef.current = onRun; }, [onRun]);

  const driverRange = typeof value === "string" ? getDriverRange(value) : null;
  const editorValue = driverRange
    ? `${value.slice(0, driverRange.from)}${value.slice(driverRange.to)}`
    : value;
  const handleEditorChange = (nextEditorValue) => {
    if (!driverRange) {
      onChange?.(nextEditorValue);
      return;
    }
    const driverSource = value.slice(driverRange.from, driverRange.to);
    const nextDriverStart = Math.max(0, Math.min(
      nextEditorValue.length,
      driverRange.from + nextEditorValue.length - editorValue.length
    ));
    onChange?.(`${nextEditorValue.slice(0, nextDriverStart)}${driverSource}${nextEditorValue.slice(nextDriverStart)}`);
  };

  const extensions = useMemo(() => {
    const solutionLock = lockOutsideSolution ? [
      EditorState.changeFilter.of((transaction) => {
        const range = getSolutionBodyRange(transaction.startState.doc.toString());
        if (!range) return false;
        let allowed = true;
        transaction.changes.iterChanges((from, to) => {
          if (from < range.from || to > range.to) allowed = false;
        });
        return allowed;
      }),
      EditorView.decorations.compute(["doc"], (state) => {
        const range = getSolutionBodyRange(state.doc.toString());
        if (!range) {
          return Decoration.set(Array.from({ length: state.doc.lines }, (_, index) =>
            Decoration.line({ class: "cm-scaffold-line" }).range(state.doc.line(index + 1).from)
          ));
        }
        const protectedLines = [];
        for (let number = 1; number <= state.doc.lines; number += 1) {
          const line = state.doc.line(number);
          if (line.from < range.from || line.from >= range.to) {
            protectedLines.push(Decoration.line({ class: "cm-scaffold-line" }).range(line.from));
          }
        }
        return Decoration.set(protectedLines);
      }),
    ] : [];

    return [
      LANGUAGE_EXTENSIONS[language]?.() || javascript(),
      indentUnit.of("    "),
      closeBrackets(),
      keymap.of([{ key: "Mod-Enter", run: () => { onRunRef.current?.(); return true; } }]),
      ...solutionLock,
    ];
  }, [language, lockOutsideSolution]);

  return (
    <div className={`arena-code-editor ${className}`.trim()}>
      <CodeMirror
        value={editorValue}
        onChange={handleEditorChange}
        extensions={extensions}
        theme={oneDark}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
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
      {driverRange && (
        <div className="coding-locked-driver" role="note" aria-label="Locked, read-only program driver">
          <code>{language === "java" ? "class Main" : language === "csharp" ? "class Program" : "Driver"} &#123; … &#125;</code>
          <span><i aria-hidden="true">🔒</i> Locked runner</span>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
