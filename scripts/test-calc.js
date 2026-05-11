// Simulação da lógica do motor de cálculo para validação
const multiplicadorEscala = 2.1071; // 12x36
const piso = 2000;
const gratificacoes = 200;
const assiduidadePct = 5;

// 1. Remuneração Base (RB)
const rb = (piso + gratificacoes) * multiplicadorEscala;

// 2. Base de Encargos
const baseEncargos = rb + (rb * (assiduidadePct / 100));

// 3. Encargos Sociais
const grupoAPct = 20;
const grupoBPct = 10;
const grupoCPct = 5;
const grupoDPct = (grupoAPct / 100) * (grupoBPct / 100) * 100; // Incidência de A sobre B

const custoA = baseEncargos * (grupoAPct / 100);
const custoB = baseEncargos * (grupoBPct / 100);
const custoC = baseEncargos * (grupoCPct / 100);
const custoD = baseEncargos * (grupoDPct / 100);
const totalEncargos = custoA + custoB + custoC + custoD;

// 4. Custo Direto (CD)
const cd = rb + totalEncargos;

// 5. Preço de Venda (Gross-up)
const impostosPct = 15;
const margemPct = 10;
const admPct = 5;
const divisor = 1 - ((impostosPct + margemPct + admPct) / 100);

const precoVenda = cd / divisor;

console.log("=== VALIDAÇÃO DO MOTOR DE CÁLCULO ORSE ===");
console.log(`Remuneração Base (RB): R$ ${rb.toFixed(2)}`);
console.log(`Base de Encargos: R$ ${baseEncargos.toFixed(2)}`);
console.log(`Custo Social Total: R$ ${totalEncargos.toFixed(2)}`);
console.log(`   - Grupo A (20%): R$ ${custoA.toFixed(2)}`);
console.log(`   - Grupo B (10%): R$ ${custoB.toFixed(2)}`);
console.log(`   - Grupo C (5%): R$ ${custoC.toFixed(2)}`);
console.log(`   - Grupo D (A s/ B): R$ ${custoD.toFixed(2)}`);
console.log(`Custo Direto (CD): R$ ${cd.toFixed(2)}`);
console.log(`Preço de Venda (Final): R$ ${precoVenda.toFixed(2)}`);
console.log("-------------------------------------------");
console.log(`DRE Projetada:`);
console.log(`   Faturamento: R$ ${precoVenda.toFixed(2)}`);
console.log(`   Impostos: R$ ${(precoVenda * (impostosPct / 100)).toFixed(2)}`);
console.log(`   Margem Bruta: R$ ${(precoVenda - (precoVenda * (impostosPct / 100)) - cd).toFixed(2)}`);
