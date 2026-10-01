const fs = require('fs');
let s = fs.readFileSync('work/app.js','utf8');

/* 1) 预计算铰链表（避免每帧重建） */
s = s.replace("let drag = null;",
`let drag = null;
const HINGES = buildHinges();      // 展开铰链（只算一次）`);

s = s.replace("unfoldMatrix(hinges[faceGroupOf(c)], unfoldT)", "unfoldMatrix(HINGES[faceGroupOf(c)], unfoldT)");
s = s.replace("unfoldMatrix(hinges[pl.__face], unfoldT)", "unfoldMatrix(HINGES[pl.__face], unfoldT)");

fs.writeFileSync('work/app.js', s);
console.log('hinges fixed');
