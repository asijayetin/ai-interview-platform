import { TYPED_FUNCTIONS, getJavaFunctionName } from "./dsaJava.js";

const csType = (type) => type
  .replace(/List<List<Integer>>/g, "List<List<int>>")
  .replace(/List<Integer>/g, "List<int>")
  .replace(/List<String>/g, "List<string>")
  .replace(/int\[\]\[\]/g, "int[][]")
  .replace(/char\[\]\[\]/g, "char[][]")
  .replace(/String\[\]/g, "string[]")
  .replace(/int\[\]/g, "int[]")
  .replace(/\bString\b/g, "string")
  .replace(/\bboolean\b/g, "bool")
  .replace(/\blong\b/g, "long");

const csDriver = (source) => source
  .replace(/Scanner\s+sc\s*=\s*new\s+Scanner\(System\.in\)\s*;?/g, "var sc = new FastScanner();")
  .replace(/System\.out\.println\(/g, "Print(")
  .replace(/System\.out\.print\(/g, "Write(")
  .replace(/String\[\]\s+(\w+)\s*=\s*new\s+String\[(\w+)\]/g, "string[] $1 = new string[$2]")
  .replace(/char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[(\w+)\]\[(\w+)\]/g, "char[][] $1 = Enumerable.Range(0,$2).Select(_=>new char[$3]).ToArray()")
  .replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(\w+)\]\[2\]/g, "int[][] $1 = Enumerable.Range(0,$2).Select(_=>new int[2]).ToArray()")
  .replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(\w+)\]\[(\w+)\]/g, "int[][] $1 = Enumerable.Range(0,$2).Select(_=>new int[$3]).ToArray()")
  .replace(/int\[\]\s+(\w+)\s*=\s*new\s+int\[(\w+)\]/g, "int[] $1 = new int[$2]")
  .replace(/readInts\(sc,\s*([^)]*)\)/g, "ReadInts(sc, $1)")
  .replace(/readMatrix\(sc,\s*([^,)]*),\s*([^)]*)\)/g, "ReadMatrix(sc, $1, $2)")
  .replace(/sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "sc.NextLineOrEmpty()")
  .replace(/sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "sc.NextOrEmpty()")
  .replace(/sc\.nextInt\(\)/g, "sc.NextInt()")
  .replace(/sc\.nextLong\(\)/g, "sc.NextLong()")
  .replace(/sc\.nextLine\(\)/g, "sc.NextLine()")
  .replace(/sc\.next\(\)\.toCharArray\(\)/g, "sc.Next().ToCharArray()")
  .replace(/sc\.next\(\)\.charAt\(0\)/g, "sc.Next()[0]")
  .replace(/sc\.next\(\)/g, "sc.Next()")
  .replace(/Solution\.ListNode/g, "ListNode")
  .replace(/Solution\.TreeNode/g, "TreeNode")
  .replace(/\.length\b/g, ".Length")
  .replace(/\.size\(\)/g, ".Count")
  .replace(/String\.join\(" ",\s*(\w+)\)/g, 'string.Join(" ", $1)')
  .replace(/\bListNode\s+(\w+)\s*=\s*list\(/g, "ListNode $1 = List(")
  .replace(/\bTreeNode\s+(\w+)\s*=\s*tree\(/g, "TreeNode $1 = Tree(")
  .replace(/\blist\(/g, "List(")
  .replace(/\btree\(/g, "Tree(")
  .replace(/\bint\s+(\w+)\s*=\s*Solution\./g, "int $1 = Solution.")
  .replace(/\bSolution\.(\w+)\(/g, "Solution.$1(")
  .replace(/printInts\(/g, "PrintInts(")
  .replace(/printLongs\(/g, "PrintLongs(")
  .replace(/printChars\(/g, "PrintChars(")
  .replace(/printLines\(/g, "PrintLines(")
  .replace(/printNestedInts\(/g, "PrintNestedInts(")
  .replace(/printGroups\(/g, "PrintGroups(")
  .replace(/printTreeLevels\(/g, "PrintTreeLevels(")
  .replace(/printList\(/g, "PrintList(")
  .replace(/\bboolean\b/g, "bool")
  .replace(/\bString\b/g, "string");

const csHelpers = (nodeType) => [
  "sealed class FastScanner { readonly string data=Console.In.ReadToEnd(); int pos=0; public string Next(){while(pos<data.Length&&char.IsWhiteSpace(data[pos]))pos++;int start=pos;while(pos<data.Length&&!char.IsWhiteSpace(data[pos]))pos++;return data.Substring(start,pos-start);} public string NextOrEmpty()=>Next(); public int NextInt()=>int.TryParse(Next(),out var value)?value:0; public long NextLong()=>long.TryParse(Next(),out var value)?value:0L; public string NextLine(){int start=pos;while(pos<data.Length&&data[pos]!='\\n')pos++;string line=data.Substring(start,pos-start).TrimEnd('\\r');if(pos<data.Length)pos++;return line;} public string NextLineOrEmpty()=>NextLine(); }",
  "static void Print(object value) { if(value is bool b) Console.WriteLine(b ? \"true\" : \"false\"); else if(value is Array a) Console.WriteLine(string.Join(\" \", a.Cast<object>())); else Console.WriteLine(value ?? \"\"); }",
  "static void Write(object value) => Console.Write(value ?? \"\");",
  "static int[] ReadInts(FastScanner sc,int n){var a=new int[Math.Max(0,n)];for(int i=0;i<a.Length;i++)a[i]=sc.NextInt();return a;}",
  "static int[][] ReadMatrix(FastScanner sc,int r,int c){var a=new int[r][];for(int i=0;i<r;i++)a[i]=ReadInts(sc,c);return a;}",
  "static void PrintInts(int[] a){Console.WriteLine(string.Join(\" \",a));}",
  "static void PrintLongs(long[] a){foreach(var value in a)Print(value);}",
  "static void PrintChars(char[][] a){foreach(var row in a)Console.WriteLine(new string(row));}",
  "static void PrintLines<T>(IEnumerable<T> values){foreach(var value in values)Print(value);}",
  "static void PrintNestedInts(IEnumerable<IEnumerable<int>> rows){foreach(var row in rows)PrintInts(row.ToArray());}",
  "static void PrintGroups(IEnumerable<IEnumerable<string>> rows){foreach(var row in rows)Console.WriteLine(string.Join(\" \",row));}",
  ...(nodeType === "ListNode" ? [
    "static ListNode List(int[] values){var dummy=new ListNode(0);var tail=dummy;foreach(var value in values){tail.next=new ListNode(value);tail=tail.next;}return dummy.next;}",
    "static void PrintList(ListNode node){var values=new List<int>();while(node!=null){values.Add(node.val);node=node.next;}PrintInts(values.ToArray());}",
  ] : []),
  ...(nodeType === "TreeNode" ? [
    "static TreeNode Tree(int[] values){if(values.Length==0||values[0]==-1)return null;var nodes=values.Select(v=>v==-1?null:new TreeNode(v)).ToArray();for(int i=0;i<nodes.Length;i++)if(nodes[i]!=null){int l=2*i+1,r=l+1;if(l<nodes.Length)nodes[i].left=nodes[l];if(r<nodes.Length)nodes[i].right=nodes[r];}return nodes[0];}",
    "static void PrintTreeLevels(List<List<int>> rows){foreach(var row in rows)PrintInts(row.ToArray());}",
  ] : []),
].join("\n    ");

const csStub = (stub) => stub
  .replace(/new\s+(?:ArrayList|LinkedList)<[^>]+>\(\)/g, "new List<int>()")
  .replace(/new\s+int\[\s*[^\]]*\s*\]/g, "Array.Empty<int>()")
  .replace(/\bnull\b/g, "null")
  .replace(/\bfalse\b/g, "false")
  .replace(/\btrue\b/g, "true");

export function buildCsharpTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const signatureMatch = /^(?:static\s+)?(.+?)\s+\w+\s*\((.*)\)$/.exec(typed.signature);
  const methodName = /^(?:static\s+)?(.+?)\s+(\w+)\s*\((.*)\)$/.exec(typed.signature)?.[2] || getJavaFunctionName(question);
  const returnType = csType(signatureMatch?.[1] || "void");
  const parameters = (signatureMatch?.[2] || "").split(/,\s*/).filter(Boolean).map((part) => part.replace(/\bString\b/g, "string").replace(/\bboolean\b/g, "bool"));
  const nodeClass = typed.nodeType === "ListNode" ? "class ListNode { public int val; public ListNode next; public ListNode(int value){val=value;} }\n" : typed.nodeType === "TreeNode" ? "class TreeNode { public int val; public TreeNode left,right; public TreeNode(int value){val=value;} }\n" : "";
  const stub = csStub(typed.stub);
  const driver = csDriver(typed.driver);
  return `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n${nodeClass}class Solution {\n    public static ${returnType} ${methodName}(${parameters.join(", ")}) {\n        // BEGIN SOLUTION\n        // TODO: Write your solution here.\n        ${stub}\n        // END SOLUTION\n    }\n\n    // BEGIN HELPERS\n    // Add helper methods here if needed.\n    // END HELPERS\n}\n\n// BEGIN DRIVER\nclass Program {\n    ${csHelpers(typed.nodeType)}\n    static void Main(){\n        var sc = new FastScanner();\n        ${driver.replace(/\n/g, "\n        ")}\n    }\n}\n// END DRIVER`;
}

