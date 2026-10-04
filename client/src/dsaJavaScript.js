import { TYPED_FUNCTIONS, getJavaFunctionName } from "./dsaJava.js";

const jsType = (type) => type
  .replace(/List<List<Integer>>/g, "number[][]")
  .replace(/List<Integer>/g, "number[]")
  .replace(/List<String>/g, "string[]")
  .replace(/int\[\]\[\]/g, "number[][]")
  .replace(/char\[\]\[\]/g, "string[][]")
  .replace(/String\[\]/g, "string[]")
  .replace(/int\[\]/g, "number[]")
  .replace(/\b(?:long|int)\b/g, "number")
  .replace(/\bString\b/g, "string")
  .replace(/\bboolean\b/g, "boolean");

const jsDriver = (source) => {
  let code = source
    .replace(/Scanner\s+sc\s*=\s*new\s+Scanner\(System\.in\)\s*;?/g, "const sc = new FastScanner();")
    .replace(/System\.out\.println\(/g, "print(")
    .replace(/System\.out\.print\(/g, "write(")
    .replace(/String\[\]\s+(\w+)\s*=\s*new\s+String\[(\w+)\]/g, "const $1 = Array($2).fill(\"\")")
    .replace(/char\[\]\[\]\s+(\w+)\s*=\s*new\s+char\[(\w+)\]\[(\w+)\]/g, "const $1 = Array.from({length:$2},()=>Array($3).fill('0'))")
    .replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(\w+)\]\[2\]/g, "const $1 = Array.from({length:$2},()=>[0,0])")
    .replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[(\w+)\]\[(\w+)\]/g, "const $1 = Array.from({length:$2},()=>Array($3).fill(0))")
    .replace(/(?:int|long)\[\]\s+(\w+)\s*=\s*new\s+(?:int|long)\[(\w+)\]/g, "const $1 = Array($2).fill(0)")
    .replace(/(?:int|long)\[\]\[\]\s+(\w+)\s*=/g, "const $1 =")
    .replace(/(?:int|long|String|char)\[\]\s+(\w+)\s*=/g, "const $1 =")
    .replace(/\bListNode\s+(\w+)\s*=/g, "const $1 =")
    .replace(/\bTreeNode\s+(\w+)\s*=/g, "const $1 =")
    .replace(/(?:int|long|String|char)\[\]\[\]\s+(\w+)\s*=/g, "const $1 =")
    .replace(/(?:int|long|String|char)\[\]\s+(\w+)\s*=/g, "const $1 =")
    .replace(/readInts\(sc,\s*([^)]*)\)/g, "readInts(sc, $1)")
    .replace(/readMatrix\(sc,\s*([^,)]*),\s*([^)]*)\)/g, "readMatrix(sc, $1, $2)")
    .replace(/sc\.hasNextLine\(\)\s*\?\s*sc\.nextLine\(\)\s*:\s*""/g, "sc.nextLineOrEmpty()")
    .replace(/sc\.hasNext\(\)\s*\?\s*sc\.next\(\)\s*:\s*""/g, "sc.nextOrEmpty()")
    .replace(/sc\.nextInt\(\)/g, "sc.nextInt()")
    .replace(/sc\.nextLong\(\)/g, "sc.nextInt()")
    .replace(/sc\.nextLine\(\)/g, "sc.nextLine()")
    .replace(/sc\.next\(\)\.toCharArray\(\)/g, "Array.from(sc.next())")
    .replace(/sc\.next\(\)\.charAt\(0\)/g, "sc.next()[0]")
    .replace(/sc\.next\(\)/g, "sc.next()")
    .replace(/Solution\.(?:ListNode|TreeNode)\s+(\w+)\s*=/g, "const $1 =")
    .replace(/Solution\./g, "Solution.")
    .replace(/Solution\.ListNode/g, "ListNode")
    .replace(/Solution\.TreeNode/g, "TreeNode")
    .replace(/\.size\(\)/g, ".length")
    .replace(/String\.join\(" ",\s*(\w+)\)/g, '($1).join(" ")')
    .replace(/\bint\s+(\w+)\s*=/g, "let $1 =")
    .replace(/\bString\s+(\w+)\s*=/g, "let $1 =")
    .replace(/\bchar\s+(\w+)\s*=/g, "let $1 =")
    .replace(/for\s*\(int\s+/g, "for (let ")
    .replace(/\b(?:int|long|boolean|String|char)\s+(\w+)\s*=/g, "let $1 =")
    .replace(/\b(?:int|long|boolean|String|char)\s+(\w+)\s*,\s*(\w+)\s*=/g, "let $1 =")
    .replace(/\bnull\b/g, "null");
  code = code.replace(/Solution\.const\s+(\w+)/g, "const $1");
  code = code.replace(/;\s*$/, "");
  return code;
};

const jsHelpers = (nodeType) => [
  "class FastScanner { constructor(){ this.data = require('fs').readFileSync(0,'utf8'); this.pos = 0; } next(){ while(this.pos < this.data.length && /\\s/.test(this.data[this.pos])) this.pos++; const start=this.pos; while(this.pos < this.data.length && !/\\s/.test(this.data[this.pos])) this.pos++; return this.data.slice(start,this.pos); } nextInt(){ const token=this.next(); return token ? Number(token) : 0; } nextOrEmpty(){ return this.next(); } nextLine(){ const start=this.pos; while(this.pos<this.data.length && this.data[this.pos]!=='\\n') this.pos++; const line=this.data.slice(start,this.pos).replace(/\\r$/,''); if(this.data[this.pos]==='\\n') this.pos++; return line; } nextLineOrEmpty(){ return this.nextLine(); } }",
  "function print(value=''){ if (typeof value === 'boolean') console.log(value ? 'true' : 'false'); else if (Array.isArray(value)) console.log(value.join(' ')); else console.log(value ?? ''); }",
  "function write(value=''){ process.stdout.write(String(value ?? '')); }",
  "function readInts(sc,n){ return Array.from({length:Math.max(0,n)},()=>sc.nextInt()); }",
  "function readMatrix(sc,r,c){ return Array.from({length:r},()=>readInts(sc,c)); }",
  "function printInts(values){ print(values); }",
  "function printLongs(values){ for(const value of values) print(value); }",
  "function printChars(rows){ for(const row of rows) print(row.join('')); }",
  "function printLines(values){ for(const value of values) print(value); }",
  "function printNestedInts(rows){ for(const row of rows) printInts(row); }",
  "function printGroups(rows){ for(const row of rows) print(row.join(' ')); }",
  ...(nodeType === "ListNode" ? [
    "class ListNode { constructor(val){ this.val=val; this.next=null; } }",
    "function list(values){ const dummy=new ListNode(0); let tail=dummy; for(const value of values){ tail.next=new ListNode(value); tail=tail.next; } return dummy.next; }",
    "function printList(node){ const values=[]; while(node){ values.push(node.val); node=node.next; } print(values); }",
  ] : []),
  ...(nodeType === "TreeNode" ? [
    "class TreeNode { constructor(val){ this.val=val; this.left=null; this.right=null; } }",
    "function tree(values){ if(!values.length || values[0]===-1) return null; const nodes=values.map(v=>v===-1?null:new TreeNode(v)); for(let i=0;i<nodes.length;i++) if(nodes[i]){ const l=2*i+1,r=l+1; if(l<nodes.length) nodes[i].left=nodes[l]; if(r<nodes.length) nodes[i].right=nodes[r]; } return nodes[0]; }",
    "function printTreeLevels(rows){ printNestedInts(rows); }",
  ] : []),
].join("\n");

const jsStub = (stub) => stub
  .replace(/new\s+(?:ArrayList|LinkedList)<[^>]+>\(\)/g, "[]")
  .replace(/new\s+int\[\s*[^\]]*\s*\]/g, "[]")
  .replace(/\bfalse\b/g, "false")
  .replace(/\bnull\b/g, "null");

export function buildJavaScriptTemplate(question) {
  const typed = TYPED_FUNCTIONS[question.id];
  if (!typed) throw new Error(`No typed DSA specification for ${question.id}`);
  const signature = /^(?:static\s+)?(.+?)\s+\w+\s*\((.*)\)$/.exec(typed.signature);
  const methodName = /^(?:static\s+)?(.+?)\s+(\w+)\s*\((.*)\)$/.exec(typed.signature)?.[2] || getJavaFunctionName(question);
  const params = (signature?.[2] || "").split(/,\s*/).filter(Boolean).map((part) => part.trim().split(/\s+/).at(-1));
  const result = jsType(signature?.[1] || "void");
  const stub = jsStub(typed.stub);
  const nodeClass = typed.nodeType === "ListNode" ? "class ListNode { constructor(val){ this.val=val; this.next=null; } }\n" : typed.nodeType === "TreeNode" ? "class TreeNode { constructor(val){ this.val=val; this.left=null; this.right=null; } }\n" : "";
  return `${jsHelpers(typed.nodeType)}\n\n${nodeClass}class Solution {\n    static ${methodName}(${params.join(", ")}) {\n        // BEGIN SOLUTION\n        // TODO: Write your solution here.\n        ${stub}\n        // END SOLUTION\n    }\n\n    // BEGIN HELPERS\n    // Add helper methods here if needed.\n    // END HELPERS\n}\n\n// BEGIN DRIVER\nconst sc = new FastScanner();\n${jsDriver(typed.driver)}\n// END DRIVER`;
}

