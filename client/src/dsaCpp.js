import { TYPED_FUNCTIONS, getJavaFunctionName } from "./dsaJava.js";

const replaceAll = (source, replacements) => replacements.reduce(
  (result, [pattern, replacement]) => result.replace(pattern, replacement),
  source,
);

const cppType = (type) => replaceAll(type.trim(), [
  [/^static\s+/, ""],
  [/\bString\b/g, "string"],
  [/\bboolean\b/g, "bool"],
  [/\bListNode\b/g, "ListNode*"],
  [/\bTreeNode\b/g, "TreeNode*"],
  [/\bint\[\]\[\]/g, "vector<vector<int>>"],
  [/\blong\[\]/g, "vector<long long>"],
  [/\bchar\[\]\[\]/g, "vector<vector<char>>"],
  [/\bString\[\]/g, "vector<string>"],
  [/\bint\[\]/g, "vector<int>"],
  [/List<List<Integer>>/g, "vector<vector<int>>"],
  [/List<Integer>/g, "vector<int>"],
  [/List<String>/g, "vector<string>"],
  [/\blong\b/g, "long long"],
]);

const cppSignature = (signature) => {
  const match = /^(?:static\s+)?(.+?)\s+(\w+)\s*\((.*)\)$/.exec(signature.trim());
  if (!match) throw new Error(`Unsupported Java signature: ${signature}`);
  const parameters = match[3].trim() ? match[3].split(/,\s*/).map((parameter) => {
    const parsed = /^(.+?)\s+(\w+)$/.exec(parameter.trim());
    const type = cppType(parsed[1]);
    return `${type.startsWith("vector<") ? `${type}&` : type} ${parsed[2]}`;
  }).join(", ") : "";
  return `${cppType(match[1])} ${match[2]}(${parameters})`;
};

const cppStub = (stub) => replaceAll(stub, [
  [/new\s+(?:ArrayList|LinkedList)<[^>]+>\(\)/g, "{}"],
  [/new\s+int\[\s*[^\]]*\s*\]/g, "{}"],
  [/new\s+long\[\s*[^\]]*\s*\]/g, "{}"],
  [/\bnull\b/g, "nullptr"],
  [/\bfalse\b/g, "false"],
]);

const replaceJavaOutputCalls = (source) => {
  let output = "";
  for (let i = 0; i < source.length;) {
    const pattern = /System\.out\.(println|print)\s*\(/g;
    pattern.lastIndex = i;
    const match = pattern.exec(source);
    if (!match) { output += source.slice(i); break; }
    output += source.slice(i, match.index);
    let cursor = pattern.lastIndex;
    let depth = 1;
    let quote = "";
    let escaped = false;
    while (cursor < source.length && depth > 0) {
      const character = source[cursor];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === quote) quote = "";
      } else if (character === "\"" || character === "'") quote = character;
      else if (character === "(") depth += 1;
      else if (character === ")") depth -= 1;
      cursor += 1;
    }
    const expression = source.slice(pattern.lastIndex, cursor - 1).trim();
    const helper = /^(printInts|printLongs|printChars|printLines|printNestedInts|printGroups|printTreeLevels|printList)\(/.test(expression);
    if (source[cursor] === ";") cursor += 1;
    if (helper) output += `${expression};`;
    else output += `cout << (${expression})${match[1] === "println" ? ' << "\\n"' : ""};`;
    i = cursor;
  }
  return output;
};

const cppDriver = (driver) => {
  let source = replaceJavaOutputCalls(driver);
  source = replaceAll(source, [
    [/String\[\]\s+(\w+)\s*=\s*new\s+String\[n\]/g, "vector<string> $1(n)"],
    [/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(m|n|q)\]\[2\]/g, "vector<vector<int>> $1($2, vector<int>(2))"],
    [/int\[\]\[\]\s+(\w+)\s*=\s*readMatrix\(sc,\s*n,\s*m\)/g, "vector<vector<int>> $1 = readMatrix(n, m)"],
    [/int\[\]\s+(\w+)\s*=\s*readInts\(sc,\s*([^)]*)\)/g, "vector<int> $1 = readInts($2)"],
    [/int\[\]\s+(\w+)\s*=/g, "vector<int> $1 ="],
    [/int\[\]\s+(\w+)\s*=\s*new\s+int\[n\]/g, "vector<int> $1(n)"],
    [/char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[n\]\[m\]/g, "vector<vector<char>> $1(n, vector<char>(m))"],
    [/Solution\.ListNode/g, "ListNode"],
    [/Solution\.TreeNode/g, "TreeNode"],
    [/int\[\]\s+(\w+)\s*=\s*Solution::/g, "vector<int> $1 = Solution::"],
    [/String\s+(\w+)\s*=/g, "string $1 ="],
    [/\bListNode\s+(\w+)\s*=/g, "ListNode* $1 ="],
    [/\bTreeNode\s+(\w+)\s*=/g, "TreeNode* $1 ="],
    [/readInts\(sc,\s*([^)]*)\)/g, "readInts($1)"],
    [/readMatrix\(sc,\s*([^,)]*),\s*([^)]*)\)/g, "readMatrix($1, $2)"],
    [/sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "readFullLine()"],
    [/sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "readTokenOrEmpty()"],
    [/sc\.next\(\)\.toCharArray\(\)/g, "toChars(nextToken())"],
    [/sc\.next\(\)\.charAt\(0\)/g, "nextToken()[0]"],
    [/sc\.nextInt\(\)/g, "nextInt()"],
    [/sc\.nextLong\(\)/g, "nextLong()"],
    [/sc\.next\(\)/g, "nextToken()"],
    [/sc\.nextLine\(\);/g, "cin.ignore(numeric_limits<streamsize>::max(), '\\n');"],
    [/new\s+int\[n\]/g, "vector<int>(n)"],
    [/new\s+int\[(m|n|q)\]\[2\]/g, "vector<vector<int>>($1, vector<int>(2))"],
    [/new\s+char\[n\]\[m\]/g, "vector<vector<char>>(n, vector<char>(m))"],
    [/\bString\b/g, "string"],
    [/\bboolean\b/g, "bool"],
    [/Solution\.(\w+)\(/g, "Solution::$1("],
    [/answer\.length/g, "answer.size()"],
  ]);
  source = source.replace(/for\s*\(int i = 0; i < (\w+)\.length; i\+\+\)/g, "for (int i = 0; i < (int)$1.size(); i++)");
  source = source.replace(/for\s*\(int i = 0; i < ([^;]+); i\+\+\)/g, "for (int i = 0; i < $1; i++)");
  source = source.replace(/ListNode\*\s+(\w+)\s*=\s*list\(([^;]+?)\),\s*(\w+)\s*=\s*list\(([^;]+?)\);/g, "ListNode* $1 = list($2); ListNode* $3 = list($4);");
  source = source.replace(/cout << \(answer\.size\(\) < 2 \? "" : answer\[0\] \+ " " \+ answer\[1\]\) << "\\n";/g, 'if (answer.size() >= 2) cout << answer[0] << " " << answer[1]; cout << "\\n";');
  source = source.replace(/System\.out\.print\(" "\);/g, 'cout << " ";');
  source = source.replace(/System\.out\.print\(([^;]+)\);/g, "cout << $1;");
  return source;
};

const cppHelpers = (nodeType) => [
  "int nextInt() { int value; cin >> value; return value; }",
  "long long nextLong() { long long value; cin >> value; return value; }",
  "string nextToken() { string value; cin >> value; return value; }",
  "string readTokenOrEmpty() { string value; return (cin >> value) ? value : string(); }",
  "string readFullLine() { string value; if (cin.peek() == '\\n') cin.get(); getline(cin, value); return value; }",
  "vector<int> readInts(int n) { vector<int> values(max(0, n)); for (int &value : values) cin >> value; return values; }",
  "vector<vector<int>> readMatrix(int rows, int cols) { vector<vector<int>> values(rows, vector<int>(cols)); for (auto &row : values) for (int &value : row) cin >> value; return values; }",
  "vector<char> toChars(const string &value) { return vector<char>(value.begin(), value.end()); }",
  "void printInts(const vector<int> &values) { for (int i = 0; i < (int)values.size(); ++i) { if (i) cout << ' '; cout << values[i]; } cout << '\\n'; }",
  "void printLongs(const vector<long long> &values) { for (long long value : values) cout << value << '\\n'; }",
  "void printChars(const vector<vector<char>> &values) { for (const auto &row : values) { for (char value : row) cout << value; cout << '\\n'; } }",
  "template<class T> void printLines(const vector<T> &values) { for (const auto &value : values) cout << value << '\\n'; }",
  "void printNestedInts(const vector<vector<int>> &values) { for (const auto &row : values) printInts(row); }",
  "void printGroups(const vector<vector<string>> &values) { for (const auto &row : values) { for (int i = 0; i < (int)row.size(); ++i) { if (i) cout << ' '; cout << row[i]; } cout << '\\n'; } }",
  ...(nodeType === "ListNode" ? [
    "ListNode* list(const vector<int> &values) { ListNode dummy(0); auto *tail = &dummy; for (int value : values) { tail->next = new ListNode(value); tail = tail->next; } return dummy.next; }",
    "void printList(ListNode *node) { bool first = true; while (node) { if (!first) cout << ' '; cout << node->val; first = false; node = node->next; } cout << '\\n'; }",
  ] : []),
  ...(nodeType === "TreeNode" ? [
    "TreeNode* tree(const vector<int> &values) { if (values.empty() || values[0] == -1) return nullptr; vector<TreeNode*> nodes(values.size(), nullptr); for (int i=0;i<(int)values.size();++i) if(values[i]!=-1) nodes[i]=new TreeNode(values[i]); for(int i=0;i<(int)nodes.size();++i) if(nodes[i]) { int l=2*i+1,r=l+1; if(l<(int)nodes.size()) nodes[i]->left=nodes[l]; if(r<(int)nodes.size()) nodes[i]->right=nodes[r]; } return nodes[0]; }",
    "void printTreeLevels(const vector<vector<int>> &levels) { printNestedInts(levels); }",
  ] : []),
].join("\n");

export function buildCppTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const name = getJavaFunctionName(question);
  const signature = cppSignature(typed.signature);
  const nodeTypes = [
    typed.nodeType === "ListNode" ? "struct ListNode { int val; ListNode *next = nullptr; explicit ListNode(int value) : val(value) {} };" : "",
    typed.nodeType === "TreeNode" ? "struct TreeNode { int val; TreeNode *left = nullptr, *right = nullptr; explicit TreeNode(int value) : val(value) {} };" : "",
  ].filter(Boolean).join("\n");
  const helpers = cppHelpers(typed.nodeType);
  const driver = cppDriver(typed.driver);
  const body = `// TODO: Write your ${name} solution here.\n        ${cppStub(typed.stub)}`;
  const prefix = `#include <bits/stdc++.h>\nusing namespace std;\n${nodeTypes}\nclass Solution {\npublic:\n    static ${signature} {\n        // BEGIN SOLUTION\n        ${body.replace(/\n/g, "\n        ")}\n        // END SOLUTION\n    }\n\n    // BEGIN HELPERS\n    // Add helper methods here if you need them.\n    // END HELPERS\n};\n\n// BEGIN DRIVER\n${helpers}\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    cout << boolalpha;\n    ${driver.replace(/\n/g, "\n    ")}\n}\n// END DRIVER`;
  return prefix;
}
