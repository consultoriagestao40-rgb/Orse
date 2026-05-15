
import { calculateLaborCost } from './lib/pricingEngine';

const colab = {
  nomeCargo: 'SERVENTE DE LIMPEZA 44H',
  quantidade: 1,
  escala: '5x2',
  cargo: {
    pisoSalarial: 1900,
    insalubridadePercent: 20
  },
  parametrosPosto: {
    insalubridadePercent: 20
  }
};

const premissas = {
  cctGlobal: {
    insalubridadeBase: 'MINIMO',
    salarioMinimo: 1621,
    encargoInss: 0,
    encargoFgts: 0,
    encargoRat: 0,
    provisFerias: 0,
    provis13: 0,
    provisRescisao: 0
  },
  encargos: {},
  reservaTecnicaPct: 0,
  manutencaoPct: 0
};

const res = calculateLaborCost(colab, premissas);
console.log('--- TESTE DE CALCULO ---');
console.log('Salario Base:', colab.cargo.pisoSalarial);
console.log('Salario Minimo:', premissas.cctGlobal.salarioMinimo);
console.log('Insalubridade (%):', colab.cargo.insalubridadePercent);
console.log('Remuneracao Calculada:', res.remuneracao);
console.log('Esperado:', 1900 + (1621 * 0.2));
