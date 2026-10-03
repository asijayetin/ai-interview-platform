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

export const TYPED_FUNCTIONS = {
  "two-sum": {
    signature: "static int[] twoSum(int[] nums, int target)",
    stub: "return new int[0];",
    solution: `Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    int needed = target - nums[i];
    if (seen.containsKey(needed)) return new int[]{seen.get(needed), i};
    seen.put(nums[i], i);
}
return new int[0];`,
    driver: `int n = sc.nextInt(), target = sc.nextInt();
int[] nums = new int[n];
for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
int[] answer = Solution.twoSum(nums, target);
System.out.println(answer.length < 2 ? "" : answer[0] + " " + answer[1]);`,
  },
  "max-subarray": {
    signature: "static long maxSubarray(int[] nums)",
    stub: "return 0L;",
    solution: `long current = nums[0];
long best = current;
for (int i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
}
return best;`,
    driver: `int n = sc.nextInt();
int[] nums = new int[n];
for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
System.out.println(Solution.maxSubarray(nums));`,
  },
  "contains-duplicate": {
    signature: "static boolean containsDuplicate(int[] nums)", stub: "return false;",
    solution: "Set<Integer> seen = new HashSet<>();\nfor (int value : nums) if (!seen.add(value)) return true;\nreturn false;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.containsDuplicate(nums));",
  },
  "valid-anagram": {
    signature: "static boolean isAnagram(String s, String t)", stub: "return false;",
    solution: "if (s.length() != t.length()) return false;\nint[] count = new int[26];\nfor (int i = 0; i < s.length(); i++) { count[s.charAt(i) - 'a']++; count[t.charAt(i) - 'a']--; }\nfor (int value : count) if (value != 0) return false;\nreturn true;",
    driver: "String s = sc.next(), t = sc.next(); System.out.println(Solution.isAnagram(s, t));",
  },
  "valid-palindrome": {
    signature: "static boolean isPalindrome(String s)", stub: "return false;",
    solution: "int left = 0, right = s.length() - 1;\nwhile (left < right) {\n    while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;\n    while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;\n    if (Character.toLowerCase(s.charAt(left++)) != Character.toLowerCase(s.charAt(right--))) return false;\n}\nreturn true;",
    driver: "String s = sc.hasNextLine() ? sc.nextLine() : \"\"; System.out.println(Solution.isPalindrome(s));",
  },
  "binary-search": {
    signature: "static int search(int[] nums, int target)", stub: "return -1;",
    solution: "int left = 0, right = nums.length - 1;\nwhile (left <= right) {\n    int mid = left + (right - left) / 2;\n    if (nums[mid] == target) return mid;\n    if (nums[mid] < target) left = mid + 1; else right = mid - 1;\n}\nreturn -1;",
    driver: "int n = sc.nextInt(), target = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.search(nums, target));",
  },
  "valid-parentheses": {
    signature: "static boolean isValid(String s)", stub: "return false;",
    solution: "Deque<Character> stack = new ArrayDeque<>();\nfor (char c : s.toCharArray()) {\n    if (c == '(' || c == '[' || c == '{') stack.push(c);\n    else { if (stack.isEmpty()) return false; char open = stack.pop(); if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false; }\n}\nreturn stack.isEmpty();",
    driver: "String s = sc.hasNext() ? sc.next() : \"\"; System.out.println(Solution.isValid(s));",
  },
  "climbing-stairs": {
    signature: "static long climbStairs(int n)", stub: "return 0L;",
    solution: "long previous = 1, current = 1;\nfor (int step = 2; step <= n; step++) { long next = previous + current; previous = current; current = next; }\nreturn n == 0 ? 1 : current;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.climbStairs(n));",
  },
  "best-time-stock": {
    signature: "static int maxProfit(int[] prices)", stub: "return 0;",
    solution: "int lowest = Integer.MAX_VALUE, best = 0;\nfor (int price : prices) { lowest = Math.min(lowest, price); best = Math.max(best, price - lowest); }\nreturn best;",
    driver: "int n = sc.nextInt(); int[] prices = readInts(sc, n); System.out.println(Solution.maxProfit(prices));",
  },
  "first-unique": {
    signature: "static int firstUniqChar(String s)", stub: "return -1;",
    solution: "int[] count = new int[26];\nfor (char c : s.toCharArray()) count[c - 'a']++;\nfor (int i = 0; i < s.length(); i++) if (count[s.charAt(i) - 'a'] == 1) return i;\nreturn -1;",
    driver: "String s = sc.next(); System.out.println(Solution.firstUniqChar(s));",
  },
  "product-except-self": {
    signature: "static int[] productExceptSelf(int[] nums)", stub: "return new int[nums.length];",
    solution: "int[] answer = new int[nums.length];\nint prefix = 1;\nfor (int i = 0; i < nums.length; i++) { answer[i] = prefix; prefix *= nums[i]; }\nint suffix = 1;\nfor (int i = nums.length - 1; i >= 0; i--) { answer[i] *= suffix; suffix *= nums[i]; }\nreturn answer;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.productExceptSelf(nums));",
  },
  "daily-temperatures": {
    signature: "static int[] dailyTemperatures(int[] temperatures)", stub: "return new int[temperatures.length];",
    solution: "int[] answer = new int[temperatures.length];\nDeque<Integer> stack = new ArrayDeque<>();\nfor (int i = 0; i < temperatures.length; i++) { while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) { int day = stack.pop(); answer[day] = i - day; } stack.push(i); }\nreturn answer;",
    driver: "int n = sc.nextInt(); int[] temperatures = readInts(sc, n); printInts(Solution.dailyTemperatures(temperatures));",
  },
  "majority-element": {
    signature: "static int majorityElement(int[] nums)", stub: "return 0;",
    solution: "int candidate = 0, count = 0;\nfor (int value : nums) { if (count == 0) candidate = value; count += value == candidate ? 1 : -1; }\nreturn candidate;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.majorityElement(nums));",
  },
  "move-zeroes": {
    signature: "static void moveZeroes(int[] nums)", stub: "// Modify nums in place.",
    solution: "int next = 0;\nfor (int value : nums) if (value != 0) nums[next++] = value;\nwhile (next < nums.length) nums[next++] = 0;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); Solution.moveZeroes(nums); printInts(nums);",
  },
  "missing-number": {
    signature: "static int missingNumber(int[] nums)", stub: "return 0;",
    solution: "int missing = nums.length;\nfor (int i = 0; i < nums.length; i++) missing ^= i ^ nums[i];\nreturn missing;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.missingNumber(nums));",
  },
  "remove-duplicates": {
    signature: "static int removeDuplicates(int[] nums)", stub: "return 0;",
    solution: "if (nums.length == 0) return 0;\nint write = 1;\nfor (int read = 1; read < nums.length; read++) if (nums[read] != nums[write - 1]) nums[write++] = nums[read];\nreturn write;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); int k = Solution.removeDuplicates(nums); System.out.println(k); for (int i = 0; i < k; i++) { if (i > 0) System.out.print(\" \"); System.out.print(nums[i]); } System.out.println();",
  },
  "longest-common-prefix": {
    signature: "static String longestCommonPrefix(String[] strs)", stub: "return \"\";",
    solution: "if (strs.length == 0) return \"\";\nString prefix = strs[0];\nfor (int i = 1; i < strs.length; i++) while (!strs[i].startsWith(prefix)) { prefix = prefix.substring(0, prefix.length() - 1); if (prefix.isEmpty()) return \"\"; }\nreturn prefix;",
    driver: "int n = sc.nextInt(); sc.nextLine(); String[] strs = new String[n]; for (int i = 0; i < n; i++) strs[i] = sc.nextLine(); System.out.println(Solution.longestCommonPrefix(strs));",
  },
  "reverse-words": {
    signature: "static String reverseWords(String s)", stub: "return \"\";",
    solution: "String[] words = s.trim().split(\"\\\\s+\");\nif (s.trim().isEmpty()) return \"\";\nStringBuilder result = new StringBuilder();\nfor (int i = words.length - 1; i >= 0; i--) { if (result.length() > 0) result.append(' '); result.append(words[i]); }\nreturn result.toString();",
    driver: "String s = sc.hasNextLine() ? sc.nextLine() : \"\"; System.out.println(Solution.reverseWords(s));",
  },
  "house-robber": {
    signature: "static long rob(int[] nums)", stub: "return 0L;",
    solution: "long twoBack = 0, oneBack = 0;\nfor (int value : nums) { long current = Math.max(oneBack, twoBack + value); twoBack = oneBack; oneBack = current; }\nreturn oneBack;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.rob(nums));",
  },
  "kth-largest": {
    signature: "static int findKthLargest(int[] nums, int k)", stub: "return 0;",
    solution: "Arrays.sort(nums);\nreturn nums[nums.length - k];",
    driver: "int n = sc.nextInt(), k = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.findKthLargest(nums, k));",
  },
  "roman-to-integer": {
    signature: "static int romanToInt(String s)", stub: "return 0;",
    solution: "Map<Character, Integer> values = Map.of('I', 1, 'V', 5, 'X', 10, 'L', 50, 'C', 100, 'D', 500, 'M', 1000);\nint total = 0;\nfor (int i = 0; i < s.length(); i++) { int value = values.get(s.charAt(i)); if (i + 1 < s.length() && value < values.get(s.charAt(i + 1))) total -= value; else total += value; }\nreturn total;",
    driver: "String s = sc.next(); System.out.println(Solution.romanToInt(s));",
  },
  "rotate-array": {
    signature: "static void rotate(int[] nums, int k)", stub: "// Rotate nums in place.",
    solution: "if (nums.length == 0) return;\nk %= nums.length; int[] copy = nums.clone();\nfor (int i = 0; i < nums.length; i++) nums[(i + k) % nums.length] = copy[i];",
    driver: "int n = sc.nextInt(), k = sc.nextInt(); int[] nums = readInts(sc, n); Solution.rotate(nums, k); printInts(nums);",
  },
  "search-rotated-array": {
    signature: "static int search(int[] nums, int target)", stub: "return -1;",
    solution: "int left = 0, right = nums.length - 1;\nwhile (left <= right) { int mid = left + (right - left) / 2; if (nums[mid] == target) return mid; if (nums[left] <= nums[mid]) { if (nums[left] <= target && target < nums[mid]) right = mid - 1; else left = mid + 1; } else { if (nums[mid] < target && target <= nums[right]) left = mid + 1; else right = mid - 1; } }\nreturn -1;",
    driver: "int n = sc.nextInt(), target = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.search(nums, target));",
  },
  "longest-increasing-subsequence": {
    signature: "static int lengthOfLIS(int[] nums)", stub: "return 0;",
    solution: "int[] tails = new int[nums.length]; int size = 0;\nfor (int value : nums) { int left = 0, right = size; while (left < right) { int mid = (left + right) / 2; if (tails[mid] < value) left = mid + 1; else right = mid; } tails[left] = value; if (left == size) size++; }\nreturn size;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.lengthOfLIS(nums));",
  },
  "running-sum": {
    signature: "static int[] runningSum(int[] nums)", stub: "return nums;",
    solution: "for (int i = 1; i < nums.length; i++) nums[i] += nums[i - 1];\nreturn nums;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.runningSum(nums));",
  },
  "pivot-index": {
    signature: "static int pivotIndex(int[] nums)", stub: "return -1;",
    solution: "int total = 0; for (int value : nums) total += value;\nint left = 0;\nfor (int i = 0; i < nums.length; i++) { if (left == total - left - nums[i]) return i; left += nums[i]; }\nreturn -1;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.pivotIndex(nums));",
  },
  "max-consecutive-ones": {
    signature: "static int findMaxConsecutiveOnes(int[] nums)", stub: "return 0;",
    solution: "int best = 0, run = 0; for (int value : nums) { run = value == 1 ? run + 1 : 0; best = Math.max(best, run); } return best;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.findMaxConsecutiveOnes(nums));",
  },
  "single-number": {
    signature: "static int singleNumber(int[] nums)", stub: "return 0;",
    solution: "int answer = 0; for (int value : nums) answer ^= value; return answer;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.singleNumber(nums));",
  },
  "reverse-string": {
    signature: "static String reverseString(String s)", stub: "return s;",
    solution: "return new StringBuilder(s).reverse().toString();",
    driver: "String s = sc.hasNext() ? sc.next() : \"\"; System.out.println(Solution.reverseString(s));",
  },
  "is-subsequence": {
    signature: "static boolean isSubsequence(String s, String t)", stub: "return false;",
    solution: "int i = 0; for (int j = 0; j < t.length() && i < s.length(); j++) if (s.charAt(i) == t.charAt(j)) i++; return i == s.length();",
    driver: "String s = sc.next(), t = sc.next(); System.out.println(Solution.isSubsequence(s, t));",
  },
  "plus-one": {
    signature: "static int[] plusOne(int[] digits)", stub: "return digits;",
    solution: "for (int i = digits.length - 1; i >= 0; i--) { if (digits[i] < 9) { digits[i]++; return digits; } digits[i] = 0; }\nint[] answer = new int[digits.length + 1]; answer[0] = 1; return answer;",
    driver: "int n = sc.nextInt(); int[] digits = readInts(sc, n); printInts(Solution.plusOne(digits));",
  },
  "fibonacci-number": {
    signature: "static long fib(int n)", stub: "return 0L;",
    solution: "if (n < 2) return n;\nlong previous = 0, current = 1;\nfor (int i = 2; i <= n; i++) { long next = previous + current; previous = current; current = next; }\nreturn current;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.fib(n));",
  },
  "sqrt-x": {
    signature: "static int mySqrt(int x)", stub: "return 0;",
    solution: "long left = 0, right = x;\nwhile (left <= right) { long mid = (left + right) / 2; if (mid * mid <= x) left = mid + 1; else right = mid - 1; }\nreturn (int) right;",
    driver: "int x = sc.nextInt(); System.out.println(Solution.mySqrt(x));",
  },
  "subarray-sum-k": {
    signature: "static int subarraySum(int[] nums, int k)", stub: "return 0;",
    solution: "Map<Integer, Integer> counts = new HashMap<>(); counts.put(0, 1);\nint prefix = 0, answer = 0;\nfor (int value : nums) { prefix += value; answer += counts.getOrDefault(prefix - k, 0); counts.put(prefix, counts.getOrDefault(prefix, 0) + 1); }\nreturn answer;",
    driver: "int n = sc.nextInt(), k = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.subarraySum(nums, k));",
  },
  "longest-no-repeat": {
    signature: "static int lengthOfLongestSubstring(String s)", stub: "return 0;",
    solution: "Map<Character, Integer> last = new HashMap<>(); int left = 0, best = 0;\nfor (int right = 0; right < s.length(); right++) { char c = s.charAt(right); if (last.containsKey(c)) left = Math.max(left, last.get(c) + 1); last.put(c, right); best = Math.max(best, right - left + 1); }\nreturn best;",
    driver: "String s = sc.hasNextLine() ? sc.nextLine() : \"\"; System.out.println(Solution.lengthOfLongestSubstring(s));",
  },
  "add-binary": {
    signature: "static String addBinary(String a, String b)", stub: "return \"\";",
    solution: "StringBuilder result = new StringBuilder(); int i = a.length() - 1, j = b.length() - 1, carry = 0;\nwhile (i >= 0 || j >= 0 || carry != 0) { int sum = carry; if (i >= 0) sum += a.charAt(i--) - '0'; if (j >= 0) sum += b.charAt(j--) - '0'; result.append(sum % 2); carry = sum / 2; }\nreturn result.reverse().toString();",
    driver: "String a = sc.next(), b = sc.next(); System.out.println(Solution.addBinary(a, b));",
  },
  "string-rotation": {
    signature: "static boolean rotateString(String s, String goal)", stub: "return false;",
    solution: "return s.length() == goal.length() && (s + s).contains(goal);",
    driver: "String s = sc.next(), goal = sc.next(); System.out.println(Solution.rotateString(s, goal));",
  },
  "count-vowels": {
    signature: "static int countVowels(String s)", stub: "return 0;",
    solution: "int count = 0; for (char c : s.toLowerCase().toCharArray()) if (\"aeiou\".indexOf(c) >= 0) count++; return count;",
    driver: "String s = sc.hasNextLine() ? sc.nextLine() : \"\"; System.out.println(Solution.countVowels(s));",
  },
  "valid-mountain": {
    signature: "static boolean validMountainArray(int[] arr)", stub: "return false;",
    solution: "int i = 0; while (i + 1 < arr.length && arr[i] < arr[i + 1]) i++;\nif (i == 0 || i == arr.length - 1) return false;\nwhile (i + 1 < arr.length && arr[i] > arr[i + 1]) i++;\nreturn i == arr.length - 1;",
    driver: "int n = sc.nextInt(); int[] arr = readInts(sc, n); System.out.println(Solution.validMountainArray(arr));",
  },
  "third-maximum": {
    signature: "static int thirdMax(int[] nums)", stub: "return 0;",
    solution: "TreeSet<Integer> best = new TreeSet<>(); for (int value : nums) { best.add(value); if (best.size() > 3) best.pollFirst(); }\nreturn best.size() == 3 ? best.first() : best.last();",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.thirdMax(nums));",
  },
  "jump-game": {
    signature: "static boolean canJump(int[] nums)", stub: "return false;",
    solution: "int farthest = 0; for (int i = 0; i < nums.length && i <= farthest; i++) { farthest = Math.max(farthest, i + nums[i]); if (farthest >= nums.length - 1) return true; } return nums.length <= 1;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.canJump(nums));",
  },
  "length-last-word": {
    signature: "static int lengthOfLastWord(String s)", stub: "return 0;",
    solution: "int i = s.length() - 1; while (i >= 0 && s.charAt(i) == ' ') i--; int end = i; while (i >= 0 && s.charAt(i) != ' ') i--; return end - i;",
    driver: "String s = sc.hasNextLine() ? sc.nextLine() : \"\"; System.out.println(Solution.lengthOfLastWord(s));",
  },
  "isomorphic-strings": {
    signature: "static boolean isIsomorphic(String s, String t)", stub: "return false;",
    solution: "if (s.length() != t.length()) return false; int[] a = new int[65536], b = new int[65536];\nfor (int i = 0; i < s.length(); i++) { char x = s.charAt(i), y = t.charAt(i); if (a[x] != b[y]) return false; a[x] = b[y] = i + 1; }\nreturn true;",
    driver: "String s = sc.next(), t = sc.next(); System.out.println(Solution.isIsomorphic(s, t));",
  },
  "min-add-parentheses": {
    signature: "static int minAddToMakeValid(String s)", stub: "return 0;",
    solution: "int open = 0, additions = 0; for (char c : s.toCharArray()) { if (c == '(') open++; else if (open > 0) open--; else additions++; } return additions + open;",
    driver: "String s = sc.next(); System.out.println(Solution.minAddToMakeValid(s));",
  },
  "number-of-one-bits": {
    signature: "static int hammingWeight(int n)", stub: "return 0;",
    solution: "return Integer.bitCount(n);",
    driver: "int n = sc.nextInt(); System.out.println(Solution.hammingWeight(n));",
  },
  "happy-number": {
    signature: "static boolean isHappy(int n)", stub: "return false;",
    solution: "Set<Integer> seen = new HashSet<>();\nwhile (n != 1 && seen.add(n)) { int sum = 0; while (n > 0) { int digit = n % 10; sum += digit * digit; n /= 10; } n = sum; }\nreturn n == 1;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.isHappy(n));",
  },
  "power-of-two": {
    signature: "static boolean isPowerOfTwo(int n)", stub: "return false;",
    solution: "return n > 0 && (n & (n - 1)) == 0;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.isPowerOfTwo(n));",
  },
  "longest-consecutive": {
    signature: "static int longestConsecutive(int[] nums)", stub: "return 0;",
    solution: "Set<Integer> values = new HashSet<>(); for (int x : nums) values.add(x); int best = 0;\nfor (int x : values) if (!values.contains(x - 1)) { int y = x; while (values.contains(y)) y++; best = Math.max(best, y - x); }\nreturn best;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.longestConsecutive(nums));",
  },
  "second-largest": {
    signature: "static int secondLargest(int[] nums)", stub: "return -1;",
    solution: "long first = Long.MIN_VALUE, second = Long.MIN_VALUE; for (int x : nums) { if (x > first) { second = first; first = x; } else if (x < first && x > second) second = x; } return second == Long.MIN_VALUE ? -1 : (int) second;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.secondLargest(nums));",
  },
  "array-is-sorted": {
    signature: "static boolean isSorted(int[] nums)", stub: "return false;",
    solution: "for (int i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return false; return true;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.isSorted(nums));",
  },
  "linear-search": {
    signature: "static int linearSearch(int[] nums, int target)", stub: "return -1;",
    solution: "for (int i = 0; i < nums.length; i++) if (nums[i] == target) return i; return -1;",
    driver: "int n = sc.nextInt(), target = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.linearSearch(nums, target));",
  },
  "sum-array": {
    signature: "static long sumArray(int[] nums)", stub: "return 0L;",
    solution: "long sum = 0; for (int value : nums) sum += value; return sum;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.sumArray(nums));",
  },
  "gcd": {
    signature: "static int gcd(int a, int b)", stub: "return 0;",
    solution: "while (b != 0) { int remainder = a % b; a = b; b = remainder; } return Math.abs(a);",
    driver: "int a = sc.nextInt(), b = sc.nextInt(); System.out.println(Solution.gcd(a, b));",
  },
  "factorial": {
    signature: "static long factorial(int n)", stub: "return 1L;",
    solution: "long result = 1; for (int i = 2; i <= n; i++) result *= i; return result;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.factorial(n));",
  },
  "sum-digits": {
    signature: "static int sumDigits(int n)", stub: "return 0;",
    solution: "long value = Math.abs((long) n); int sum = 0; while (value > 0) { sum += value % 10; value /= 10; } return sum;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.sumDigits(n));",
  },
  "reverse-array": {
    signature: "static int[] reverseArray(int[] nums)", stub: "return nums;",
    solution: "int left = 0, right = nums.length - 1; while (left < right) { int temp = nums[left]; nums[left++] = nums[right]; nums[right--] = temp; } return nums;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.reverseArray(nums));",
  },
  "min-max-array": {
    signature: "static int[] minMax(int[] nums)", stub: "return new int[0];",
    solution: "int min = nums[0], max = nums[0]; for (int value : nums) { min = Math.min(min, value); max = Math.max(max, value); } return new int[]{min, max};",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.minMax(nums));",
  },
  "count-even": {
    signature: "static int countEven(int[] nums)", stub: "return 0;",
    solution: "int count = 0; for (int value : nums) if (value % 2 == 0) count++; return count;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.countEven(nums));",
  },
  "remove-element": {
    signature: "static int removeElement(int[] nums, int val)", stub: "return 0;",
    solution: "int write = 0; for (int value : nums) if (value != val) nums[write++] = value; return write;",
    driver: "int n = sc.nextInt(), val = sc.nextInt(); int[] nums = readInts(sc, n); int k = Solution.removeElement(nums, val); System.out.println(k); for (int i = 0; i < k; i++) { if (i > 0) System.out.print(\" \"); System.out.print(nums[i]); } System.out.println();",
  },
  "sorted-squares": {
    signature: "static int[] sortedSquares(int[] nums)", stub: "return new int[nums.length];",
    solution: "int[] answer = new int[nums.length]; int left = 0, right = nums.length - 1; for (int write = nums.length - 1; write >= 0; write--) { int a = nums[left] * nums[left], b = nums[right] * nums[right]; if (a > b) { answer[write] = a; left++; } else { answer[write] = b; right--; } } return answer;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.sortedSquares(nums));",
  },
  "number-steps-zero": {
    signature: "static int numberOfSteps(int num)", stub: "return 0;",
    solution: "int steps = 0; while (num > 0) { num = num % 2 == 0 ? num / 2 : num - 1; steps++; } return steps;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.numberOfSteps(n));",
  },
  "is-power-of-three": {
    signature: "static boolean isPowerOfThree(int n)", stub: "return false;",
    solution: "if (n < 1) return false; while (n % 3 == 0) n /= 3; return n == 1;",
    driver: "int n = sc.nextInt(); System.out.println(Solution.isPowerOfThree(n));",
  },
  "good-pairs": {
    signature: "static int numIdenticalPairs(int[] nums)", stub: "return 0;",
    solution: "Map<Integer, Integer> seen = new HashMap<>(); int pairs = 0; for (int value : nums) { int count = seen.getOrDefault(value, 0); pairs += count; seen.put(value, count + 1); } return pairs;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.numIdenticalPairs(nums));",
  },
  "contains-nearby-duplicate": {
    signature: "static boolean containsNearbyDuplicate(int[] nums, int k)", stub: "return false;",
    solution: "Map<Integer, Integer> last = new HashMap<>(); for (int i = 0; i < nums.length; i++) { if (last.containsKey(nums[i]) && i - last.get(nums[i]) <= k) return true; last.put(nums[i], i); } return false;",
    driver: "int n = sc.nextInt(), k = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.containsNearbyDuplicate(nums, k));",
  },
  "top-k-frequent": {
    signature: "static int[] topKFrequent(int[] nums, int k)", stub: "return new int[0];",
    solution: "Map<Integer, Integer> frequency = new HashMap<>(); for (int value : nums) frequency.put(value, frequency.getOrDefault(value, 0) + 1);\nList<Integer> values = new ArrayList<>(frequency.keySet()); values.sort((a, b) -> frequency.get(b).equals(frequency.get(a)) ? Integer.compare(a, b) : Integer.compare(frequency.get(b), frequency.get(a)));\nint[] answer = new int[k]; for (int i = 0; i < k; i++) answer[i] = values.get(i); return answer;",
    driver: "int n = sc.nextInt(), k = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.topKFrequent(nums, k));",
  },
  "search-insert": {
    signature: "static int searchInsert(int[] nums, int target)", stub: "return 0;",
    solution: "int left = 0, right = nums.length; while (left < right) { int mid = (left + right) / 2; if (nums[mid] < target) left = mid + 1; else right = mid; } return left;",
    driver: "int n = sc.nextInt(), target = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.searchInsert(nums, target));",
  },
  "find-range": {
    signature: "static int[] searchRange(int[] nums, int target)", stub: "return new int[]{-1, -1};",
    solution: "int left = lowerBound(nums, target); if (left == nums.length || nums[left] != target) return new int[]{-1, -1};\nint right = lowerBound(nums, target + 1) - 1; return new int[]{left, right};",
    helpers: "static int lowerBound(int[] a, int x) { int l = 0, r = a.length; while (l < r) { int m = (l + r) / 2; if (a[m] < x) l = m + 1; else r = m; } return l; }",
    driver: "int n = sc.nextInt(), target = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.searchRange(nums, target));",
  },
  "find-min-rotated": {
    signature: "static int findMin(int[] nums)", stub: "return 0;",
    solution: "int left = 0, right = nums.length - 1; while (left < right) { int mid = (left + right) / 2; if (nums[mid] > nums[right]) left = mid + 1; else right = mid; } return nums[left];",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.findMin(nums));",
  },
  "peak-element": {
    signature: "static int findPeakElement(int[] nums)", stub: "return 0;",
    solution: "int left = 0, right = nums.length - 1; while (left < right) { int mid = (left + right) / 2; if (nums[mid] < nums[mid + 1]) left = mid + 1; else right = mid; } return left;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.findPeakElement(nums));",
  },
  "max-product-subarray": {
    signature: "static int maxProduct(int[] nums)", stub: "return 0;",
    solution: "int max = nums[0], min = nums[0], answer = nums[0]; for (int i = 1; i < nums.length; i++) { if (nums[i] < 0) { int temp = max; max = min; min = temp; } max = Math.max(nums[i], max * nums[i]); min = Math.min(nums[i], min * nums[i]); answer = Math.max(answer, max); } return answer;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.maxProduct(nums));",
  },
  "container-most-water": {
    signature: "static int maxArea(int[] height)", stub: "return 0;",
    solution: "int left = 0, right = height.length - 1, best = 0; while (left < right) { best = Math.max(best, Math.min(height[left], height[right]) * (right - left)); if (height[left] < height[right]) left++; else right--; } return best;",
    driver: "int n = sc.nextInt(); int[] height = readInts(sc, n); System.out.println(Solution.maxArea(height));",
  },
  "two-sum-sorted": {
    signature: "static int[] twoSumSorted(int[] numbers, int target)", stub: "return new int[0];",
    solution: "int left = 0, right = numbers.length - 1; while (left < right) { int sum = numbers[left] + numbers[right]; if (sum == target) return new int[]{left + 1, right + 1}; if (sum < target) left++; else right--; } return new int[0];",
    driver: "int n = sc.nextInt(), target = sc.nextInt(); int[] numbers = readInts(sc, n); printInts(Solution.twoSumSorted(numbers, target));",
  },
  "unique-paths": {
    signature: "static long uniquePaths(int m, int n)", stub: "return 0L;",
    solution: "long[] dp = new long[n]; Arrays.fill(dp, 1); for (int row = 1; row < m; row++) for (int col = 1; col < n; col++) dp[col] += dp[col - 1]; return dp[n - 1];",
    driver: "int m = sc.nextInt(), n = sc.nextInt(); System.out.println(Solution.uniquePaths(m, n));",
  },
  "min-cost-climbing": {
    signature: "static int minCostClimbingStairs(int[] cost)", stub: "return 0;",
    solution: "int twoBack = 0, oneBack = 0; for (int i = 2; i <= cost.length; i++) { int current = Math.min(oneBack + cost[i - 1], twoBack + cost[i - 2]); twoBack = oneBack; oneBack = current; } return oneBack;",
    driver: "int n = sc.nextInt(); int[] cost = readInts(sc, n); System.out.println(Solution.minCostClimbingStairs(cost));",
  },
  "climbing-stairs-ways": {
    signature: "static int minJumps(int[] nums)", stub: "return -1;",
    solution: "if (nums.length <= 1) return 0; int jumps = 0, currentEnd = 0, farthest = 0; for (int i = 0; i < nums.length - 1; i++) { farthest = Math.max(farthest, i + nums[i]); if (i == currentEnd) { if (farthest == currentEnd) return -1; jumps++; currentEnd = farthest; if (currentEnd >= nums.length - 1) return jumps; } } return -1;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); System.out.println(Solution.minJumps(nums));",
  },
  "can-place-flowers": {
    signature: "static boolean canPlaceFlowers(int[] flowerbed, int n)", stub: "return false;",
    solution: "int planted = 0; for (int i = 0; i < flowerbed.length; i++) if (flowerbed[i] == 0 && (i == 0 || flowerbed[i - 1] == 0) && (i == flowerbed.length - 1 || flowerbed[i + 1] == 0)) { flowerbed[i] = 1; planted++; } return planted >= n;",
    driver: "int m = sc.nextInt(), n = sc.nextInt(); int[] flowerbed = readInts(sc, m); System.out.println(Solution.canPlaceFlowers(flowerbed, n));",
  },
  "last-stone-weight": {
    signature: "static int lastStoneWeight(int[] stones)", stub: "return 0;",
    solution: "PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder()); for (int stone : stones) heap.add(stone); while (heap.size() > 1) { int a = heap.remove(), b = heap.remove(); if (a != b) heap.add(a - b); } return heap.isEmpty() ? 0 : heap.remove();",
    driver: "int n = sc.nextInt(); int[] stones = readInts(sc, n); System.out.println(Solution.lastStoneWeight(stones));",
  },
  "reverse-linked-list": {
    signature: "static ListNode reverseList(ListNode head)", stub: "return head;",
    solution: "ListNode previous = null, current = head;\nwhile (current != null) { ListNode next = current.next; current.next = previous; previous = current; current = next; }\nreturn previous;",
    nodeType: "ListNode",
    driver: "int n = sc.nextInt(); int[] values = readInts(sc, n); Solution.ListNode head = list(values); printList(Solution.reverseList(head));",
  },
  "merge-sorted-arrays": {
    signature: "static int[] mergeSortedArrays(int[] first, int[] second)", stub: "return new int[0];",
    solution: "int[] answer = new int[first.length + second.length]; int i = 0, j = 0, k = 0;\nwhile (i < first.length || j < second.length) { if (j == second.length || (i < first.length && first[i] <= second[j])) answer[k++] = first[i++]; else answer[k++] = second[j++]; }\nreturn answer;",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); int[] first = readInts(sc, n), second = readInts(sc, m); printInts(Solution.mergeSortedArrays(first, second));",
  },
  "number-of-islands": {
    signature: "static int numIslands(char[][] grid)", stub: "return 0;",
    solution: "int count = 0; for (int r = 0; r < grid.length; r++) for (int c = 0; c < grid[r].length; c++) if (grid[r][c] == '1') { count++; flood(grid, r, c); } return count;",
    helpers: "static void flood(char[][] g, int r, int c) { if (r < 0 || c < 0 || r == g.length || c == g[r].length || g[r][c] != '1') return; g[r][c] = '0'; flood(g, r + 1, c); flood(g, r - 1, c); flood(g, r, c + 1); flood(g, r, c - 1); }",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); char[][] grid = new char[n][m]; for (int r = 0; r < n; r++) grid[r] = sc.next().toCharArray(); System.out.println(Solution.numIslands(grid));",
  },
  "queue-using-stacks": {
    signature: "static List<Integer> processQueue(String[] operations)", stub: "return new ArrayList<>();",
    solution: "Deque<Integer> queue = new ArrayDeque<>(); List<Integer> output = new ArrayList<>();\nfor (String operation : operations) { String[] parts = operation.split(\" \"); if (parts[0].equals(\"push\")) queue.add(Integer.parseInt(parts[1])); else if (parts[0].equals(\"pop\")) output.add(queue.remove()); else output.add(queue.element()); }\nreturn output;",
    driver: "int q = sc.nextInt(); sc.nextLine(); String[] operations = new String[q]; for (int i = 0; i < q; i++) operations[i] = sc.nextLine(); printLines(Solution.processQueue(operations));",
  },
  "min-stack": {
    signature: "static List<Integer> processMinStack(String[] operations)", stub: "return new ArrayList<>();",
    solution: "Deque<Integer> values = new ArrayDeque<>(), mins = new ArrayDeque<>(); List<Integer> output = new ArrayList<>();\nfor (String operation : operations) { String[] p = operation.split(\" \"); if (p[0].equals(\"push\")) { int x = Integer.parseInt(p[1]); values.push(x); if (mins.isEmpty() || x <= mins.peek()) mins.push(x); } else if (p[0].equals(\"pop\")) { int x = values.pop(); if (x == mins.peek()) mins.pop(); output.add(x); } else if (p[0].equals(\"top\")) output.add(values.peek()); else output.add(mins.peek()); }\nreturn output;",
    driver: "int q = sc.nextInt(); sc.nextLine(); String[] operations = new String[q]; for (int i = 0; i < q; i++) operations[i] = sc.nextLine(); printLines(Solution.processMinStack(operations));",
  },
  "flood-fill": {
    signature: "static char[][] floodFill(char[][] image, int sr, int sc, char color)", stub: "return image;",
    solution: "char original = image[sr][sc]; if (original == color) return image; fill(image, sr, sc, original, color); return image;",
    helpers: "static void fill(char[][] image, int r, int c, char oldColor, char newColor) { if (r < 0 || c < 0 || r >= image.length || c >= image[r].length || image[r][c] != oldColor) return; image[r][c] = newColor; fill(image, r + 1, c, oldColor, newColor); fill(image, r - 1, c, oldColor, newColor); fill(image, r, c + 1, oldColor, newColor); fill(image, r, c - 1, oldColor, newColor); }",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); char[][] image = new char[n][m]; for (int r = 0; r < n; r++) image[r] = sc.next().toCharArray(); int sr = sc.nextInt(), col = sc.nextInt(); char color = sc.next().charAt(0); printChars(Solution.floodFill(image, sr, col, color));",
  },
  "palindrome-linked-list": {
    signature: "static boolean isPalindrome(ListNode head)", stub: "return false;",
    solution: "List<Integer> values = new ArrayList<>(); for (ListNode node = head; node != null; node = node.next) values.add(node.val); for (int l = 0, r = values.size() - 1; l < r; l++, r--) if (!values.get(l).equals(values.get(r))) return false; return true;",
    nodeType: "ListNode",
    driver: "int n = sc.nextInt(); Solution.ListNode head = list(readInts(sc, n)); System.out.println(Solution.isPalindrome(head));",
  },
  "merge-two-lists": {
    signature: "static ListNode mergeTwoLists(ListNode list1, ListNode list2)", stub: "return list1;",
    solution: "ListNode dummy = new ListNode(0), tail = dummy;\nwhile (list1 != null && list2 != null) { if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; } else { tail.next = list2; list2 = list2.next; } tail = tail.next; }\ntail.next = list1 != null ? list1 : list2; return dummy.next;",
    nodeType: "ListNode",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); Solution.ListNode a = list(readInts(sc, n)), b = list(readInts(sc, m)); printList(Solution.mergeTwoLists(a, b));",
  },
  "coin-change": {
    signature: "static int coinChange(int[] coins, int amount)", stub: "return -1;",
    solution: "int[] dp = new int[amount + 1]; Arrays.fill(dp, amount + 1); dp[0] = 0;\nfor (int value = 1; value <= amount; value++) for (int coin : coins) if (coin <= value) dp[value] = Math.min(dp[value], dp[value - coin] + 1);\nreturn dp[amount] > amount ? -1 : dp[amount];",
    driver: "int n = sc.nextInt(), amount = sc.nextInt(); int[] coins = readInts(sc, n); System.out.println(Solution.coinChange(coins, amount));",
  },
  "next-greater-element": {
    signature: "static int[] nextGreaterElements(int[] nums)", stub: "return new int[nums.length];",
    solution: "int[] answer = new int[nums.length]; Arrays.fill(answer, -1); Deque<Integer> stack = new ArrayDeque<>();\nfor (int i = 0; i < nums.length; i++) { while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) answer[stack.pop()] = nums[i]; stack.push(i); }\nreturn answer;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printInts(Solution.nextGreaterElements(nums));",
  },
  "group-anagrams": {
    signature: "static List<List<String>> groupAnagrams(String[] strs)", stub: "return new ArrayList<>();",
    solution: "Map<String, List<String>> groups = new LinkedHashMap<>();\nfor (String word : strs) { char[] key = word.toCharArray(); Arrays.sort(key); groups.computeIfAbsent(new String(key), k -> new ArrayList<>()).add(word); }\nreturn new ArrayList<>(groups.values());",
    driver: "int n = sc.nextInt(); sc.nextLine(); String[] strs = new String[n]; for (int i = 0; i < n; i++) strs[i] = sc.nextLine(); printGroups(Solution.groupAnagrams(strs));",
  },
  "three-sum": {
    signature: "static List<List<Integer>> threeSum(int[] nums)", stub: "return new ArrayList<>();",
    solution: "Arrays.sort(nums); List<List<Integer>> answer = new ArrayList<>();\nfor (int i = 0; i < nums.length - 2; i++) { if (i > 0 && nums[i] == nums[i - 1]) continue; int left = i + 1, right = nums.length - 1; while (left < right) { int sum = nums[i] + nums[left] + nums[right]; if (sum == 0) { answer.add(Arrays.asList(nums[i], nums[left], nums[right])); int a = nums[left], b = nums[right]; while (left < right && nums[left] == a) left++; while (left < right && nums[right] == b) right--; } else if (sum < 0) left++; else right--; } }\nreturn answer;",
    driver: "int n = sc.nextInt(); int[] nums = readInts(sc, n); printNestedInts(Solution.threeSum(nums));",
  },
  "connected-components": {
    signature: "static int countComponents(int n, int[][] edges)", stub: "return 0;",
    solution: "List<List<Integer>> graph = new ArrayList<>(); for (int i = 0; i < n; i++) graph.add(new ArrayList<>()); for (int[] e : edges) { graph.get(e[0]).add(e[1]); graph.get(e[1]).add(e[0]); }\nboolean[] seen = new boolean[n]; int components = 0; for (int i = 0; i < n; i++) if (!seen[i]) { components++; visit(graph, seen, i); } return components;",
    helpers: "static void visit(List<List<Integer>> g, boolean[] seen, int v) { if (seen[v]) return; seen[v] = true; for (int next : g.get(v)) visit(g, seen, next); }",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); int[][] edges = new int[m][2]; for (int i = 0; i < m; i++) { edges[i][0] = sc.nextInt(); edges[i][1] = sc.nextInt(); } System.out.println(Solution.countComponents(n, edges));",
  },
  "course-schedule": {
    signature: "static boolean canFinish(int numCourses, int[][] prerequisites)", stub: "return false;",
    solution: "List<List<Integer>> graph = new ArrayList<>(); int[] indegree = new int[numCourses]; for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());\nfor (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indegree[p[0]]++; }\nDeque<Integer> queue = new ArrayDeque<>(); for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) queue.add(i); int done = 0;\nwhile (!queue.isEmpty()) { int v = queue.remove(); done++; for (int next : graph.get(v)) if (--indegree[next] == 0) queue.add(next); }\nreturn done == numCourses;",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); int[][] prerequisites = new int[m][2]; for (int i = 0; i < m; i++) { prerequisites[i][0] = sc.nextInt(); prerequisites[i][1] = sc.nextInt(); } System.out.println(Solution.canFinish(n, prerequisites));",
  },
  "rotting-oranges": {
    signature: "static int orangesRotting(int[][] grid)", stub: "return -1;",
    solution: "int rows = grid.length, cols = grid[0].length, fresh = 0, minutes = 0; Deque<int[]> queue = new ArrayDeque<>();\nfor (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) { if (grid[r][c] == 2) queue.add(new int[]{r, c}); else if (grid[r][c] == 1) fresh++; }\nint[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}}; while (fresh > 0 && !queue.isEmpty()) { int size = queue.size(); minutes++; while (size-- > 0) { int[] p = queue.remove(); for (int[] d : dirs) { int r = p[0] + d[0], c = p[1] + d[1]; if (r >= 0 && c >= 0 && r < rows && c < cols && grid[r][c] == 1) { grid[r][c] = 2; fresh--; queue.add(new int[]{r,c}); } } } } return fresh == 0 ? minutes : -1;",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); int[][] grid = readMatrix(sc, n, m); System.out.println(Solution.orangesRotting(grid));",
  },
  "shortest-path-unweighted": {
    signature: "static int shortestPath(int n, int[][] edges, int source, int target)", stub: "return -1;",
    solution: "List<List<Integer>> graph = new ArrayList<>(); for (int i = 0; i < n; i++) graph.add(new ArrayList<>()); for (int[] e : edges) { graph.get(e[0]).add(e[1]); graph.get(e[1]).add(e[0]); }\nint[] distance = new int[n]; Arrays.fill(distance, -1); Deque<Integer> queue = new ArrayDeque<>(); queue.add(source); distance[source] = 0;\nwhile (!queue.isEmpty()) { int v = queue.remove(); if (v == target) return distance[v]; for (int next : graph.get(v)) if (distance[next] == -1) { distance[next] = distance[v] + 1; queue.add(next); } } return -1;",
    driver: "int n = sc.nextInt(), m = sc.nextInt(); int[][] edges = new int[m][2]; for (int i = 0; i < m; i++) { edges[i][0] = sc.nextInt(); edges[i][1] = sc.nextInt(); } int source = sc.nextInt(), target = sc.nextInt(); System.out.println(Solution.shortestPath(n, edges, source, target));",
  },
  "tree-max-depth": {
    signature: "static int maxDepth(TreeNode root)", stub: "return 0;",
    solution: "if (root == null) return 0; return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));",
    nodeType: "TreeNode",
    driver: "int n = sc.nextInt(); int[] values = readInts(sc, n); System.out.println(Solution.maxDepth(tree(values)));",
  },
  "tree-level-order": {
    signature: "static List<List<Integer>> levelOrder(TreeNode root)", stub: "return new ArrayList<>();",
    solution: "List<List<Integer>> answer = new ArrayList<>(); if (root == null) return answer; Deque<TreeNode> queue = new ArrayDeque<>(); queue.add(root);\nwhile (!queue.isEmpty()) { int size = queue.size(); List<Integer> level = new ArrayList<>(); while (size-- > 0) { TreeNode node = queue.remove(); level.add(node.val); if (node.left != null) queue.add(node.left); if (node.right != null) queue.add(node.right); } answer.add(level); } return answer;",
    nodeType: "TreeNode",
    driver: "int n = sc.nextInt(); int[] values = readInts(sc, n); printTreeLevels(Solution.levelOrder(tree(values)));",
  },
  "invert-binary-tree": {
    signature: "static int[] invertTree(int[] levelOrder)", stub: "return levelOrder;",
    solution: "for (int i = 1; i + 1 < levelOrder.length; i += 2) { int temp = levelOrder[i]; levelOrder[i] = levelOrder[i + 1]; levelOrder[i + 1] = temp; }\nreturn levelOrder;",
    driver: "int n = sc.nextInt(); int[] values = readInts(sc, n); printInts(Solution.invertTree(values));",
  },
  "valid-bst": {
    signature: "static boolean isValidBST(TreeNode root)", stub: "return false;",
    solution: "return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);",
    helpers: "static boolean validate(TreeNode node, long low, long high) { if (node == null) return true; if (node.val <= low || node.val >= high) return false; return validate(node.left, low, node.val) && validate(node.right, node.val, high); }",
    nodeType: "TreeNode",
    driver: "int n = sc.nextInt(); int[] values = readInts(sc, n); System.out.println(Solution.isValidBST(tree(values)));",
  },
  "gas-station": {
    signature: "static int canCompleteCircuit(int[] gas, int[] cost)", stub: "return -1;",
    solution: "int total = 0, tank = 0, start = 0; for (int i = 0; i < gas.length; i++) { int diff = gas[i] - cost[i]; total += diff; tank += diff; if (tank < 0) { start = i + 1; tank = 0; } } return total < 0 ? -1 : start;",
    driver: "int n = sc.nextInt(); int[] gas = readInts(sc, n), cost = readInts(sc, n); System.out.println(Solution.canCompleteCircuit(gas, cost));",
  },
  "range-sum-queries": {
    signature: "static long[] rangeSum(int[] nums, int[][] queries)", stub: "return new long[queries.length];",
    solution: "long[] prefix = new long[nums.length + 1]; for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i]; long[] answer = new long[queries.length]; for (int i = 0; i < queries.length; i++) answer[i] = prefix[queries[i][1] + 1] - prefix[queries[i][0]]; return answer;",
    driver: "int n = sc.nextInt(), q = sc.nextInt(); int[] nums = readInts(sc, n); int[][] queries = new int[q][2]; for (int i = 0; i < q; i++) { queries[i][0] = sc.nextInt(); queries[i][1] = sc.nextInt(); } printLongs(Solution.rangeSum(nums, queries));",
  },
  "minimum-depth-tree": {
    signature: "static int minDepth(TreeNode root)", stub: "return 0;",
    solution: "if (root == null) return 0; Deque<TreeNode> queue = new ArrayDeque<>(); queue.add(root); int depth = 1; while (!queue.isEmpty()) { int size = queue.size(); while (size-- > 0) { TreeNode node = queue.remove(); if (node.left == null && node.right == null) return depth; if (node.left != null) queue.add(node.left); if (node.right != null) queue.add(node.right); } depth++; } return depth;",
    nodeType: "TreeNode",
    driver: "int n = sc.nextInt(); int[] values = readInts(sc, n); System.out.println(Solution.minDepth(tree(values)));",
  },
  "stock-span": {
    signature: "static int[] calculateSpan(int[] prices)", stub: "return new int[prices.length];",
    solution: "int[] span = new int[prices.length]; Deque<Integer> stack = new ArrayDeque<>(); for (int i = 0; i < prices.length; i++) { while (!stack.isEmpty() && prices[stack.peek()] <= prices[i]) stack.pop(); span[i] = stack.isEmpty() ? i + 1 : i - stack.peek(); stack.push(i); } return span;",
    driver: "int n = sc.nextInt(); int[] prices = readInts(sc, n); printInts(Solution.calculateSpan(prices));",
  },
  "pangram": {
    signature: "static boolean checkIfPangram(String sentence)", stub: "return false;",
    solution: "int seen = 0; for (char c : sentence.toLowerCase().toCharArray()) if (c >= 'a' && c <= 'z') seen |= 1 << (c - 'a'); return seen == (1 << 26) - 1;",
    driver: "String sentence = sc.hasNextLine() ? sc.nextLine() : \"\"; System.out.println(Solution.checkIfPangram(sentence));",
  },
};

export const normalizeJavaDraftForQuestion = (question, source) => {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) return source;
  let normalized = source;
  for (const [className, keep] of [["TreeNode", typed.nodeType === "TreeNode"], ["ListNode", typed.nodeType === "ListNode"]]) {
    if (keep) continue;
    const match = new RegExp("^[ \\t]*static[ \\t]+class[ \\t]+" + className + "\\b[^\\n]*\\{", "m").exec(normalized);
    if (!match) continue;
    const open = normalized.indexOf("{", match.index);
    const close = findClosingBrace(normalized, open);
    if (close < 0) continue;
    let end = close + 1;
    if (normalized[end] === "\r") end++;
    if (normalized[end] === "\n") end++;
    normalized = normalized.slice(0, match.index) + normalized.slice(end);
  }
  return normalized;
};

export const isJavaDraftForQuestion = (question, source) => {
  const typed = TYPED_FUNCTIONS[question.id];
  if (typed && (
    source.includes("static class TreeNode") !== (typed.nodeType === "TreeNode")
    || source.includes("static class ListNode") !== (typed.nodeType === "ListNode")
  )) return false;
  return typed ? source.includes(typed.signature) : new RegExp(`\\b${getJavaFunctionName(question)}\\s*\\(`).test(source);
};

export const buildJavaTemplate = (question, { answer = false } = {}) => {
  const name = getJavaFunctionName(question);
  const typed = TYPED_FUNCTIONS[question.id];
  if (typed) {
    if (answer && !typed.solution) return question.solution || "";
    const body = answer ? typed.solution : "// TODO: Write your solution here.\n        " + typed.stub;
    const nodeClass = typed.nodeType === "ListNode"
      ? ["    static class ListNode { int val; ListNode next; ListNode(int val) { this.val = val; } }"]
      : typed.nodeType === "TreeNode"
        ? ["    static class TreeNode { int val; TreeNode left, right; TreeNode(int val) { this.val = val; } }"]
        : [];
    const helperBody = answer && typed.helpers ? typed.helpers.split("\n") : ["// Add helper methods here if you need them."];
    const driverLines = [
      "class Main {",
      "    static int[] readInts(Scanner sc, int n) { int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = sc.nextInt(); return a; }",
      "    static int[][] readMatrix(Scanner sc, int r, int c) { int[][] a = new int[r][c]; for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) a[i][j] = sc.nextInt(); return a; }",
      "    static void printInts(int[] a) { for (int i = 0; i < a.length; i++) { if (i > 0) System.out.print(\" \"); System.out.print(a[i]); } System.out.println(); }",
      "    static void printLongs(long[] a) { for (long value : a) System.out.println(value); }",
      "    static void printChars(char[][] a) { for (char[] row : a) System.out.println(new String(row)); }",
      "    static void printLines(List<?> a) { for (Object v : a) System.out.println(v); }",
      "    static void printNestedInts(List<List<Integer>> a) { for (List<Integer> row : a) { for (int i = 0; i < row.size(); i++) { if (i > 0) System.out.print(\" \"); System.out.print(row.get(i)); } System.out.println(); } }",
      "    static void printGroups(List<List<String>> a) { for (List<String> row : a) System.out.println(String.join(\" \", row)); }",
      ...(typed.nodeType === "ListNode" ? [
        "    static Solution.ListNode list(int[] a) { Solution.ListNode d = new Solution.ListNode(0), t = d; for (int v : a) { t.next = new Solution.ListNode(v); t = t.next; } return d.next; }",
        "    static void printList(Solution.ListNode n) { boolean first = true; while (n != null) { if (!first) System.out.print(\" \"); System.out.print(n.val); first = false; n = n.next; } System.out.println(); }",
      ] : []),
      ...(typed.nodeType === "TreeNode" ? [
        "    static Solution.TreeNode tree(int[] a) { if (a.length == 0 || a[0] == -1) return null; Solution.TreeNode[] nodes = new Solution.TreeNode[a.length]; for (int i = 0; i < a.length; i++) if (a[i] != -1) nodes[i] = new Solution.TreeNode(a[i]); for (int i = 0; i < a.length; i++) if (nodes[i] != null) { int l = 2 * i + 1, r = l + 1; if (l < a.length) nodes[i].left = nodes[l]; if (r < a.length) nodes[i].right = nodes[r]; } return nodes[0]; }",
        "    static void printTreeLevels(List<List<Integer>> levels) { for (List<Integer> row : levels) { for (int i = 0; i < row.size(); i++) { if (i > 0) System.out.print(\" \"); System.out.print(row.get(i)); } System.out.println(); } }",
        "    static void putTree(Solution.TreeNode node, int i, int[] a) { if (node == null || i >= a.length) return; a[i] = node.val; putTree(node.left, 2 * i + 1, a); putTree(node.right, 2 * i + 2, a); }",
        "    static void printTreeArray(Solution.TreeNode node, int n) { int[] a = new int[n]; java.util.Arrays.fill(a, -1); putTree(node, 0, a); printInts(a); }",
      ] : []),
      "    public static void main(String[] args) {",
      "        Scanner sc = new Scanner(System.in);",
      "        " + typed.driver,
      "    }",
      "}",
    ];
    const lines = [
      "import java.util.*;",
      "",
      "class Solution {",
      ...nodeClass,
      "    " + typed.signature + " {",
      "        // BEGIN SOLUTION",
      ...body.split("\n").map(line => "        " + line),
      "        // END SOLUTION",
      "    }",
      "",
      "    // BEGIN HELPERS",
      ...helperBody.map(line => "    " + line),
      "    // END HELPERS",
      "}",
      "",
      "// BEGIN DRIVER",
      ...driverLines,
      "// END DRIVER",
    ];
    return formatJava(lines.join("\n"));
  }
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
