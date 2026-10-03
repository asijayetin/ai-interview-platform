const LANGUAGES = {
  java: {
    name: "Java",
    subtitle: "Object-oriented DSA interview workbook",
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
    subtitle: "STL and DSA interview workbook",
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
    subtitle: "Built-in data structures and DSA interview workbook",
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
    subtitle: "Arrays, Maps, Sets, and DSA interview workbook",
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
    subtitle: "Collections and DSA interview workbook",
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

// A chapter-per-page workbook with reusable DSA explanations and real syntax
// examples for each language. The PDF contains a cover plus 18 study chapters.
const CURRICULUM = [
  ["Interview problem-solving workflow", ["Restate the task in your own words and record the input, output, constraints, and whether mutation is allowed.", "Try a small example by hand. Identify the simplest correct approach before optimizing it.", "Explain the invariant your algorithm maintains; this is often more useful than narrating every line."], "Start with a direct scan and name what each variable represents.", "Take Two Sum and explain a brute-force plan, then improve it with a hash map."],
  ["Complexity and constraints", ["Count work as input size grows. A pass is O(n), a nested full scan is usually O(n^2), and repeated halving is O(log n).", "State auxiliary space separately from output storage. Mention when a set, recursion stack, or copied array uses memory.", "Read constraints before choosing int widths or algorithms; n around 10^5 rules out most quadratic scans."], "Write down the expected time and extra-space cost beside each candidate approach.", "Compare nested-loop Two Sum with a one-pass map solution."],
  ["Arrays and traversal", ["Use one pass when each element can be processed from the information already seen.", "Use two indices when the task asks for a pair, range, reversal, or in-place compaction.", "For in-place edits, distinguish the logical result length from unused values left after it."], "When removing values, maintain a write index and return the valid prefix length.", "Remove a chosen value in place and state which prefix is meaningful."],
  ["Strings and character counts", ["Strings are immutable in most of these languages; build a result with a buffer, list, or builder instead of repeated concatenation.", "For a fixed lowercase alphabet, a 26-slot count array is simple and fast. Use a map when the alphabet is broader.", "Normalize case or ignore punctuation only when the problem statement asks for it."], "Compare frequency counts to test anagrams; sorting is simpler but usually costs O(n log n).", "Check whether two words are anagrams, including empty strings and repeated letters."],
  ["Hash maps and sets", ["A set answers whether a value has appeared; a map stores extra information such as its latest index or frequency.", "For one-pass pair search, check the needed complement before storing the current value.", "Hash lookups are average O(1), not a guarantee for every implementation or input."], "Avoid overwriting information too early when duplicate positions matter.", "Find the first duplicate and return its earliest relevant index."],
  ["Two pointers", ["On sorted data, compare the left and right values and move the pointer that can bring the sum toward its target.", "For palindrome checks, skip characters only if the task defines them as ignorable.", "In-place partitioning often uses a read pointer and a write pointer."], "Each pointer should move monotonically so the overall pass stays O(n).", "Find whether a sorted array contains a pair with a target sum."],
  ["Sliding windows", ["A fixed-size window adds the entering value and removes the leaving value.", "A variable window expands right, then shrinks left until its condition becomes valid again.", "Sliding windows fit contiguous ranges; they do not replace a hash map or prefix-sum approach when negatives break monotonicity."], "Write the window invariant before the loop: what is true after each left-boundary adjustment?", "Find the longest substring with no repeated characters."],
  ["Prefix sums and range queries", ["Define prefix[i] as the sum of the first i values; then a half-open range [l,r) is prefix[r] - prefix[l].", "A leading zero makes empty prefixes and boundary ranges easier to handle.", "For many range queries, preprocess once in O(n), then answer each query in O(1)."], "Use a 64-bit accumulator when the sum can exceed a 32-bit integer.", "Answer inclusive range-sum queries and test a one-element range."],
  ["Stacks and monotonic stacks", ["A stack is LIFO. It is useful for matching brackets, undoing the latest choice, and evaluating nested structure.", "A monotonic stack removes dominated candidates so each item is pushed and popped at most once.", "Decide whether equal values should be popped; strict versus non-strict comparisons change duplicate behavior."], "For next-greater values, pop while the top is no greater than the current value.", "Compute stock spans and explain what each remaining stack index represents."],
  ["Queues and breadth-first search", ["A queue is FIFO; BFS visits nodes in nondecreasing distance from its start in an unweighted graph.", "Mark a node visited when enqueueing it, not only when removing it, to prevent duplicate queue entries.", "For tree levels, capture the queue size at the beginning of a level before processing its nodes."], "Prefer a deque or queue data structure; repeatedly removing index zero from an array may be linear.", "Find the shortest unweighted path and return -1 when the target cannot be reached."],
  ["Linked-list pointers", ["Keep a reference to the next node before changing a link, or the rest of the list becomes unreachable.", "Dummy nodes simplify insertions and merges near the head.", "Fast and slow pointers can find a midpoint or detect a cycle without storing every node."], "Draw the list before and after each pointer update for reverse-list problems.", "Reverse a list, then state the result for an empty and one-node input."],
  ["Binary search", ["Binary search requires a monotonic condition or sorted data; do not apply it because the answer is an integer.", "Choose inclusive [left,right] or half-open [left,right) bounds and keep every update consistent.", "For answer-space search, write a predicate such as feasible(mid) and prove it changes in only one direction."], "Use left + (right-left)/2 to avoid overflow in fixed-width integer types.", "Find the first position whose value is at least a target, including when it is absent."],
  ["Sorting and greedy choices", ["Sorting can reveal neighboring relationships and simplify interval or pairing questions.", "A greedy choice needs a reason: show why taking the local choice cannot block a better global solution.", "When sorting objects, preserve original indices if the required output refers to input positions."], "Check the ordering of equal elements if stable behavior affects the result.", "Choose the maximum number of non-overlapping intervals and justify the end-time rule."],
  ["Recursion and backtracking", ["Every recursive function needs a base case and a smaller subproblem.", "Backtracking explores a choice, recurses, then undoes the choice before trying the next one.", "Track recursion depth; a correct recursive solution may still exceed a runtime stack limit for a long chain."], "Use a path buffer and remove its last choice after returning from recursion.", "Generate subsets and explain why each input position creates two branches."],
  ["Trees: DFS and BFS", ["A tree node can be null; handle that before reading its value or children.", "DFS can return information upward, such as height, sum, or whether a subtree is balanced.", "BFS is natural for level order and shallowest-leaf problems; a missing child is not automatically a leaf."], "Define whether depth starts at zero or one and keep examples consistent.", "Compute the minimum depth when one side of the root is missing."],
  ["Graphs and traversal", ["Represent an unweighted graph with an adjacency list when it is sparse.", "A visited set prevents cycles. For components, start a traversal from every unvisited vertex.", "Topological sorting applies to directed acyclic graphs; a cycle means not every course can be completed."], "For grid problems, use four direction offsets and validate row and column bounds before indexing.", "Count connected components and test an isolated vertex."],
  ["Dynamic programming", ["Name the state in one sentence, for example dp[i] is the best answer using the first i items.", "Write the recurrence and base cases before coding; then choose an iteration order that computes dependencies first.", "If each state only needs a few previous states, rolling variables can reduce memory."], "Keep impossible states explicit and guard additions from an unreachable sentinel.", "Solve climbing stairs, then explain how the state changes for a one-step input."],
  ["Testing, debugging, and explaining", ["Test empty and singleton inputs, duplicates, negative values, sorted and reverse-sorted inputs, and boundary targets.", "Compare the actual output format exactly: spaces, newlines, lowercase booleans, and empty collections can matter.", "When a test fails, inspect the first differing case and the invariant instead of changing several parts at once."], "A concise explanation covers approach, correctness intuition, time, and extra space.", "Create three edge cases for a frequency-map problem before writing its implementation."],
];

const CODE_EXAMPLES = {
  java: [
    "static int solve(int[] nums) {\n    // State the invariant here.\n    return 0;\n}",
    "long total = 0;\nfor (int value : nums) total += value;\n// one pass: O(n) time",
    "int write = 0;\nfor (int value : nums) {\n    if (value != 0) nums[write++] = value;\n}",
    "int[] count = new int[26];\nfor (char ch : text.toCharArray()) {\n    if (ch >= 'a' && ch <= 'z') count[ch - 'a']++;\n}",
    "Map<Integer, Integer> seen = new HashMap<>();\nfor (int i = 0; i < nums.length; i++) {\n    int need = target - nums[i];\n    if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n    seen.put(nums[i], i);\n}",
    "int left = 0, right = nums.length - 1;\nwhile (left < right) {\n    int sum = nums[left] + nums[right];\n    if (sum == target) break;\n    if (sum < target) left++; else right--;\n}",
    "int left = 0;\nfor (int right = 0; right < text.length(); right++) {\n    while (windowIsInvalid(left, right)) left++;\n    best = Math.max(best, right - left + 1);\n}",
    "long[] prefix = new long[nums.length + 1];\nfor (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];\nlong sum = prefix[right + 1] - prefix[left];",
    "Deque<Integer> stack = new ArrayDeque<>();\nfor (int i = 0; i < nums.length; i++) {\n    while (!stack.isEmpty() && nums[stack.peek()] <= nums[i]) stack.pop();\n    stack.push(i);\n}",
    "Queue<Integer> queue = new ArrayDeque<>();\nqueue.offer(start); visited[start] = true;\nwhile (!queue.isEmpty()) { int node = queue.poll(); }",
    "ListNode previous = null, current = head;\nwhile (current != null) {\n    ListNode next = current.next; current.next = previous;\n    previous = current; current = next;\n}",
    "int left = 0, right = nums.length;\nwhile (left < right) {\n    int mid = left + (right - left) / 2;\n    if (nums[mid] < target) left = mid + 1; else right = mid;\n}",
    "Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));\nint kept = 0, end = Integer.MIN_VALUE;\nfor (int[] interval : intervals) if (interval[0] >= end) { kept++; end = interval[1]; }",
    "void choose(int index) {\n    if (index == nums.length) { save(path); return; }\n    path.add(nums[index]); choose(index + 1); path.remove(path.size() - 1);\n    choose(index + 1);\n}",
    "int depth(TreeNode node) {\n    if (node == null) return 0;\n    return 1 + Math.max(depth(node.left), depth(node.right));\n}",
    "List<List<Integer>> graph = new ArrayList<>();\nfor (int i = 0; i < n; i++) graph.add(new ArrayList<>());\ngraph.get(a).add(b); graph.get(b).add(a);",
    "int[] dp = new int[n + 1];\ndp[0] = 1; dp[1] = 1;\nfor (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];",
    "if (nums.length == 0) return 0;\n// Also test one value, duplicates, negatives, and both boundary positions.\n// Explain time and auxiliary space before submitting.",
  ],
  cpp: [
    "int solve(const vector<int>& nums) {\n    // State the invariant here.\n    return 0;\n}",
    "long long total = 0;\nfor (int value : nums) total += value;\n// one pass: O(n) time",
    "int write = 0;\nfor (int value : nums) {\n    if (value != 0) nums[write++] = value;\n}",
    "array<int, 26> count{};\nfor (char ch : text) {\n    if (ch >= 'a' && ch <= 'z') count[ch - 'a']++;\n}",
    "unordered_map<int,int> seen;\nfor (int i = 0; i < (int)nums.size(); ++i) {\n    int need = target - nums[i];\n    if (seen.count(need)) return {seen[need], i};\n    seen[nums[i]] = i;\n}",
    "int left = 0, right = (int)nums.size() - 1;\nwhile (left < right) {\n    int sum = nums[left] + nums[right];\n    if (sum == target) break;\n    if (sum < target) ++left; else --right;\n}",
    "int left = 0;\nfor (int right = 0; right < (int)s.size(); ++right) {\n    while (windowIsInvalid(left, right)) ++left;\n    best = max(best, right - left + 1);\n}",
    "vector<long long> prefix(nums.size() + 1);\nfor (int i = 0; i < (int)nums.size(); ++i) prefix[i + 1] = prefix[i] + nums[i];\nlong long sum = prefix[r + 1] - prefix[l];",
    "vector<int> st;\nfor (int i = 0; i < (int)nums.size(); ++i) {\n    while (!st.empty() && nums[st.back()] <= nums[i]) st.pop_back();\n    st.push_back(i);\n}",
    "queue<int> q; q.push(start); visited[start] = true;\nwhile (!q.empty()) {\n    int node = q.front(); q.pop();\n}",
    "ListNode* previous = nullptr;\nListNode* current = head;\nwhile (current) {\n    ListNode* next = current->next; current->next = previous;\n    previous = current; current = next;\n}",
    "int left = 0, right = (int)nums.size();\nwhile (left < right) {\n    int mid = left + (right - left) / 2;\n    if (nums[mid] < target) left = mid + 1; else right = mid;\n}",
    "sort(intervals.begin(), intervals.end(), [](auto& a, auto& b){ return a[1] < b[1]; });\nint kept = 0, end = INT_MIN;\nfor (auto& it : intervals) if (it[0] >= end) { ++kept; end = it[1]; }",
    "void choose(int i) {\n    if (i == nums.size()) { save(path); return; }\n    path.push_back(nums[i]); choose(i + 1); path.pop_back();\n    choose(i + 1);\n}",
    "int depth(TreeNode* node) {\n    if (!node) return 0;\n    return 1 + max(depth(node->left), depth(node->right));\n}",
    "vector<vector<int>> graph(n);\ngraph[a].push_back(b); graph[b].push_back(a);\n// BFS/DFS each unvisited vertex for components",
    "vector<int> dp(n + 1);\ndp[0] = dp[1] = 1;\nfor (int i = 2; i <= n; ++i) dp[i] = dp[i - 1] + dp[i - 2];",
    "if (nums.empty()) return 0;\n// Test one value, duplicates, negatives, and both boundary positions.\n// Explain time and auxiliary space before submitting.",
  ],
  python: [
    "def solve(nums: list[int]) -> int:\n    # State the invariant here.\n    return 0",
    "total = sum(nums)\n# one pass: O(n) time\nfor value in nums: pass",
    "write = 0\nfor value in nums:\n    if value != 0:\n        nums[write] = value; write += 1",
    "count = [0] * 26\nfor char in text:\n    if 'a' <= char <= 'z': count[ord(char) - ord('a')] += 1",
    "seen = {}\nfor index, value in enumerate(nums):\n    need = target - value\n    if need in seen: return [seen[need], index]\n    seen[value] = index",
    "left, right = 0, len(nums) - 1\nwhile left < right:\n    pair_sum = nums[left] + nums[right]\n    if pair_sum == target: break\n    if pair_sum < target: left += 1\n    else: right -= 1",
    "left = 0\nfor right, char in enumerate(text):\n    while window_is_invalid(left, right): left += 1\n    best = max(best, right - left + 1)",
    "prefix = [0]\nfor value in nums: prefix.append(prefix[-1] + value)\nrange_sum = prefix[right + 1] - prefix[left]",
    "stack = []\nfor index, value in enumerate(nums):\n    while stack and nums[stack[-1]] <= value: stack.pop()\n    stack.append(index)",
    "from collections import deque\nqueue = deque([start]); visited.add(start)\nwhile queue:\n    node = queue.popleft()",
    "previous, current = None, head\nwhile current:\n    following = current.next; current.next = previous\n    previous, current = current, following",
    "left, right = 0, len(nums)\nwhile left < right:\n    mid = left + (right - left) // 2\n    if nums[mid] < target: left = mid + 1\n    else: right = mid",
    "intervals.sort(key=lambda item: item[1])\nkept, end = 0, float('-inf')\nfor start, finish in intervals:\n    if start >= end: kept += 1; end = finish",
    "def choose(index):\n    if index == len(nums): save(path); return\n    path.append(nums[index]); choose(index + 1); path.pop()\n    choose(index + 1)",
    "def depth(node):\n    if node is None: return 0\n    return 1 + max(depth(node.left), depth(node.right))",
    "graph = [[] for _ in range(n)]\ngraph[a].append(b); graph[b].append(a)\n# Traverse every unvisited vertex for components",
    "dp = [0] * (n + 1)\ndp[0] = dp[1] = 1\nfor i in range(2, n + 1): dp[i] = dp[i - 1] + dp[i - 2]",
    "if not nums: return 0\n# Test one value, duplicates, negatives, and both boundary positions.\n# Explain time and auxiliary space before submitting.",
  ],
  javascript: [
    "function solve(nums) {\n  // State the invariant here.\n  return 0;\n}",
    "let total = 0;\nfor (const value of nums) total += value;\n// one pass: O(n) time",
    "let write = 0;\nfor (const value of nums) {\n  if (value !== 0) nums[write++] = value;\n}",
    "const count = Array(26).fill(0);\nfor (const char of text) {\n  if (char >= 'a' && char <= 'z') count[char.charCodeAt(0) - 97]++;\n}",
    "const seen = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const need = target - nums[i];\n  if (seen.has(need)) return [seen.get(need), i];\n  seen.set(nums[i], i);\n}",
    "let left = 0, right = nums.length - 1;\nwhile (left < right) {\n  const sum = nums[left] + nums[right];\n  if (sum === target) break;\n  if (sum < target) left++; else right--;\n}",
    "let left = 0;\nfor (let right = 0; right < text.length; right++) {\n  while (windowIsInvalid(left, right)) left++;\n  best = Math.max(best, right - left + 1);\n}",
    "const prefix = [0];\nfor (const value of nums) prefix.push(prefix.at(-1) + value);\nconst rangeSum = prefix[right + 1] - prefix[left];",
    "const stack = [];\nfor (let i = 0; i < nums.length; i++) {\n  while (stack.length && nums[stack.at(-1)] <= nums[i]) stack.pop();\n  stack.push(i);\n}",
    "const queue = [start]; let head = 0; visited.add(start);\nwhile (head < queue.length) {\n  const node = queue[head++];\n}",
    "let previous = null, current = head;\nwhile (current) {\n  const next = current.next; current.next = previous;\n  previous = current; current = next;\n}",
    "let left = 0, right = nums.length;\nwhile (left < right) {\n  const mid = left + Math.floor((right - left) / 2);\n  if (nums[mid] < target) left = mid + 1; else right = mid;\n}",
    "intervals.sort((a, b) => a[1] - b[1]);\nlet kept = 0, end = -Infinity;\nfor (const [start, finish] of intervals) if (start >= end) { kept++; end = finish; }",
    "function choose(index) {\n  if (index === nums.length) { save(path); return; }\n  path.push(nums[index]); choose(index + 1); path.pop();\n  choose(index + 1);\n}",
    "function depth(node) {\n  if (node === null) return 0;\n  return 1 + Math.max(depth(node.left), depth(node.right));\n}",
    "const graph = Array.from({ length: n }, () => []);\ngraph[a].push(b); graph[b].push(a);\n// Traverse each unvisited vertex for components",
    "const dp = Array(n + 1).fill(0);\ndp[0] = dp[1] = 1;\nfor (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];",
    "if (nums.length === 0) return 0;\n// Test one value, duplicates, negatives, and both boundary positions.\n// Explain time and auxiliary space before submitting.",
  ],
  csharp: [
    "static int Solve(int[] nums)\n{\n    // State the invariant here.\n    return 0;\n}",
    "long total = 0;\nforeach (int value in nums) total += value;\n// one pass: O(n) time",
    "int write = 0;\nforeach (int value in nums)\n    if (value != 0) nums[write++] = value;",
    "int[] count = new int[26];\nforeach (char ch in text)\n    if (ch >= 'a' && ch <= 'z') count[ch - 'a']++;",
    "var seen = new Dictionary<int, int>();\nfor (int i = 0; i < nums.Length; i++) {\n    int need = target - nums[i];\n    if (seen.ContainsKey(need)) return new[] { seen[need], i };\n    seen[nums[i]] = i;\n}",
    "int left = 0, right = nums.Length - 1;\nwhile (left < right) {\n    int sum = nums[left] + nums[right];\n    if (sum == target) break;\n    if (sum < target) left++; else right--;\n}",
    "int left = 0;\nfor (int right = 0; right < text.Length; right++) {\n    while (WindowIsInvalid(left, right)) left++;\n    best = Math.Max(best, right - left + 1);\n}",
    "long[] prefix = new long[nums.Length + 1];\nfor (int i = 0; i < nums.Length; i++) prefix[i + 1] = prefix[i] + nums[i];\nlong sum = prefix[right + 1] - prefix[left];",
    "var stack = new Stack<int>();\nfor (int i = 0; i < nums.Length; i++) {\n    while (stack.Count > 0 && nums[stack.Peek()] <= nums[i]) stack.Pop();\n    stack.Push(i);\n}",
    "var queue = new Queue<int>(); queue.Enqueue(start); visited.Add(start);\nwhile (queue.Count > 0) {\n    int node = queue.Dequeue();\n}",
    "ListNode previous = null, current = head;\nwhile (current != null) {\n    ListNode next = current.next; current.next = previous;\n    previous = current; current = next;\n}",
    "int left = 0, right = nums.Length;\nwhile (left < right) {\n    int mid = left + (right - left) / 2;\n    if (nums[mid] < target) left = mid + 1; else right = mid;\n}",
    "intervals.Sort((a, b) => a[1].CompareTo(b[1]));\nint kept = 0, end = int.MinValue;\nforeach (var item in intervals) if (item[0] >= end) { kept++; end = item[1]; }",
    "void Choose(int index) {\n    if (index == nums.Length) { Save(path); return; }\n    path.Add(nums[index]); Choose(index + 1); path.RemoveAt(path.Count - 1);\n    Choose(index + 1);\n}",
    "int Depth(TreeNode node) {\n    if (node == null) return 0;\n    return 1 + Math.Max(Depth(node.left), Depth(node.right));\n}",
    "var graph = Enumerable.Range(0, n).Select(_ => new List<int>()).ToArray();\ngraph[a].Add(b); graph[b].Add(a);\n// Traverse each unvisited vertex for components",
    "int[] dp = new int[n + 1];\ndp[0] = dp[1] = 1;\nfor (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];",
    "if (nums.Length == 0) return 0;\n// Test one value, duplicates, negatives, and both boundary positions.\n// Explain time and auxiliary space before submitting.",
  ],
};

Object.entries(LANGUAGES).forEach(([language, notes]) => {
  notes.sections = CURRICULUM.map(([title, bullets, focus, exercise], index) => [
    title,
    [...bullets, `In ${notes.name}: ${focus}`],
    CODE_EXAMPLES[language][index],
    exercise,
  ]);
});

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
    { text: "A practical workbook for coding interviews", size: 11 },
    { text: `18 focused chapters · ${notes.sections.length} language-specific examples · practice prompts`, size: 10, gap: 32 },
    { text: "How to use this workbook", size: 16, bold: true, gap: 26 },
    { text: "Read one chapter, trace the example by hand, then attempt the practice prompt before looking at a solution.", size: 11, gap: 8 },
    { text: "For every problem, explain the approach, correctness intuition, time complexity, and extra space.", size: 11, gap: 8 },
    { text: "Check edge cases: empty input, one item, duplicates, negatives, and boundary values.", size: 11, gap: 8 },
  ]];
  pages.push([
    { text: `${notes.name} DSA NOTES`, size: 10, color: "0.38 0.32 0.78", gap: 12 },
    { text: "Contents", size: 20, bold: true, gap: 18 },
    ...notes.sections.map(([heading], index) => ({ text: `${String(index + 1).padStart(2, "0")}  ${heading}`, size: 13, gap: 12 })),
  ]);
  notes.sections.forEach(([heading, bullets, code, exercise], index) => {
    const chapter = [
      { text: `${notes.name} DSA NOTES  ·  CHAPTER ${String(index + 1).padStart(2, "0")}`, size: 9, color: "0.38 0.32 0.78", gap: 5 },
      { text: heading, size: 18, bold: true, gap: 14 },
      { text: "Key ideas", size: 12, bold: true, gap: 7 },
    ];
    bullets.forEach((bullet) => wrapText(`- ${bullet}`, 88).forEach((line) => chapter.push({ text: line, size: 10, gap: 4 })));
    chapter.push({ text: "Code pattern", size: 12, bold: true, gap: 13 });
    code.split("\n").forEach((sourceLine) => {
      const wrapped = wrapText(sourceLine || " ", 82);
      wrapped.forEach((line) => chapter.push({ text: line, size: 9, font: "F2", gap: 3, color: "0.16 0.20 0.30" }));
    });
    chapter.push({ text: "Try it", size: 12, bold: true, gap: 15 });
    wrapText(exercise, 88).forEach((line) => chapter.push({ text: line, size: 10, gap: 4 }));
    pages.push(chapter);
  });

  const objects = [];
  const addObject = (value) => { objects.push(value); return objects.length; };
  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const monoFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];
  pages.forEach((pageLines, pageIndex) => {
    let y = 752;
    const commands = ["BT"];
    pageLines.forEach((item) => {
      y -= item.gap || 0;
      if (y < 48) return;
      const color = item.color || "0.13 0.18 0.28";
      commands.push(`${color} rg /${item.font || (item.bold ? "F3" : "F1")} ${item.size || 10} Tf 1 0 0 1 54 ${y} Tm (${escapePdfText(item.text)}) Tj`);
      y -= (item.size || 10) + 6;
    });
    commands.push(`0.45 0.49 0.58 rg /F1 9 Tf 1 0 0 1 54 28 Tm (${pageIndex + 1} / ${pages.length}) Tj`, "ET");
    const stream = commands.join("\n");
    const streamId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${monoFontId} 0 R /F3 ${boldFontId} 0 R >> >> /Contents ${streamId} 0 R >>`));
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
