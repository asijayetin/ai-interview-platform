const findClosingBrace = (source, openIndex) => {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) { if (char === "\n") lineComment = false; continue; }
    if (blockComment) { if (char === "*" && next === "/") { blockComment = false; i += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; i += 1; continue; }
    if (char === "/" && next === "*") { blockComment = true; i += 1; continue; }
    if (char === "\"" || char === "'") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return i;
  }
  return -1;
};

export const getJavaFunctionName = (question) => {
  const words = question.id.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return words.map((word, index) => {
    const normalized = word.toLowerCase();
    return index === 0 ? normalized : normalized[0].toUpperCase() + normalized.slice(1);
  }).join("");
};

const getSolutionParts = (question) => {
  const original = question.solution || "";
  const classMatch = /\bclass\s+Main\s*\{/.exec(original);
  if (!classMatch) return { prefix: "", helper: "", body: "// TODO: Solve the problem here." };
  const classOpen = original.indexOf("{", classMatch.index);
  const classClose = findClosingBrace(original, classOpen);
  if (classClose < 0) return { prefix: "", helper: "", body: "// TODO: Solve the problem here." };
  const classBody = original.slice(classOpen + 1, classClose);
  const mainMatch = /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w*\s*\)\s*\{/.exec(classBody);
  if (!mainMatch) return { prefix: "", helper: "", body: "// TODO: Solve the problem here." };
  const mainOpen = classBody.indexOf("{", mainMatch.index);
  const mainClose = findClosingBrace(classBody, mainOpen);
  if (mainClose < 0) return { prefix: "", helper: "", body: "// TODO: Solve the problem here." };
  let body = classBody.slice(mainOpen + 1, mainClose);
  const scannerMatch = /^\s*Scanner\s+(\w+)\s*=\s*new\s+Scanner\(System\.in\)\s*;/.exec(body);
  const scannerName = scannerMatch?.[1] || "sc";
  if (scannerMatch) body = body.slice(scannerMatch[0].length);
  const prefix = original.slice(0, classMatch.index).replace(/^\s*import\s+java\.util\.\*\s*;?\s*/m, "").trim();
  return {
    prefix,
    helper: classBody.slice(0, mainMatch.index).trim(),
    body: body.trim(),
    scannerName,
  };
};

export const formatJava = (source) => {
  let output = "";
  let line = "";
  let indent = 0;
  let parens = 0;
  let quote = "";
  let escaped = false;
  const emit = () => {
    const trimmed = line.trim();
    if (trimmed) output += `${"    ".repeat(Math.max(0, indent))}${trimmed}\n`;
    line = "";
  };
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === "\r") continue;
    if (char === "\n") { emit(); continue; }
    if (quote) {
      line += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "\"" || char === "'") { quote = char; line += char; continue; }
    if (char === "(") parens += 1;
    if (char === ")") parens = Math.max(0, parens - 1);
    if (char === "{") {
      line = `${line.trimEnd()} {`;
      emit();
      indent += 1;
    } else if (char === "}") {
      emit();
      indent = Math.max(0, indent - 1);
      line = "}";
      if (source[i + 1] !== ";" && source[i + 1] !== ",") emit();
    } else if (char === ";" && parens === 0) {
      line += char;
      emit();
    } else if (char === ",") {
      line += ", ";
      if (source[i + 1] === " " || source[i + 1] === "\t") i += 1;
    } else if ("+-*/%^&|".includes(char) && source[i + 1] === "=") {
      line = `${line.trimEnd()} ${char}= `;
      i += 1;
      if (/\s/.test(source[i + 1] || "")) i += 1;
    } else if (char === "=" && !["=", ">"].includes(source[i + 1]) && !["=", "!", "<", ">", "+", "-", "*", "/", "%", "&", "|", "^"].includes(source[i - 1])) {
      line = `${line.trimEnd()} = `;
      if (/\s/.test(source[i + 1] || "")) i += 1;
    } else if ((char === "+" || char === "-") && source[i + 1] !== char && source[i - 1] !== char && source[i + 1] !== ">" && source[i + 1] !== "=") {
      line = `${line.trimEnd()} ${char} `;
      if (/\s/.test(source[i + 1] || "")) i += 1;
    } else {
      line += char;
    }
  }
  emit();
  return output
    .replace(/\b(if|for|while|switch|catch)\(/g, "$1 (")
    .replace(/>(?=[A-Za-z])/g, "> ")
    .replace(/\](?=[A-Za-z])/g, "] ")
    .replace(/\s+\n/g, "\n")
    .trim();
};

export const buildJavaTemplate = (question, { answer = false } = {}) => {
  const name = getJavaFunctionName(question);
  const parts = getSolutionParts(question);
  const body = answer
    ? formatJava(parts.body || "// No solution body found.")
    : "        // TODO: Write your solution here.\n        // Read input with sc and print the required result.";
  const helpers = answer && parts.helper
    ? formatJava(parts.helper)
    : "        // Add helper methods here if you need them.";
  const prefix = parts.prefix ? `${parts.prefix}\n\n` : "";
  const scannerName = parts.scannerName || "sc";
  const source = `import java.util.*;\n\n${prefix}class Solution {\n    static void ${name}(Scanner ${scannerName}) {\n        // BEGIN SOLUTION\n${body}\n        // END SOLUTION\n    }\n\n    // BEGIN HELPERS\n${helpers}\n    // END HELPERS\n}\n\n// BEGIN DRIVER\nclass Main {\n    public static void main(String[] args) {\n        Solution.${name}(new Scanner(System.in));\n    }\n}\n// END DRIVER`;
  return formatJava(source);
};
