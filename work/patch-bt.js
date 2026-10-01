const fs = require('fs');
let s = fs.readFileSync('work/browser-test.js','utf8');
s = s.replace("const browser = await chromium.launch();",
  "const browser = await chromium.launch({ executablePath: 'C:/Users/31807/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });");
fs.writeFileSync('work/browser-test.js', s);
console.log('patched executablePath');
