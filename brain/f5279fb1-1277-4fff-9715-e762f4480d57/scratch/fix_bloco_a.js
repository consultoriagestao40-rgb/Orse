const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/Total do Montante "A"/g, 'Total do Montante "A" (Bloco A)');
content = content.replace(/formatCurrency\(\(resultado\?\.items\?\.reduce\(\(acc: any, i: any\) => acc \+ \(\(i\.detalhes\?\.remuneracao \|\| 0\) \* i\.quantidade\), 0\) \|\| 0\) \+ \(resultado\?\.items\?\.reduce\(\(acc: any, i: any\) => acc \+ \(\(i\.detalhes\?\.encargos \|\| 0\) \* i\.quantidade\), 0\) \|\| 0\)\)/g, 'formatCurrency(resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.blocoA || 0) * i.quantidade), 0) || 0)');

fs.writeFileSync(path, content, 'utf8');
console.log('Success');
