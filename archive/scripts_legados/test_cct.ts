import { createCCT } from './app/ccts/actions';

async function test() {
  try {
    await createCCT({
      nome: 'Teste',
      uf: 'PR',
      cidade: 'Curitiba',
      vigenciaInicio: '2026-02-01',
      vigenciaFim: '2027-01-31',
      vaValor: 900,
      vaTipo: 'DIARIO',
      vaDescPercent: 20,
      vaProvisFerias: false,
      vtValor: 12,
      vtDescPercent: 6,
      cestaBasica: 0,
      examesMedicos: 0,
      seguroVida: 0,
      uniformeEpi: 0,
      provisFerias: 11.11,
      provis13: 8.33,
      encargoInss: 20,
      encargoFgts: 8,
      pis: 0.65,
      cofins: 3,
      iss: 5,
      margemLucro: 10,
      taxaAdm: 5,
      cargos: [
        { id: '1', nome: 'Limpeza', pisoSalarial: 1900, gratificacoes: 0, assiduidade: 0, adicionalCopa: 0 }
      ]
    });
    console.log("SUCESSO!");
  } catch (e: any) {
    console.error("ERRO:", e.message);
  }
}

test();
