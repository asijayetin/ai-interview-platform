import { TYPED_FUNCTIONS, getJavaFunctionName } from "./dsaJava.js";

const signatureParts = (signature) => {
  const match = /^(?:static\s+)?(.+?)\s+(\w+)\s*\((.*)\)$/.exec(signature.trim());
  if (!match) throw new Error(`Unsupported Java signature: ${signature}`);
  const args = match[3].trim() ? match[3].split(/,\s*/).map((arg) => {
    const parsed = /^(.+?)\s+(\w+)$/.exec(arg.trim());
    return { type: parsed[1].trim(), name: parsed[2] };
  }) : [];
  return { result: match[1].trim(), name: match[2], args };
};

const mapType = (type, language) => {
  const maps = {
    javascript: [[/int\[\]\[\]/g, "number[][]"], [/char\[\]\[\]/g, "string[][]"], [/long\[\]/g, "number[]"], [/int\[\]/g, "number[]"], [/String\[\]/g, "string[]"], [/\bString\b/g, "string"], [/\bboolean\b/g, "boolean"], [/\blong\b/g, "number"], [/\bint\b/g, "number"], [/\bchar\b/g, "string"], [/List<List<Integer>>/g, "number[][]"], [/List<Integer>/g, "number[]"], [/List<String>/g, "string[]"], [/\bListNode\b/g, "ListNode"], [/\bTreeNode\b/g, "TreeNode"]],
    csharp: [[/int\[\]\[\]/g, "int[][]"], [/long\[\]/g, "long[]"], [/char\[\]\[\]/g, "char[][]"], [/String\[\]/g, "string[]"], [/int\[\]/g, "int[]"], [/\bString\b/g, "string"], [/\bboolean\b/g, "bool"], [/List<List<Integer>>/g, "List<List<int>>"], [/List<Integer>/g, "List<int>"], [/List<String>/g, "List<string>"], [/\bListNode\b/g, "ListNode"], [/\bTreeNode\b/g, "TreeNode"]],
    python: [[/int\[\]\[\]/g, "list[list[int]]"], [/char\[\]\[\]/g, "list[list[str]]"], [/long\[\]/g, "list[int]"], [/String\[\]/g, "list[str]"], [/int\[\]/g, "list[int]"], [/\bString\b/g, "str"], [/\bboolean\b/g, "bool"], [/\blong\b/g, "int"], [/\bint\b/g, "int"], [/\bchar\b/g, "str"], [/List<List<Integer>>/g, "list[list[int]]"], [/List<Integer>/g, "list[int]"], [/List<String>/g, "list[str]"], [/\bListNode\b/g, "ListNode"], [/\bTreeNode\b/g, "TreeNode"]],
  };
  return (maps[language] || []).reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), type);
};

const jsDriver = (driver) => {
  let source = driver;
  source = source.replace(/System\.out\.(println|print)\(([^;]*)\);/g, (_all, method, expression) => {
    if (/^(?:printInts|printLongs|printChars|printLines|printNestedInts|printGroups|printTreeLevels|printList)\(/.test(expression.trim())) return `${expression};`;
    return method === "println" ? `console.log(${expression});` : `process.stdout.write(String(${expression}));`;
  });
  source = source.replace(/int\[\]\s+(\w+)\s*=\s*Solution\./g, "const $1 = Solution.");
  source = source.replace(/(?:int|long|boolean|String)\[\]\s+(\w+)\s*=\s*readInts\(sc,\s*([^)]*)\)/g, "const $1 = readInts($2)");
  source = source.replace(/int\[\]\[\]\s+(\w+)\s*=\s*readMatrix\(sc,\s*n,\s*m\)/g, "const $1 = readMatrix(n, m)");
  source = source.replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(m|n|q)\]\[2\]/g, "const $1 = Array.from({length:$2},()=>Array(2).fill(0))");
  source = source.replace(/char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[n\]\[m\]/g, "const $1 = Array.from({length:n},()=>Array(m).fill('0'))");
  source = source.replace(/String\[\]\s+(\w+)\s*=\s*new\s+String\[n\]/g, "const $1 = Array(n).fill('')");
  source = source.replace(/int\[\]\s+(\w+)\s*=\s*new\s+int\[n\]/g, "const $1 = Array(n).fill(0)");
  source = source.replace(/int\[\]\s+(\w+)\s*=\s*readInts\(sc,\s*([^)]*)\)/g, "const $1 = readInts($2)");
  source = source.replace(/int\[\]\s+(\w+)\s*=\s*Solution\.(\w+)\(/g, "const $1 = Solution.$2(");
  source = source.replace(/String\s+(\w+)\s*=\s*sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "const $1 = readFullLine()");
  source = source.replace(/String\s+(\w+)\s*=\s*sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "const $1 = readTokenOrEmpty()");
  source = source.replace(/String\s+(\w+)\s*=\s*sc\.next\(\)\.charAt\(0\)/g, "const $1 = nextToken()[0]");
  source = source.replace(/String\s+(\w+)\s*=\s*sc\.next\(\)\.toCharArray\(\)/g, "const $1 = nextToken().split('')");
  source = source.replace(/sc\.nextInt\(\)/g, "nextInt()").replace(/sc\.nextLong\(\)/g, "nextInt()").replace(/sc\.next\(\)/g, "nextToken()");
  source = source.replace(/sc\.nextLine\(\);/g, "skipLine();");
  source = source.replace(/\bString\b/g, "let").replace(/\bboolean\b/g, "let").replace(/\b(?:int|long)\b/g, "let");
  source = source.replace(/for\s*\(let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length;\s*\1\+\+\)/g, "for (let $1 = 0; $1 < $2.length; $1++)");
  source = source.replace(/for\s*\(let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+);\s*\1\+\+\)/g, "for (let $1 = 0; $1 < $2; $1++)");
  source = source.replace(/Solution\.(\w+)\(/g, "Solution.$1(");
  source = source.replace(/\.toCharArray\(\)/g, ".split('')").replace(/\.charAt\(([^)]*)\)/g, "[$1]");
  source = source.replace(/answer\.length/g, "answer.length");
  return source;
};

const jsHelpers = (nodeType) => [
  "const fs = require('fs');",
  "const rawInput = fs.readFileSync(0, 'utf8');",
  "let inputPosition = 0;",
  "function nextToken() { while (inputPosition < rawInput.length && /\\s/.test(rawInput[inputPosition])) inputPosition++; let start = inputPosition; while (inputPosition < rawInput.length && !/\\s/.test(rawInput[inputPosition])) inputPosition++; return rawInput.slice(start, inputPosition); }",
  "function nextInt() { return Number(nextToken() || 0); }",
  "function readTokenOrEmpty() { return nextToken(); }",
  "function readFullLine() { if (inputPosition < rawInput.length && rawInput[inputPosition] === '\\n') inputPosition++; let end = rawInput.indexOf('\\n', inputPosition); if (end < 0) end = rawInput.length; const line = rawInput.slice(inputPosition, end).replace(/\\r$/, ''); inputPosition = Math.min(rawInput.length, end + 1); return line; }",
  "function skipLine() { const end = rawInput.indexOf('\\n', inputPosition); inputPosition = end < 0 ? rawInput.length : end + 1; }",
  "function readInts(n) { return Array.from({length:n}, () => nextInt()); }",
  "function readMatrix(n, m) { return Array.from({length:n}, () => readInts(m)); }",
  "function printInts(a) { console.log(a.join(' ')); }",
  "function printLongs(a) { for (const x of a) console.log(x); }",
  "function printChars(a) { for (const row of a) console.log(row.join('')); }",
  "function printLines(a) { for (const x of a) console.log(x); }",
  "function printNestedInts(a) { for (const row of a) printInts(row); }",
  "function printGroups(a) { for (const row of a) console.log(row.join(' ')); }",
  ...(nodeType === "ListNode" ? ["class ListNode { constructor(val) { this.val=val; this.next=null; } }", "function list(a) { const dummy=new ListNode(0); let tail=dummy; for(const value of a){tail.next=new ListNode(value);tail=tail.next;} return dummy.next; }", "function printList(node) { const out=[]; while(node){out.push(node.val);node=node.next;} console.log(out.join(' ')); }"] : []),
  ...(nodeType === "TreeNode" ? ["class TreeNode { constructor(val) { this.val=val; this.left=null; this.right=null; } }", "function tree(a) { if(!a.length||a[0]===-1)return null; const nodes=a.map(v=>v===-1?null:new TreeNode(v)); for(let i=0;i<nodes.length;i++)if(nodes[i]){nodes[i].left=nodes[2*i+1]||null;nodes[i].right=nodes[2*i+2]||null;}return nodes[0]; }", "function printTreeLevels(levels) { printNestedInts(levels); }"] : []),
].join("\n");

export function buildJavascriptTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const { name, args } = signatureParts(typed.signature);
  const params = args.map(({ name: arg }) => arg).join(", ");
  const stub = typed.stub.replace(/new\s+(?:ArrayList|LinkedList)<[^>]+>\(\)/g, "[]").replace(/new\s+(?:int|long)\[[^\]]*\]/g, "[]").replace(/\bnull\b/g, "null");
  return `${jsHelpers(typed.nodeType)}\n\nclass Solution {\n  static ${name}(${params}) {\n    // BEGIN SOLUTION\n    // TODO: Write your solution here.\n    ${stub}\n    // END SOLUTION\n  }\n\n  // BEGIN HELPERS\n  // Add helper methods here if needed.\n  // END HELPERS\n}\n\n// BEGIN DRIVER\n${jsDriver(typed.driver)}\n// END DRIVER`;
}

const pythonDecls = (source) => {
  let value = source
    .replace(/String\[\]\s+(\w+)\s*=\s*new\s+String\[n\]/g, "$1 = [''] * n")
    .replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(m|n|q)\]\[2\]/g, "$1 = [[0, 0] for _ in range($2)]")
    .replace(/int\[\]\[\]\s+(\w+)\s*=\s*readMatrix\(sc,\s*n,\s*m\)/g, "$1 = read_matrix(n, m)")
    .replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[n\]\[m\]/g, "$1 = [[0] * m for _ in range(n)]")
    .replace(/int\[\]\s+(\w+)\s*=\s*new\s+int\[n\]/g, "$1 = [0] * n")
    .replace(/int\[\]\s+(\w+)\s*=\s*readInts\(sc,\s*([^)]*)\)/g, "$1 = read_ints($2)")
    .replace(/char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[n\]\[m\]/g, "$1 = [list('0' * m) for _ in range(n)]")
    .replace(/String\s+(\w+)\s*=\s*sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "$1 = read_full_line()")
    .replace(/String\s+(\w+)\s*=\s*sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "$1 = next_token()")
    .replace(/String\s+(\w+)\s*=\s*sc\.next\(\)\.charAt\(0\)/g, "$1 = next_token()[0]")
    .replace(/String\s+(\w+)\s*=\s*sc\.next\(\)\.toCharArray\(\)/g, "$1 = list(next_token())")
    .replace(/sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "read_full_line()")
    .replace(/sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "next_token()")
    .replace(/sc\.next\(\)\.toCharArray\(\)/g, "list(next_token())")
    .replace(/sc\.next\(\)\.charAt\(0\)/g, "next_token()[0]")
    .replace(/readInts\(sc,\s*([^)]*)\)/g, "read_ints($1)")
    .replace(/readMatrix\(sc,\s*([^,)]*),\s*([^)]*)\)/g, "read_matrix($1, $2)")
    .replace(/sc\.nextInt\(\)/g, "next_int()")
    .replace(/sc\.nextLong\(\)/g, "next_int()")
    .replace(/sc\.next\(\)/g, "next_token()")
    .replace(/sc\.nextLine\(\);/g, "skip_line()")
    .replace(/System\.out\.println\(([^;]*)\);/g, "print($1)")
    .replace(/System\.out\.print\(([^;]*)\);/g, "print($1, end='')")
    .replace(/for\s*\(int\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length;\s*\1\+\+\)\s*\{/g, "for $1 in range(len($2)):")
    .replace(/for\s*\(int\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+);\s*\1\+\+\)\s*\{/g, "for $1 in range($2):")
    .replace(/for\s*\(int\s+(\w+)\s*:\s*(\w+)\)\s*\{/g, "for $1 in $2:")
    .replace(/if\s*\((.*?)\)\s*\{/g, "if $1:")
    .replace(/else\s*\{/g, "else:")
    .replace(/\b(?:String|boolean|int|long)\s+(\w+)\s*=/g, "$1 =")
    .replace(/\bnull\b/g, "None").replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False")
    .replace(/\.length/g, "__LENGTH__").replace(/\.charAt\(([^)]*)\)/g, "[$1]")
    .replace(/\bSolution\.(\w+)\(/g, "Solution.$1(");
  value = value.replace(/(?:int|long)\s+(\w+)\s*=\s*([^,;]+),\s*(\w+)\s*=\s*([^;]+);/g, "$1 = $2; $3 = $4;");
  const statements = [];
  for (const originalLine of value.split("\n")) {
    let chunk = ""; let depth = 0; let quote = ""; let escaped = false;
    const flush = () => { if (chunk.trim()) statements.push(chunk.trim()); chunk = ""; };
    for (const char of originalLine) {
      if (quote) { chunk += char; if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === quote) quote = ""; continue; }
      if (char === "\"" || char === "'") { quote = char; chunk += char; continue; }
      if (char === "(" || char === "[") depth++;
      if (char === ")" || char === "]") depth--;
      if (char === ";" && depth === 0) flush();
      else if (char === "}" && depth === 0) { flush(); statements.push("}"); }
      else chunk += char;
    }
    flush();
  }
  let indent = 0;
  return statements.map((statement) => {
    if (statement === "}") { indent = Math.max(0, indent - 1); return ""; }
    let line = statement.replace(/\b__LENGTH__\b/g, "__len__()");
    line = line.replace(/^\s*let\s+/, "");
    line = line.replace(/^\s*String\s+/, "");
    line = line.replace(/\bprintInts\b/g, "print_ints").replace(/\bprintLongs\b/g, "print_longs").replace(/\bprintChars\b/g, "print_chars").replace(/\bprintLines\b/g, "print_lines").replace(/\bprintNestedInts\b/g, "print_nested_ints").replace(/\bprintGroups\b/g, "print_groups").replace(/\bprintTreeLevels\b/g, "print_tree_levels").replace(/\bprintList\b/g, "print_list").replace(/\blist\(/g, "list_node(");
    const formatted = `${"    ".repeat(indent)}${line}`;
    if (line.endsWith(":")) indent++;
    return formatted;
  }).filter(Boolean).join("\n");
};

const pythonHelpers = (nodeType) => [
  "import sys",
  "_raw_input = sys.stdin.read()",
  "_tokens = _raw_input.split()",
  "_token_index = 0",
  "_line_index = 0",
  "def next_token():\n    global _token_index\n    if _token_index >= len(_tokens): return ''\n    token = _tokens[_token_index]\n    _token_index += 1\n    return token",
  "def next_int():\n    token = next_token()\n    return int(token) if token else 0",
  "def read_full_line():\n    global _line_index\n    lines = _raw_input.splitlines()\n    if _line_index >= len(lines): return ''\n    line = lines[_line_index]\n    _line_index += 1\n    return line",
  "def skip_line():\n    global _line_index\n    lines = _raw_input.splitlines()\n    if _line_index < len(lines): _line_index += 1",
  "def read_ints(n): return [next_int() for _ in range(n)]",
  "def read_matrix(n, m): return [read_ints(m) for _ in range(n)]",
  "def print_ints(values): print(' '.join(map(str, values)))",
  "def print_longs(values):\n    for value in values: print(value)",
  "def print_chars(values):\n    for row in values: print(''.join(row))",
  "def print_lines(values):\n    for value in values: print(value)",
  "def print_nested_ints(values):\n    for row in values: print_ints(row)",
  "def print_groups(values):\n    for row in values: print(' '.join(row))",
  ...(nodeType === "ListNode" ? ["class ListNode:\n    def __init__(self, val): self.val, self.next = val, None", "def list_node(values):\n    dummy=ListNode(0); tail=dummy\n    for value in values: tail.next=ListNode(value); tail=tail.next\n    return dummy.next", "def print_list(node):\n    out=[]\n    while node: out.append(str(node.val)); node=node.next\n    print(' '.join(out))"] : []),
  ...(nodeType === "TreeNode" ? ["class TreeNode:\n    def __init__(self, val): self.val, self.left, self.right = val, None, None", "def tree(values):\n    if not values or values[0] == -1: return None\n    nodes=[None if value == -1 else TreeNode(value) for value in values]\n    for i,node in enumerate(nodes):\n        if node:\n            if 2*i+1 < len(nodes): node.left=nodes[2*i+1]\n            if 2*i+2 < len(nodes): node.right=nodes[2*i+2]\n    return nodes[0]", "def print_tree_levels(values): print_nested_ints(values)"] : []),
].join("\n\n");

export function buildPythonTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const { name, args } = signatureParts(typed.signature);
  const params = args.map(({ name: arg, type }) => `${arg}: ${mapType(type, "python")}`).join(", ");
  const stub = typed.stub.replace(/new\s+(?:ArrayList|LinkedList)<[^>]+>\(\)/g, "[]").replace(/new\s+(?:int|long)\[[^\]]*\]/g, "[]").replace(/\bnull\b/g, "None");
  const driver = pythonDecls(typed.driver).replace(/\bprintInts\b/g, "print_ints").replace(/\bprintLongs\b/g, "print_longs").replace(/\bprintChars\b/g, "print_chars").replace(/\bprintLines\b/g, "print_lines").replace(/\bprintNestedInts\b/g, "print_nested_ints").replace(/\bprintGroups\b/g, "print_groups").replace(/\bprintTreeLevels\b/g, "print_tree_levels").replace(/\bprintList\b/g, "print_list").replace(/\blist\(/g, "list_node(");
  return `${pythonHelpers(typed.nodeType)}\n\nclass Solution:\n    @staticmethod\n    def ${name}(${params}):\n        # BEGIN SOLUTION\n        # TODO: Write your solution here.\n        ${stub}\n        # END SOLUTION\n\n# BEGIN HELPERS\n# Add helper functions here if needed.\n# END HELPERS\n\n# BEGIN DRIVER\n${driver.split("\n").map((line) => line.trim() ? `    ${line}` : "").join("\n")}\n# END DRIVER`;
}

const csharpDriver = (driver) => {
  let source = driver.replace(/System\.out\.println\(/g, "Console.WriteLine(").replace(/System\.out\.print\(/g, "Console.Write(");
  source = source.replace(/String\[\]\s+(\w+)\s*=\s*new\s+String\[n\]/g, "string[] $1 = new string[n]");
  source = source.replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(m|n|q)\]\[2\]/g, "int[][] $1 = Enumerable.Range(0, $2).Select(_ => new int[2]).ToArray()");
  source = source.replace(/int\[\]\[\]\s+(\w+)\s*=\s*readMatrix\(sc,\s*n,\s*m\)/g, "int[][] $1 = ReadMatrix(n, m)");
  source = source.replace(/int\[\]\s+(\w+)\s*=\s*readInts\(sc,\s*([^)]*)\)/g, "int[] $1 = ReadInts($2)");
  source = source.replace(/int\[\]\s+(\w+)\s*=\s*new\s+int\[n\]/g, "int[] $1 = new int[n]");
  source = source.replace(/char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[n\]\[m\]/g, "char[][] $1 = Enumerable.Range(0,n).Select(_ => new char[m]).ToArray()");
  source = source.replace(/readInts\(sc,\s*([^)]*)\)/g, "ReadInts($1)").replace(/readMatrix\(sc,\s*([^,)]*),\s*([^)]*)\)/g, "ReadMatrix($1, $2)");
  source = source.replace(/sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "ReadFullLine()").replace(/sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "NextTokenOrEmpty()");
  source = source.replace(/sc\.next\(\)\.toCharArray\(\)/g, "NextToken().ToCharArray()").replace(/sc\.next\(\)\.charAt\(0\)/g, "NextToken()[0]");
  source = source.replace(/sc\.nextInt\(\)/g, "NextInt()").replace(/sc\.nextLong\(\)/g, "NextLong()").replace(/sc\.next\(\)/g, "NextToken()").replace(/sc\.nextLine\(\);/g, "SkipLine();");
  source = source.replace(/\bSolution\.(\w+)\(/g, "Solution.$1(");
  source = source.replace(/\.length/g, ".Length");
  return source;
};

const csharpHelpers = (nodeType) => [
  "static string[] tokens = Console.In.ReadToEnd().Split((char[])null, StringSplitOptions.RemoveEmptyEntries);",
  "static int tokenIndex = 0;",
  "static int NextInt() => tokenIndex < tokens.Length ? int.Parse(tokens[tokenIndex++]) : 0;",
  "static long NextLong() => tokenIndex < tokens.Length ? long.Parse(tokens[tokenIndex++]) : 0L;",
  "static string NextToken() => tokenIndex < tokens.Length ? tokens[tokenIndex++] : string.Empty;",
  "static string NextTokenOrEmpty() => NextToken();",
  "static string ReadFullLine() => Console.ReadLine() ?? string.Empty;",
  "static void SkipLine() { Console.ReadLine(); }",
  "static int[] ReadInts(int n) { var a = new int[n]; for(int i=0;i<n;i++) a[i]=NextInt(); return a; }",
  "static int[][] ReadMatrix(int n,int m) { var a=new int[n][]; for(int i=0;i<n;i++) a[i]=ReadInts(m); return a; }",
  "static void PrintInts(int[] a) => Console.WriteLine(string.Join(\" \", a));",
  "static void PrintLongs(long[] a) { foreach(var x in a) Console.WriteLine(x); }",
  "static void PrintChars(char[][] a) { foreach(var row in a) Console.WriteLine(new string(row)); }",
  "static void PrintLines<T>(IEnumerable<T> a) { foreach(var x in a) Console.WriteLine(x); }",
  "static void PrintNestedInts(List<List<int>> a) { foreach(var row in a) PrintInts(row.ToArray()); }",
  "static void PrintGroups(List<List<string>> a) { foreach(var row in a) Console.WriteLine(string.Join(\" \", row)); }",
  ...(nodeType === "ListNode" ? ["static ListNode MakeList(int[] a) { var d=new ListNode(0); var t=d; foreach(var x in a){t.next=new ListNode(x);t=t.next;} return d.next; }", "static void PrintList(ListNode n) { var a=new List<int>(); while(n!=null){a.Add(n.val);n=n.next;} PrintInts(a.ToArray()); }"] : []),
  ...(nodeType === "TreeNode" ? ["static TreeNode MakeTree(int[] a) { if(a.Length==0||a[0]==-1)return null; var n=new TreeNode[a.Length]; for(int i=0;i<a.Length;i++)if(a[i]!=-1)n[i]=new TreeNode(a[i]); for(int i=0;i<n.Length;i++)if(n[i]!=null){int l=2*i+1,r=l+1;if(l<n.Length)n[i].left=n[l];if(r<n.Length)n[i].right=n[r];}return n[0]; }", "static void PrintTreeLevels(List<List<int>> a) => PrintNestedInts(a);"] : []),
].join("\n    ");

export function buildCsharpTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const { name, args } = signatureParts(typed.signature);
  const params = args.map(({ name: arg, type }) => `${mapType(type, "csharp")} ${arg}`).join(", ");
  const resultType = mapType(signatureParts(typed.signature).result, "csharp");
  const stub = typed.stub.replace(/new\s+ArrayList<[^>]+>\(\)/g, "new List<int>()").replace(/new\s+(?:int|long)\[([^\]]*)\]/g, "new ${type}[$1]").replace(/\bnull\b/g, "null");
  const driver = csharpDriver(typed.driver).replace(/\bprintInts\b/g, "PrintInts").replace(/\bprintLongs\b/g, "PrintLongs").replace(/\bprintChars\b/g, "PrintChars").replace(/\bprintLines\b/g, "PrintLines").replace(/\bprintNestedInts\b/g, "PrintNestedInts").replace(/\bprintGroups\b/g, "PrintGroups").replace(/\bprintTreeLevels\b/g, "PrintTreeLevels").replace(/\bprintList\b/g, "PrintList").replace(/\blist\(/g, "MakeList(").replace(/tree\(/g, "MakeTree(");
  return `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\n${typed.nodeType === "ListNode" ? "class ListNode { public int val; public ListNode next; public ListNode(int v){val=v;} }\n" : ""}${typed.nodeType === "TreeNode" ? "class TreeNode { public int val; public TreeNode left,right; public TreeNode(int v){val=v;} }\n" : ""}static class Solution {\n    public static ${resultType} ${name}(${params}) {\n        // BEGIN SOLUTION\n        // TODO: Write your solution here.\n        ${stub}\n        // END SOLUTION\n    }\n\n    // BEGIN HELPERS\n    // Add helper methods here if needed.\n    // END HELPERS\n}\n\n// BEGIN DRIVER\nclass Program {\n    ${csharpHelpers(typed.nodeType)}\n    static void Main() {\n        ${driver.split("\n").map((line) => line.trim()).join("\n        ")}\n    }\n}\n// END DRIVER`;
}
