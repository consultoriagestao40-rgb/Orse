const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Resetando page.tsx para o original do Git...");
execSync('git checkout d66bdf8 -- app/propostas/nova/page.tsx');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const originalContent = fs.readFileSync(pagePath, 'utf8');

// Mapear as âncoras originais
const idx03Screen = originalContent.indexOf('{/* SLIDE 03 (NOSSA PRESENÇA - QUEM SOMOS E COBERTURA SUL) */}');
const idx07Screen = originalContent.indexOf('{/* SLIDE 07 (PRINCIPAIS FERRAMENTAS - DIVIDIDO LADO A LADO) */}');
const idx09Screen = originalContent.indexOf('{/* SLIDE 04 (QUADRO EFETIVO - TABELA AUTOMÁTICA DA ABA 4) */}');
const idxComercialScreenEnd = originalContent.indexOf('{/* CONTROLES DE NAVEGAÇÃO DOS SLIDES (PADRONIZADOS FORA DO SLIDE E DO NÚMERO) */}');
const idx03Print = originalContent.indexOf('{/* SLIDE 03 PRINT - NOSSA PRESENÇA / QUEM SOMOS */}');
const idx07Print = originalContent.indexOf('{/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}');
const idx09Print = originalContent.indexOf('{/* SLIDE 09 PRINT - QUADRO EFETIVO */}');
const idx13PrintEnd = originalContent.lastIndexOf('</main>');

// Exibir os 100 caracteres antes e depois de cada ponto de corte original
console.log("\n=== ANÁLISE DE CORTES ORIGINAIS ===");
console.log("\nCut 09Screen:");
console.log("Antes:", JSON.stringify(originalContent.substring(idx09Screen - 100, idx09Screen)));
console.log("Depois:", JSON.stringify(originalContent.substring(idx09Screen, idx09Screen + 100)));

console.log("\nCut ComercialScreenEnd:");
console.log("Antes:", JSON.stringify(originalContent.substring(idxComercialScreenEnd - 100, idxComercialScreenEnd)));
console.log("Depois:", JSON.stringify(originalContent.substring(idxComercialScreenEnd, idxComercialScreenEnd + 100)));

console.log("\nCut 09Print:");
console.log("Antes:", JSON.stringify(originalContent.substring(idx09Print - 100, idx09Print)));
console.log("Depois:", JSON.stringify(originalContent.substring(idx09Print, idx09Print + 100)));

console.log("\nCut 13PrintEnd:");
console.log("Antes:", JSON.stringify(originalContent.substring(idx13PrintEnd - 100, idx13PrintEnd)));
console.log("Depois:", JSON.stringify(originalContent.substring(idx13PrintEnd, idx13PrintEnd + 100)));
