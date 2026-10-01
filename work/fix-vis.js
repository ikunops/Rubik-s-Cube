const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');
s = s.replace(`.view-swap .pane{transition:opacity .34s ease,transform .34s ease}
.view-swap .pane.hidden{opacity:0;pointer-events:none;position:absolute;inset:0;transform:scale(.96)}`,
`.view-swap{min-height:120px}
.view-swap .pane{transition:opacity .30s ease,transform .30s ease}
.view-swap .pane.hidden{opacity:0;pointer-events:none;position:absolute;inset:0;
  transform:scale(.97);visibility:hidden}`);
fs.writeFileSync('work/part1.html', s);
console.log('css visibility fixed');
