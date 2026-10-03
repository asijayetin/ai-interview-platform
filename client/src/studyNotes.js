const LANGUAGES = {
  java: {
    name: "Java",
    subtitle: "Object-oriented DSA quick notes",
    sections: [
      ["Core syntax", ["Use int for ordinary counters, long for large sums, and boolean for true/false.", "Arrays have a fixed length: int[] values = new int[n]. Strings are immutable; use StringBuilder for repeated edits.", "A method declares its return type, name, and typed parameters. Return a value on every path for non-void methods."]],
      ["Arrays and strings", ["Two pointers are useful for sorted arrays, pair searches, reversing, and palindrome checks.", "A sliding window keeps a valid range while moving left and right boundaries in one pass.", "Use int[26] for lowercase letter frequencies. Use HashMap when the key range is not fixed."]],
      ["Collections", ["HashMap<K,V> stores key/value pairs; HashSet<T> tracks unique values.", "ArrayDeque<T> works as a stack with push, pop, and peek, and as a queue with offer and poll.", "PriorityQueue<T> is a min-heap by default. Reverse the comparator for a max-heap."]],
      ["Linked lists and trees", ["Keep a ListNode reference and update links carefully; save node.next before rewiring.", "TreeNode commonly stores val, left, and right. Recursive DFS is natural for trees.", "Use ArrayDeque for iterative BFS and process one queue-size batch per tree level."]],
      ["Algorithms", ["Binary search requires a sorted search space. Use mid = left + (right-left)/2.", "A monotonic stack stores candidates in increasing or decreasing order for next-greater and span problems.", "Dynamic programming defines a state, a recurrence, base cases, and an iteration order."]],
      ["Complexity and testing", ["One loop over n values is usually O(n); nested loops are often O(n^2); halving a range is O(log n).", "State both time and extra-space complexity. Check empty input, one element, duplicates, negatives, and boundary indices.", "For integer sums, use long when the constraints can exceed the int range. Avoid modifying input unless the task allows it."]],
    ],
  },
  cpp: {
    name: "C++",
    subtitle: "STL and DSA quick notes",
    sections: [
      ["Core syntax", ["Use int for ordinary values and long long for large sums. Prefer const vector<int>& when a function only reads an array.", "Use vector<int> for dynamic arrays and string for text. A function signature states its return type and typed parameters.", "Include standard headers such as <bits/stdc++.h> where supported, then use namespace std or qualify names."]],
      ["Arrays and strings", ["Two pointers are effective on sorted arrays, pair searches, reversals, and palindrome checks.", "A sliding window moves left and right boundaries while preserving a condition.", "Use array<int,26> or vector<int>(26) for lowercase letter counts."]],
      ["STL containers", ["unordered_map and unordered_set provide average O(1) lookup; map and set keep keys ordered.", "Use stack<T> for LIFO and queue<T> for FIFO. Use deque<T> when both ends are needed.", "priority_queue<T> is a max-heap by default; use greater<T> for a min-heap."]],
      ["Linked lists and trees", ["A ListNode often contains int val and ListNode* next. Save next before changing a link.", "A TreeNode often contains val, left, and right pointers. Recursive DFS is concise for tree paths.", "Use queue<pair<Node*,int>> for breadth-first traversal with a depth value."]],
      ["Algorithms", ["Binary search needs sorted data; compute mid as left + (right-left)/2.", "A monotonic stack helps with next-greater values, stock span, and histogram patterns.", "Dynamic programming uses a state plus recurrence and base cases; optimize memory when only prior states are needed."]],
      ["Complexity and testing", ["A single pass is O(n), nested full scans are often O(n^2), and repeated halving is O(log n).", "Test empty and single-element cases, duplicates, negatives, and boundaries. Mention time and auxiliary space.", "Use long long when a sum may exceed 32-bit range. Check whether the function should mutate its vector."]],
    ],
  },
  python: {
    name: "Python",
    subtitle: "Built-in data structures and DSA quick notes",
    sections: [
      ["Core syntax", ["Use descriptive names and consistent four-space indentation. Python integers grow as needed.", "Lists are dynamic arrays; strings are immutable. A function declares parameters with def and returns with return.", "Use enumerate for index/value loops and zip to walk sequences together."]],
      ["Arrays and strings", ["Two pointers work well for sorted lists, reversing, pair searches, and palindromes.", "A sliding window adjusts its boundaries while maintaining a condition.", "Use collections.Counter for frequencies and a dictionary for value-to-index lookup."]],
      ["Data structures", ["A set gives average O(1) membership checks; a dict maps keys to values.", "A list can be a stack with append/pop. Use collections.deque for an efficient queue.", "Use heapq as a min-heap; negate values when a max-heap behavior is needed."]],
      ["Linked lists and trees", ["A node can store val and next. Save the next node before reversing links.", "A tree node commonly stores val, left, and right. Recursion is useful for DFS.", "Use deque for BFS and process each level using the queue length at its start."]],
      ["Algorithms", ["Binary search needs sorted input. Use lo + (hi-lo)//2 and update an inclusive or half-open range consistently.", "A monotonic stack supports next-greater and span problems in linear time.", "For dynamic programming, define what dp[i] means before writing its recurrence and base cases."]],
      ["Complexity and testing", ["A pass over n values is O(n); nested loops may be O(n^2); halving repeatedly is O(log n).", "Test empty input, one item, duplicates, negative values, and boundaries. State auxiliary space.", "Avoid copying large lists accidentally with slicing in hot loops; know whether a solution mutates input."]],
    ],
  },
  javascript: {
    name: "JavaScript",
    subtitle: "Arrays, Maps, Sets, and DSA quick notes",
    sections: [
      ["Core syntax", ["Use const by default and let when reassignment is needed. Number represents ordinary integer values.", "Arrays are dynamic and strings are immutable. A function can use function name(params) or an arrow function.", "Use strict comparisons (===) and return values explicitly from solution functions."]],
      ["Arrays and strings", ["Two pointers solve sorted pair search, reversal, and palindrome patterns.", "A sliding window moves range boundaries while tracking counts or a running total.", "Use Map for value-to-index lookup and Set for membership tests."]],
      ["Data structures", ["Map and Set offer average constant-time lookup. Object keys coerce to strings; Map keys do not.", "Use an array as a stack with push/pop. Array.shift is linear; use a head index for queues.", "JavaScript has no built-in heap. Implement one or sort when the problem size permits."]],
      ["Linked lists and trees", ["A node can contain val and next. Save next before rewiring a linked-list pointer.", "A tree node commonly contains val, left, and right. Recursive DFS is natural for paths.", "For BFS, use an array plus a head index instead of repeatedly shifting the first item."]],
      ["Algorithms", ["Binary search requires sorted input; use Math.floor((lo+hi)/2) and consistent bounds.", "A monotonic stack gives linear-time next-greater and span solutions.", "Dynamic programming starts with a clear state definition, recurrence, base cases, and order."]],
      ["Complexity and testing", ["One pass is O(n), nested full scans are often O(n^2), and repeated halving is O(log n).", "Test empty arrays, one value, duplicates, negatives, and boundary positions. State time and extra space.", "Be careful with numeric precision for very large sums; use BigInt only when the problem contract supports it."]],
    ],
  },
  csharp: {
    name: "C#",
    subtitle: "Collections and DSA quick notes",
    sections: [
      ["Core syntax", ["Use int for ordinary values and long for large sums. A method declares its return type and typed parameters.", "Use int[] for fixed arrays and List<int> for resizable lists. Strings are immutable.", "Use var when the type is clear from the right side; keep public signatures explicit for interview functions."]],
      ["Arrays and strings", ["Two pointers suit sorted arrays, pair searches, reversals, and palindrome checks.", "A sliding window maintains a valid range as its boundaries move.", "Use int[26] for lowercase frequencies or Dictionary<char,int> for a flexible count map."]],
      ["Collections", ["Dictionary<TKey,TValue> and HashSet<T> offer average O(1) lookup.", "Stack<T> is LIFO and Queue<T> is FIFO. TryPop and TryDequeue help avoid empty-collection exceptions.", "PriorityQueue<TElement,TPriority> is available in modern .NET; check the runner's target version."]],
      ["Linked lists and trees", ["A ListNode can contain int val and ListNode next. Save next before reversing links.", "A TreeNode commonly contains val, left, and right. Recursive DFS works well for tree paths.", "Use Queue<(TreeNode node,int depth)> for breadth-first traversal with depth tracking."]],
      ["Algorithms", ["Binary search requires sorted input; use left + (right-left)/2.", "A monotonic stack supports next-greater and stock-span patterns in O(n) time.", "Dynamic programming requires a defined state, recurrence, base cases, and iteration order."]],
      ["Complexity and testing", ["A scan is O(n), nested scans are often O(n^2), and halving repeatedly is O(log n).", "Test empty and singleton inputs, duplicates, negatives, and boundary indices. Report time and extra space.", "Use long when sums may overflow int. Check null and empty input behavior from the question contract."]],
    ],
  },
};

export const STUDY_LANGUAGES = [
  { id: "cpp", label: "C++", icon: "{ }" },
  { id: "java", label: "Java", icon: "J" },
  { id: "python", label: "Python", icon: "Py" },
  { id: "javascript", label: "JavaScript", icon: "JS" },
  { id: "csharp", label: "C#", icon: "C#" },
];

export const getLanguageNotes = (language) => LANGUAGES[language] || LANGUAGES.java;

const escapePdfText = (text) => text
  .replace(/[^\x20-\x7E]/g, "-")
  .replace(/\\/g, "\\\\")
  .replace(/\(/g, "\\(")
  .replace(/\)/g, "\\)");

const wrapText = (text, max = 86) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    if (line && `${line} ${word}`.length > max) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
};

export function downloadLanguageNotes(language) {
  const notes = getLanguageNotes(language);
  const pages = [[
    { text: "AI INTERVIEW ARENA", size: 12, color: "0.38 0.32 0.78" },
    { text: `${notes.name} DSA Notes`, size: 25, bold: true, gap: 24 },
    { text: notes.subtitle, size: 12, gap: 22 },
    { text: "A concise interview-preparation reference", size: 11 },
    { text: "Topics: core syntax, arrays, data structures, trees, algorithms, and complexity.", size: 10, gap: 32 },
  ]];
  let page = [{ text: `${notes.name} - Interview Notes`, size: 10, color: "0.38 0.32 0.78", gap: 12 }];
  notes.sections.forEach(([heading, bullets]) => {
    page.push({ text: heading, size: 15, bold: true, gap: 7 });
    bullets.forEach((bullet) => wrapText(`- ${bullet}`).forEach((line) => page.push({ text: line, size: 10, gap: 3 })));
    page.push({ text: "", size: 4, gap: 9 });
  });
  for (let i = 0; i < page.length; i += 29) pages.push(page.slice(i, i + 29));

  const objects = [];
  const addObject = (value) => { objects.push(value); return objects.length; };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];
  pages.forEach((pageLines, pageIndex) => {
    let y = 752;
    const commands = ["BT"];
    pageLines.forEach((item) => {
      y -= item.gap || 0;
      if (y < 48) return;
      const color = item.color || "0.13 0.18 0.28";
      commands.push(`${color} rg /F1 ${item.size || 10} Tf 1 0 0 1 54 ${y} Tm (${escapePdfText(item.text)}) Tj`);
      y -= (item.size || 10) + 6;
    });
    commands.push(`0.45 0.49 0.58 rg /F1 9 Tf 1 0 0 1 54 28 Tm (${pageIndex + 1} / ${pages.length}) Tj`, "ET");
    const stream = commands.join("\n");
    const streamId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`));
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${notes.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dsa-notes.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
