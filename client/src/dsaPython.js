import { TYPED_FUNCTIONS } from "./dsaJava.js";

const signatureParts = (signature) => {
  const match = /^(?:static\s+)?(.+?)\s+(\w+)\s*\((.*)\)$/.exec(signature.trim());
  if (!match) throw new Error(`Unsupported DSA function signature: ${signature}`);
  const args = match[3].trim() ? match[3].split(/,\s*/).map((part) => {
    const parsed = /^(.+?)\s+(\w+)$/.exec(part.trim());
    return { type: parsed[1].trim(), name: parsed[2] };
  }) : [];
  return { result: match[1].trim(), name: match[2], args };
};

const pythonType = (type) => type
  .replace(/int\[\]\[\]/g, "list[list[int]]")
  .replace(/char\[\]\[\]/g, "list[list[str]]")
  .replace(/long\[\]/g, "list[int]")
  .replace(/int\[\]/g, "list[int]")
  .replace(/String\[\]/g, "list[str]")
  .replace(/List<List<Integer>>/g, "list[list[int]]")
  .replace(/List<Integer>/g, "list[int]")
  .replace(/List<String>/g, "list[str]")
  .replace(/\bString\b/g, "str")
  .replace(/\bboolean\b/g, "bool")
  .replace(/\b(?:long|int)\b/g, "int")
  .replace(/\bchar\b/g, "str")
  .replace(/\b(?:ListNode|TreeNode)\b/g, (typeName) => typeName);

const splitTopLevel = (text, delimiter = ",") => {
  const parts = []; let start = 0; let depth = 0; let quote = ""; let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === quote) quote = ""; continue; }
    if (char === "\"" || char === "'") { quote = char; continue; }
    if ("([{<".includes(char)) depth++;
    else if (")]}>".includes(char)) depth--;
    else if (char === delimiter && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(text.slice(start).trim());
  return parts;
};

const translateExpression = (source) => {
  let value = source.trim()
    .replace(/sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "read_full_line()")
    .replace(/sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "next_token()")
    .replace(/readInts\(sc,\s*([^)]*)\)/g, "read_ints($1)")
    .replace(/readMatrix\(sc,\s*([^,)]*),\s*([^)]*)\)/g, "read_matrix($1, $2)")
    .replace(/sc\.next\(\)\.toCharArray\(\)/g, "list(next_token())")
    .replace(/sc\.next\(\)\.charAt\(([^)]*)\)/g, "next_token()[$1]")
    .replace(/sc\.nextInt\(\)|sc\.nextLong\(\)/g, "next_int()")
    .replace(/sc\.nextLine\(\)/g, "read_full_line()")
    .replace(/sc\.next\(\)/g, "next_token()")
    .replace(/\.toCharArray\(\)/g, "")
    .replace(/\.length\b/g, ".__len__()")
    .replace(/\.charAt\(([^)]*)\)/g, "[$1]")
    .replace(/\bSolution\.(\w+)\(/g, "Solution.$1(")
    .replace(/\b(?:Solution\.)?ListNode\b/g, "ListNode")
    .replace(/\blist\((?!next_token\s*\()/g, "make_list(")
    .replace(/\btree\(/g, "make_tree(")
    .replace(/\bnull\b/g, "None")
    .replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False")
    .replace(/&&/g, "and").replace(/\|\|/g, "or");
  const ternary = /^(.*?)\s*\?\s*(.*?)\s*:\s*(.*)$/s.exec(value);
  if (ternary) value = `${ternary[2]} if ${ternary[1]} else ${ternary[3]}`;
  return value;
};

const translateStatement = (statement) => {
  let value = statement.trim();
  if (!value || /^Scanner\s+\w+\s*=/.test(value)) return "";
  const conditional = /^(if|else\s+if)\s*\((.*?)\)\s*(.*)$/s.exec(value);
  if (conditional) {
    const header = `${conditional[1] === "if" ? "if" : "elif"} ${translateExpression(conditional[2])}:`;
    return conditional[3] ? `${header} ${translateStatement(conditional[3])}` : header;
  }
  if (value === "else") return "else:";
  if (/^for\s*\(/.test(value)) {
    const indexed = /^for\s*\(\s*(?:int\s+)?(\w+)\s*=\s*([^;]+);\s*\1\s*<\s*(.*?);\s*\1\+\+\s*\)\s*(.*)$/s.exec(value);
    if (indexed) {
      const bound = indexed[3].replace(/\.length\b/g, ".__len__()");
      const header = `for ${indexed[1]} in range(${indexed[2]}, ${bound}):`;
      return indexed[4] ? `${header} ${translateStatement(indexed[4])}` : header;
    }
    const each = /^for\s*\(\s*(?:\w+\s+)?(\w+)\s*:\s*(\w+)\s*\)\s*(.*)$/s.exec(value);
    if (each) return each[3] ? `for ${each[1]} in ${each[2]}: ${translateStatement(each[3])}` : `for ${each[1]} in ${each[2]}:`;
  }
  const output = /^System\.out\.(println|print)\((.*)\)$/.exec(value);
  if (output) return `print_java(${translateExpression(output[2])}${output[1] === "print" ? ", end=''" : ""})`;

  const arrays = [
    [/^(?:int|long)\[\]\[\]\s+(\w+)\s*=\s*new\s+\w+\[(\w+)\]\[2\]$/, "$1 = [[0, 0] for _ in range($2)]"],
    [/^char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[(\w+)\]\[(\w+)\]$/, "$1 = [['0'] * $3 for _ in range($2)]"],
    [/^(?:int|long)\[\]\[\]\s+(\w+)\s*=\s*new\s+\w+\[(\w+)\]\[(\w+)\]$/, "$1 = [[0] * $3 for _ in range($2)]"],
    [/^String\[\]\s+(\w+)\s*=\s*new\s+String\[(\w+)\]$/, "$1 = [''] * $2"],
    [/^(?:int|long)\[\]\s+(\w+)\s*=\s*new\s+\w+\[(\w+)\]$/, "$1 = [0] * $2"],
    [/^(?:int|long)\[\]\s+(\w+)\s*=\s*readInts\(sc,\s*([^)]*)\)$/, "$1 = read_ints($2)"],
    [/^int\[\]\[\]\s+(\w+)\s*=\s*readMatrix\(sc,\s*(\w+),\s*(\w+)\)$/, "$1 = read_matrix($2, $3)"],
  ];
  for (const [pattern, replacement] of arrays) if (pattern.test(value)) return value.replace(pattern, replacement);
  const declaration = /^(?:(?:int|long|boolean|String|char)(?:\[\])+|int|long|boolean|String|char)\s+(.+)$/.exec(value);
  if (declaration) return splitTopLevel(declaration[1]).map((part) => {
    const pair = /^(\w+)\s*=\s*(.*)$/.exec(part);
    return pair ? `${pair[1]} = ${translateExpression(pair[2])}` : part;
  }).join("\n");
  const nodeDeclaration = /^(?:Solution\.)?(?:ListNode|TreeNode)\s+(.+)$/.exec(value);
  if (nodeDeclaration) return splitTopLevel(nodeDeclaration[1]).map((part) => {
    const pair = /^(\w+)\s*=\s*(.*)$/.exec(part);
    return pair ? `${pair[1]} = ${translateExpression(pair[2])}` : part;
  }).join("\n");
  value = value.replace(/^(?:ListNode|TreeNode|Solution\.ListNode|Solution\.TreeNode)\s+(\w+)\s*=/, "$1 = ")
    .replace(/\bprintInts\b/g, "print_ints").replace(/\bprintLongs\b/g, "print_longs")
    .replace(/\bprintChars\b/g, "print_chars").replace(/\bprintLines\b/g, "print_lines")
    .replace(/\bprintNestedInts\b/g, "print_nested_ints").replace(/\bprintGroups\b/g, "print_groups")
    .replace(/\bprintTreeLevels\b/g, "print_tree_levels").replace(/\bprintList\b/g, "print_list");
  return translateExpression(value);
};

const splitJavaDriver = (source) => {
  const events = []; let chunk = ""; let quote = ""; let escaped = false; let parens = 0; let brackets = 0;
  const flush = () => { if (chunk.trim()) events.push({ type: "statement", value: chunk.trim() }); chunk = ""; };
  for (const char of source) {
    if (quote) { chunk += char; if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === quote) quote = ""; continue; }
    if (char === "\"" || char === "'") { quote = char; chunk += char; continue; }
    if (char === "(") parens++; else if (char === ")") parens--;
    else if (char === "[") brackets++; else if (char === "]") brackets--;
    if (parens === 0 && brackets === 0 && (char === ";" || char === "{" || char === "}")) {
      flush(); if (char !== ";") events.push({ type: char === "{" ? "open" : "close" });
    } else chunk += char;
  }
  flush(); return events;
};

const translateDriver = (source) => {
  const lines = []; let indent = 0;
  for (const event of splitJavaDriver(source)) {
    if (event.type === "close") { indent = Math.max(0, indent - 1); continue; }
    if (event.type === "open") { indent++; continue; }
    const line = translateStatement(event.value);
    if (line) lines.push(...line.split("\n").map((part) => `${"    ".repeat(indent)}${part}`));
  }
  return lines.join("\n");
};

const pythonHelpers = (nodeType) => [
  "import sys",
  "_raw_input = sys.stdin.read()",
  "_input_pos = 0",
  "def next_token():\n    global _input_pos\n    size = len(_raw_input)\n    while _input_pos < size and _raw_input[_input_pos].isspace(): _input_pos += 1\n    start = _input_pos\n    while _input_pos < size and not _raw_input[_input_pos].isspace(): _input_pos += 1\n    return _raw_input[start:_input_pos]",
  "def next_int():\n    token = next_token()\n    return int(token) if token else 0",
  "def read_full_line():\n    global _input_pos\n    end = _raw_input.find('\\n', _input_pos)\n    if end < 0: end = len(_raw_input)\n    line = _raw_input[_input_pos:end].rstrip('\\r')\n    _input_pos = min(len(_raw_input), end + 1)\n    return line",
  "def skip_line():\n    global _input_pos\n    end = _raw_input.find('\\n', _input_pos)\n    _input_pos = len(_raw_input) if end < 0 else end + 1",
  "def read_ints(size): return [next_int() for _ in range(size)]",
  "def read_matrix(rows, cols): return [read_ints(cols) for _ in range(rows)]",
  "def print_java(value='', end='\\n'):\n    if isinstance(value, bool): value = str(value).lower()\n    print(value, end=end)",
  "def print_ints(values): print(' '.join(map(str, values)))",
  "def print_longs(values):\n    for value in values: print(value)",
  "def print_chars(values):\n    for row in values: print(''.join(row))",
  "def print_lines(values):\n    for value in values: print_java(value)",
  "def print_nested_ints(values):\n    for row in values: print_ints(row)",
  "def print_groups(values):\n    for row in values: print(' '.join(map(str, row)))",
  ...(nodeType === "ListNode" ? [
    "class ListNode:\n    def __init__(self, val): self.val, self.next = val, None",
    "def make_list(values):\n    dummy = ListNode(0); tail = dummy\n    for value in values: tail.next = ListNode(value); tail = tail.next\n    return dummy.next",
    "def print_list(node):\n    values = []\n    while node: values.append(str(node.val)); node = node.next\n    print(' '.join(values))",
  ] : []),
  ...(nodeType === "TreeNode" ? [
    "class TreeNode:\n    def __init__(self, val): self.val, self.left, self.right = val, None, None",
    "def make_tree(values):\n    if not values or values[0] == -1: return None\n    nodes = [None if value == -1 else TreeNode(value) for value in values]\n    for i, node in enumerate(nodes):\n        if node:\n            left = 2 * i + 1; right = left + 1\n            if left < len(nodes): node.left = nodes[left]\n            if right < len(nodes): node.right = nodes[right]\n    return nodes[0]",
    "def print_tree_levels(levels): print_nested_ints(levels)",
  ] : []),
].join("\n\n");

const pythonStub = (stub, result, functionName) => {
  if (result === "void" || !/\breturn\b/.test(stub)) return "pass";
  if (/return\s+new\s+int\[\]\s*\{\s*-1\s*,\s*-1\s*\}/.test(stub)) return "return [-1, -1]";
  if (/return\s+new\s+(?:int|long)\[/.test(stub) || /return\s+new\s+ArrayList/.test(stub)) return "return []";
  if (/return\s+null/.test(stub)) return "return None";
  if (/return\s+false/i.test(stub)) return "return False";
  if (/return\s+true/i.test(stub)) return "return True";
  if (/return\s+""/.test(stub)) return 'return ""';
  const returnName = /return\s+(\w+)\s*;/.exec(stub)?.[1];
  if (returnName && ["nums", "digits", "s", "head", "list1", "image", "levelOrder"].includes(returnName)) return `return ${returnName}`;
  if (functionName === "factorial") return "return 1";
  return "return 0";
};

export function buildPythonTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const { result, name, args } = signatureParts(typed.signature);
  const params = args.map(({ name: arg, type }) => `${arg}: ${pythonType(type)}`).join(", ");
  const stub = pythonStub(typed.stub, result, name);
  const driver = translateDriver(typed.driver);
  return `${pythonHelpers(typed.nodeType)}\n\nclass Solution:\n    @staticmethod\n    def ${name}(${params}):\n        # BEGIN SOLUTION\n        # TODO: Write your solution here.\n        ${stub}\n        # END SOLUTION\n\n    # BEGIN HELPERS\n    # Add helper methods here if needed.\n    # END HELPERS\n\n# BEGIN DRIVER\n${driver}\n# END DRIVER`;
}
