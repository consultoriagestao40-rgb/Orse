const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // Replace all instances of (acc, i) => in reduce
  // We use a regex that handles potential whitespace
  content = content.replace(/reduce\(\s*\(\s*acc\s*,\s*i\s*\)\s*=>/g, 'reduce((acc: any, i: any) =>');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
