const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Resetando temporariamente para o original do Git...");
execSync('git checkout d66bdf8 -- app/propostas/nova/page.tsx');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const idxStyle = content.indexOf('<style>');
const idxMainClose = content.lastIndexOf('</main>');
const idxPrintSlideDeck = content.indexOf('<div className="print-slide-deck');

console.log("Índices no original:");
console.log("- <style>:", idxStyle);
console.log("- <div className=\"print-slide-deck\":", idxPrintSlideDeck);
console.log("- </main>:", idxMainClose);
