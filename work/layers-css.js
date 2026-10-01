const fs = require('fs');
let s = fs.readFileSync('work/part1.html','utf8');
s = s.replace(`.cubie{`,
`.layer{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}
.cubie{`);
fs.writeFileSync('work/part1.html', s);
console.log('layer css added');
