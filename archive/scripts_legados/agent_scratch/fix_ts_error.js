const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // Fix the implicit any in the reduce function
  content = content.replace(/reduce\(\(acc, i\) => \{/g, 'reduce((acc: any, i: any) => {');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
