const fs = require('fs');
const path = 'app/ccts/actions.ts';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // Remove vaSobreFerias from both createCCT and updateCCT
  content = content.replace(/vaSobreFerias: Number\(cctData\.vaSobreFerias\) \|\| 0,/g, '');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
