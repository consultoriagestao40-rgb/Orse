const estilo = {
  normal: 'normal',
  monetario: 'monetario',
  porcentagem: 'porcentagem'
};

function escreverCentenas(n: number): string {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const especiais = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  if (n === 100) return "cem";

  let c = Math.floor(n / 100);
  let d = Math.floor((n % 100) / 10);
  let u = n % 10;

  let partes: string[] = [];

  if (c > 0) partes.push(centenas[c]);

  if (d === 1) {
    partes.push(especiais[u]);
  } else {
    if (d > 0) partes.push(dezenas[d]);
    if (u > 0) partes.push(unidades[u]);
  }

  return partes.join(" e ");
}

function escreverMilhares(n: number): string {
  if (n === 0) return "zero";
  
  const partes: string[] = [];
  
  // Bilhões
  const bilhoes = Math.floor(n / 1000000000);
  n %= 1000000000;
  if (bilhoes > 0) {
    partes.push(bilhoes === 1 ? "um bilhão" : `${escreverCentenas(bilhoes)} bilhões`);
  }
  
  // Milhões
  const milhoes = Math.floor(n / 1000000);
  n %= 1000000;
  if (milhoes > 0) {
    partes.push(milhoes === 1 ? "um milhão" : `${escreverCentenas(milhoes)} milhões`);
  }

  // Milhares
  const milhares = Math.floor(n / 1000);
  n %= 1000;
  if (milhares > 0) {
    partes.push(milhares === 1 ? "mil" : `${escreverCentenas(milhares)} mil`);
  }

  // Centenas
  if (n > 0) {
    partes.push(escreverCentenas(n));
  }

  // Join parts with 'e' or punctuation
  return partes.join(" e ");
}

export function porExtenso(numero: number, estiloTipo: string = 'normal'): string {
  if (numero === 0) return estiloTipo === 'monetario' ? 'zero reais' : 'zero';

  // Extract decimals
  const valorInteiro = Math.floor(numero);
  const centavos = Math.round((numero - valorInteiro) * 100);

  if (estiloTipo === 'monetario') {
    let resultado = '';
    if (valorInteiro > 0) {
      const extensoInteiro = escreverMilhares(valorInteiro);
      const unidadeReal = valorInteiro === 1 ? 'real' : 'reais';
      resultado += `${extensoInteiro} ${unidadeReal}`;
    }
    if (centavos > 0) {
      const extensoCentavos = escreverCentenas(centavos);
      const unidadeCentavo = centavos === 1 ? 'centavo' : 'centavos';
      if (resultado.length > 0) {
        resultado += ` e ${extensoCentavos} ${unidadeCentavo}`;
      } else {
        resultado += `${extensoCentavos} ${unidadeCentavo}`;
      }
    }
    return resultado;
  }

  if (estiloTipo === 'porcentagem') {
    const extensoInteiro = escreverMilhares(valorInteiro);
    if (centavos > 0) {
      return `${extensoInteiro} vírgula ${escreverCentenas(centavos)} por cento`;
    }
    return `${extensoInteiro} por cento`;
  }

  const extensoInteiro = escreverMilhares(valorInteiro);
  if (centavos > 0) {
    return `${extensoInteiro} vírgula ${escreverCentenas(centavos)}`;
  }
  return extensoInteiro;
}

const numeroPorExtenso = {
  porExtenso,
  estilo
};

export default numeroPorExtenso;
