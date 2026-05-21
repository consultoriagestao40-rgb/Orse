const fs = require('fs');
let content = fs.readFileSync('app/propostas/nova/page.tsx', 'utf8');
content = content.replace(/Number\(e\.target\.value\)/g, "(e.target.value === '' ? '' : Number(e.target.value))");
fs.writeFileSync('app/propostas/nova/page.tsx', content);
console.log('Done replacing Number(e.target.value)');
