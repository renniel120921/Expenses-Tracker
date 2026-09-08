const fs = require("node:fs");
const path = require("node:path");
const parser = require("@babel/parser");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith(".html"));
const jsFiles = [
  ...fs.readdirSync(root).filter(name => name.endsWith(".js")),
  ...fs.readdirSync(path.join(root, "components"))
    .filter(name => name.endsWith(".js") && name !== "smoke_test.js")
    .map(name => `components/${name}`),
];
const failures = [];
let parsed = 0;

function parse(code, file, jsx = false) {
  try {
    parser.parse(code, { sourceType: "unambiguous", plugins: jsx ? ["jsx"] : [] });
    parsed += 1;
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

for (const file of jsFiles) {
  parse(fs.readFileSync(path.join(root, file), "utf8"), file, file.startsWith("components/"));
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRe.exec(source))) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    parse(match[2], `${file}:inline`, /text\/babel/i.test(match[1]));
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`PASS: parsed ${parsed} JavaScript, module, and inline JSX blocks across ${htmlFiles.length} pages.`);
