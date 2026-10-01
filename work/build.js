const fs = require('fs');
const p1 = fs.readFileSync('work/part1.html','utf8');
const p2 = fs.readFileSync('work/part2.html','utf8');
const core = fs.readFileSync('work/cube-core.js','utf8');
const model = fs.readFileSync('work/cube-model.js','utf8');
const app = fs.readFileSync('work/app.js','utf8');

/* 去掉 model 里的 module.exports（浏览器用不到） */
const modelClean = model.replace(/if \(typeof module[\s\S]*$/, '').trim();

const html = [
  p1,
  p2,
  '/* ===== 核心数学库 ===== */',
  core,
  '/* ===== 模型层 ===== */',
  modelClean,
  '/* ===== 应用层 ===== */',
  app,
  '</script>',
  '</body>',
  '</html>',
].join('\n');

fs.writeFileSync('outputs/electronic-cube.html', html);
console.log('built:', html.length, 'bytes');

/* 语法检查：抽出 <script> 内容用 node --check */
const m = html.match(/<script>([\s\S]*)<\/script>/);
fs.writeFileSync('work/_syntax.js', m[1]);
