const fs = require('fs');

const oldFpv = fs.readFileSync('old_fpv_utf8.tsx', 'utf8');
const propostaFile = fs.readFileSync('components/PropostaApresentacao.tsx', 'utf8');

// The print-slide-deck in old_fpv_utf8.tsx starts at line 5427 and ends around 6605
const startIndex = oldFpv.indexOf('<div className={`print-slide-deck hidden ${viewMode === \'slide\' ? \'print:block\' : \'\'}`}>');

// Find the end of it (it ends before `</div> // Fim do flex-1`)
let endIndex = oldFpv.indexOf('</div>\n        </div>\n      )}', startIndex);
if (endIndex === -1) {
    // try another heuristic
    endIndex = oldFpv.lastIndexOf('</div>', oldFpv.lastIndexOf('</div>', oldFpv.length - 20));
}

// Let's just extract it via Regex from `<div className={\`print-slide-deck hidden ...` up to the closing tag of that div.
// It's a very long string, so it's better to just do string manipulation.
const startTag = '<div className={`print-slide-deck hidden ${viewMode === \'slide\' ? \'print:block\' : \'\'}`}>';
const startPos = oldFpv.indexOf(startTag);

// we know it ends right before `</div>\n      {/* Fim do Main Content */}`
const endPos = oldFpv.indexOf('</div>\n      {/* Fim do Main Content */}');
let printDeckBlock = oldFpv.substring(startPos, endPos);

// In the old code, viewMode was used. In PropostaApresentacao, we don't have viewMode. We can just use `hidden print:block`.
printDeckBlock = printDeckBlock.replace('className={`print-slide-deck hidden ${viewMode === \'slide\' ? \'print:block\' : \'\'}`}', 'className="print-slide-deck hidden print:block"');

// Replace formatCurrency, we have it in PropostaApresentacao as formatCurrency
// Check variables: `margemBrutaMensal` etc. were used in slide 10 (DRE).
// Wait, PropostaApresentacao does NOT have slide 10 of old_fpv (DRE).
// Let's see if the print-slide-deck has slide 10.
// Yes, it has {/* SLIDE 10 PRINT - DRE */}. But `margemBrutaMensal` doesn't exist!
// So we must comment out or remove slide 10, or provide dummy variables, or just remove slide 10 because presentation doesn't use DRE.
// The DRE slide was slide 10, but the presentation in the screenshot has 13 slides. Wait, does the presentation have a DRE slide?
// No, the presentation slides are 1 to 13.
// Let's check old_fpv_utf8.tsx for `.print-slide` count.
let slideCount = (printDeckBlock.match(/className="print-slide/g) || []).length;
console.log("Found slides:", slideCount);

// Because I need to be 100% sure it works, I will restore `PropostaApresentacao.tsx` to the EXACT state of `git checkout 1a000cc`, and then APPEND the `print-slide-deck`!
