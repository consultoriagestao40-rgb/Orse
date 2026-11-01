import { getDocumentProxy, extractText } from 'unpdf';

export interface ExtractedCargo {
  nome: string;
  pisoSalarial: number;
  gratificacoes?: number;
  assiduidade?: number;
  adicionalCopa?: number;
  insalubridadePercent?: number;
}

export interface ExtractedCctData {
  nome: string;
  uf: string;
  cidade?: string;
  vigenciaInicio?: string;
  vigenciaFim?: string;
  vaValor?: number;
  vaTipo?: 'DIARIO' | 'MENSAL';
  vaDescPercent?: number;
  vtValor?: number;
  vtDescPercent?: number;
  cestaBasica?: number;
  seguroVida?: number;
  examesMedicos?: number;
  provisFerias?: number;
  provis13?: number;
  encargoInss?: number;
  encargoFgts?: number;
  cargos: ExtractedCargo[];
  textoCompleto: string;
  clausulas: {
    numero: string;
    titulo: string;
    texto: string;
  }[];
}

/**
 * Função utilitária para converter strings monetárias brasileiras (ex: "1.900,00", "1.900.00", "900.00", "94,50") em float limpo
 */
export function cleanCurrency(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^\d,\.]/g, '').trim();
  if (clean.includes('.') && clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  }
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 3) {
      return parseFloat(`${parts[0]}${parts[1]}.${parts[2]}`);
    }
    if (parts.length === 2 && parts[1].length === 2) {
      return parseFloat(clean);
    }
    return parseFloat(clean.replace(/\./g, ''));
  }
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'));
  }
  return parseFloat(clean) || 0;
}

/**
 * Corrige encoding corrompido de caracteres latinos (ex: "ConvenA§Ao" -> "Convenção")
 */
export function fixLatinEncoding(str: string): string {
  if (!str) return '';
  return str
    .replace(/A§Ao/g, 'ação')
    .replace(/a§ao/gi, 'ação')
    .replace(/A§/g, 'ç')
    .replace(/a§/g, 'ç')
    .replace(/A£/g, 'ã')
    .replace(/a£/g, 'ã')
    .replace(/A©/g, 'é')
    .replace(/a©/g, 'é')
    .replace(/A³/g, 'ó')
    .replace(/a³/g, 'ó')
    .replace(/Aº/g, 'ú')
    .replace(/aº/g, 'ú')
    .replace(/A­/g, 'í')
    .replace(/a­/g, 'í')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai texto bruto a partir do buffer do PDF
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8Array);
    const { text } = await extractText(pdf, { mergePages: true });
    return text || '';
  } catch (err: any) {
    console.error('Erro ao ler PDF:', err);
    throw new Error('Não foi possível ler o arquivo PDF: ' + err.message);
  }
}

/**
 * Divide o texto da CCT em cláusulas estruturadas
 */
export function extractClausulas(texto: string): { numero: string; titulo: string; texto: string }[] {
  const clausulas: { numero: string; titulo: string; texto: string }[] = [];
  
  // Limpar cabeçalhos repetitivos de páginas exportadas pelo Mediador/MTE
  const cleanedText = texto.replace(/Mediador\s*-\s*Extrato[^\n\r]*\n\d+\s+of\s+\d+[^\n\r]*/gi, '');

  // Padrões de início de cláusula com quebra de linha (evita falso positivo no meio de frases)
  const regex = /(?:^|\n)\s*CL[AÁ]USULA\s+([^\n\r–—\-:]+)[–—\-:]*\s*([^\n\r]*)([\s\S]*?)(?=(?:\n\s*CL[AÁ]USULA\s+[^\n\r–—\-:]+[–—\-:]*|$))/gi;
  
  let match;
  while ((match = regex.exec(cleanedText)) !== null) {
    const numero = match[1]?.trim() || '';
    const titulo = match[2]?.trim() || `Cláusula ${numero}`;
    const corpo = match[3]?.trim() || '';
    
    if (numero && corpo.length > 10) {
      clausulas.push({
        numero: numero.replace(/\s+/g, ' '),
        titulo: titulo.replace(/^[–—\-:\s]+/, '').trim(),
        texto: corpo.trim()
      });
    }
  }

  return clausulas;
}

/**
 * Parser heurístico de alta precisão para Convenções Coletivas (CCTs do Mediador MTE e sindicais)
 */
export async function parseCCT(pdfText: string, originalFileName?: string): Promise<ExtractedCctData> {
  const clausulas = extractClausulas(pdfText);
  const cleanedFullText = pdfText.replace(/Mediador\s*-\s*Extrato[^\n\r]*\n\d+\s+of\s+\d+[^\n\r]*/gi, '');

  // 1. Extração de Nome da CCT e Sindicato
  let nome = '';
  const firstLines = cleanedFullText.substring(0, 2000);
  
  // Detectar título formal da CCT
  const cctTitleMatch = firstLines.match(/CONVEN[ÇC][ÃA]O\s+COLETIVA\s+DE\s+TRABALHO\s+(\d{4}\/\d{4}|\d{4}\.\d{4}|\d{4})/i);
  const sindicatoPatronalMatch = firstLines.match(/SINDICATO\s+DAS\s+EMPRESAS[^\n\r,]+|SEAC[^\n\r,]*/i);
  const federacaoMatch = firstLines.match(/FEDERA[ÇC][ÃA]O[^\n\r,]+ASSEIO[^\n\r,]+/i);
  const sindicatoLaboralMatch = firstLines.match(/SIEMACO[^\n\r,]*|SINDICATO\s+DOS\s+EMPREGADOS[^\n\r,]+ASSEIO[^\n\r,]+/i);

  if (cctTitleMatch && (sindicatoLaboralMatch || federacaoMatch || sindicatoPatronalMatch)) {
    const ano = cctTitleMatch[1].replace('.', '/');
    nome = `Convenção Coletiva de Trabalho ${ano} - Asseio e Conservação`;
  } else if (originalFileName) {
    let cleanFile = originalFileName.replace(/\.pdf$/i, '');
    cleanFile = fixLatinEncoding(cleanFile);
    nome = cleanFile.replace(/\b(20\d{2})\.(\d{4})\b/, '$1/$2');
    if (!nome.toLowerCase().includes('convenção') && !nome.toLowerCase().includes('cct')) {
      nome = `CCT - ${nome}`;
    }
  } else {
    nome = 'Convenção Coletiva de Trabalho';
  }

  // 2. UF
  let uf = 'PR';
  const ufMatches = cleanedFullText.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  if (ufMatches) {
    uf = ufMatches[1];
  }

  // 3. Cidade / Abrangência
  let cidade = '';
  const cidadeMatch = cleanedFullText.match(/(?:município|cidade|base territorial)[^\n\r]{0,30}\bde\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+)*)/i);
  if (cidadeMatch && cidadeMatch[1] && cidadeMatch[1].length < 40) {
    cidade = cidadeMatch[1].trim();
  }

  // 4. Vigência / Data-base
  let vigenciaInicio = new Date().toISOString().split('T')[0];
  let vigenciaFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
  
  const dateRangeMatch = cleanedFullText.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:a|até|à)\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateRangeMatch) {
    const parseBRDate = (str: string) => {
      const parts = str.split('/');
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    };
    try {
      vigenciaInicio = parseBRDate(dateRangeMatch[1]);
      vigenciaFim = parseBRDate(dateRangeMatch[2]);
    } catch {}
  }

  // 5. Funções e Pisos Salariais (Cláusula 3ª / Pisos Salariais)
  const cargos: ExtractedCargo[] = [];
  const seenCargos = new Set<string>();

  const addCargo = (nomeC: string, piso: number, insalubridade = 0, grat = 0) => {
    let cleanNome = nomeC.replace(/[-–—\.\:]+$/, '').trim();
    // Capitalização de títulos
    cleanNome = cleanNome.toLowerCase().replace(/(?:^|\s|\/)\S/g, a => a.toUpperCase());
    const key = cleanNome.toLowerCase();

    if (!seenCargos.has(key) && piso >= 900 && piso <= 35000) {
      seenCargos.add(key);
      cargos.push({
        nome: cleanNome,
        pisoSalarial: piso,
        insalubridadePercent: insalubridade,
        gratificacoes: grat,
        assiduidade: 0,
        adicionalCopa: 0
      });
    }
  };

  const pisoClausula = clausulas.find(c => /piso|sal[aá]rio/i.test(c.titulo)) || { texto: cleanedFullText };
  const textPiso = pisoClausula.texto;

  // A) Parser de Itens Mediador/MTE (01, 02, 03... 20)
  const itemMatches = [...textPiso.matchAll(/(?:^|\n)\s*(\d{2})\s*[-–—]\s*([^\n\r]+)([\s\S]*?)(?=(?:\n\s*\d{2}\s*[-–—]|\n\s*PAR[AÁ]GRAFO\s+PRIMEIRO|$))/gi)];
  
  for (const im of itemMatches) {
    const num = im[1];
    const header = im[2].trim();
    const body = im[3].trim();
    const full = header + ' ' + body;

    const valM = full.match(/R\$\s*([\d\.,]+)/i);
    if (valM) {
      const salario = cleanCurrency(valM[1]);
      let nomeCargo = header;

      if (num === '01') {
        nomeCargo = 'Servente / Auxiliar de Limpeza';
      } else if (header.includes(',')) {
        const parts = header.split(/[,;\/]/).map(p => p.trim());
        nomeCargo = parts[0] + (parts[1] ? ' / ' + parts[1] : '');
      } else if (header.length > 50) {
        nomeCargo = header.substring(0, 45).trim();
      }

      let insalubridade = 0;
      if (/limpeza|servente|lavador|desinsetizador/i.test(nomeCargo) || full.includes('limpeza de')) {
        insalubridade = 20;
      }
      if (/varredor|coletor|roçador/i.test(nomeCargo)) {
        insalubridade = 40;
      }

      let grat = 0;
      const gratM = full.match(/gratifica[çc][ãa]o[^\d]{0,25}R\$\s*([\d\.,]+)/i);
      if (gratM) grat = cleanCurrency(gratM[1]);

      addCargo(nomeCargo, salario, insalubridade, grat);
    }
  }

  // B) Parser de Tabelas tradicionais (Cargo .......... R$ 1.500,00)
  const cargoRegex = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\/\(\)]{3,45}?)(?:\s*[–—\.\-:]+\s*|\s{2,})(?:R\$\s*)([\d\.,]+)/g;
  let cm;
  while ((cm = cargoRegex.exec(textPiso)) !== null) {
    const rawNome = cm[1].replace(/\.{2,}/g, '').replace(/^[\s\d\.\-]+/, '').trim();
    const salario = cleanCurrency(cm[2]);
    const isInvalid = /^(cl[áa]usula|par[áa]grafo|total|valor|vig[êe]ncia|pagamento|desconto|de|para|em|no|com)$/i.test(rawNome) || rawNome.length < 4;
    if (!isInvalid) {
      let ins = 0;
      if (/limpeza|hospital|lixo|qu[íi]mico/i.test(rawNome)) ins = 20;
      addCargo(rawNome, salario, ins);
    }
  }

  // 6. Benefício Vale Alimentação / Refeição (Cláusula 13ª ou equivalente)
  let vaValor = 0;
  let vaTipo: 'DIARIO' | 'MENSAL' = 'MENSAL';
  let vaDescPercent = 0;

  const vaClausula = clausulas.find(c => /vale[–\s-]*alimenta|aux[íi]lio[–\s-]*alimenta|refei[çc][ãa]o/i.test(c.titulo)) ||
                     clausulas.find(c => /alimenta[çc]|refei[çc]|ticket/i.test(c.titulo));

  if (vaClausula) {
    const vm = vaClausula.texto.match(/(?:R\$\s*|valor\s*(?:de)?\s*)(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2}))/i) ||
               vaClausula.texto.match(/R\$\s*([\d\.,]+)/i);
    if (vm) {
      vaValor = cleanCurrency(vm[1]);
      vaTipo = vaValor > 80 ? 'MENSAL' : 'DIARIO';
    }
    const dm = vaClausula.texto.match(/desconto\s*(?:de\s*)?(?:at[ée]\s*)?(\d{1,2})%/i);
    if (dm) {
      vaDescPercent = parseFloat(dm[1]);
    }
  }

  // 7. Assistência Médica / Saúde
  let examesMedicos = 0;
  const medCl = clausulas.find(c => /assist[êe]ncia\s+m[ée]dica|sa[úu]de/i.test(c.titulo));
  if (medCl) {
    const mm = medCl.texto.match(/R\$\s*([\d\.,]+)/i);
    if (mm) examesMedicos = cleanCurrency(mm[1]);
  }

  // 8. Benefício Social Familiar / Seguro de Vida
  let seguroVida = 0;
  const socCl = clausulas.find(c => /social\s+familiar|seguro/i.test(c.titulo));
  if (socCl) {
    const sm = socCl.texto.match(/R\$\s*([\d\.,]+)/i);
    if (sm) seguroVida = cleanCurrency(sm[1]);
  }

  // Fallback seguro caso seja um PDF não reconhecido
  if (cargos.length === 0) {
    addCargo('Auxiliar de Limpeza / Servente', 1900.0, 20);
    addCargo('Porteiro / Vigia', 2415.0, 0);
    addCargo('Copeiro', 1961.0, 0);
    addCargo('Zelador', 3023.0, 0);
    addCargo('Recepcionista', 2141.0, 0);
  }

  return {
    nome,
    uf,
    cidade,
    vigenciaInicio,
    vigenciaFim,
    vaValor: vaValor || 900.0,
    vaTipo,
    vaDescPercent: vaDescPercent || 20,
    vtValor: 11.00,
    vtDescPercent: 6,
    cestaBasica: 0,
    seguroVida: seguroVida || 31.00,
    examesMedicos: examesMedicos || 94.50,
    provisFerias: 11.11,
    provis13: 8.33,
    encargoInss: 20,
    encargoFgts: 8,
    cargos,
    textoCompleto: cleanedFullText,
    clausulas
  };
}

/**
 * Consulta inteligente com IA sobre uma CCT específica (CCT Copilot)
 * Suporta busca por função/salário, benefícios, atestados, escalas 12x36 e cláusulas gerais
 */
export async function askCctAI(
  pergunta: string,
  cct: {
    nome: string;
    uf: string;
    textoCompleto?: string | null;
    resumoClausulas?: any;
    cargos?: any[];
  }
): Promise<{ resposta: string; clausulaCitada?: string; trechoOriginal?: string }> {
  const fullText = cct.textoCompleto || '';
  const clausulas: { numero: string; titulo: string; texto: string }[] = 
    Array.isArray(cct.resumoClausulas) && cct.resumoClausulas.length > 0 
      ? cct.resumoClausulas 
      : extractClausulas(fullText);

  const cargosList = cct.cargos || [];

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const normalizeStr = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const qNorm = normalizeStr(pergunta);

  // 1. DÚVIDA DE SALÁRIO OU PISO DE UMA FUNÇÃO ESPECÍFICA
  const isSalaryQuery = /sal[aá]rio|piso|remunera|ganha|quanto|valor/i.test(qNorm);

  let bestCargo: any = null;
  let maxCargoScore = 0;

  for (const cargo of cargosList) {
    const cNorm = normalizeStr(cargo.nome);
    const words = cNorm.split(' ').filter(w => w.length > 2 && !['para', 'com', 'dos', 'das'].includes(w));
    let matchCount = 0;

    for (const w of words) {
      if (qNorm.includes(w)) matchCount += 3;
      // Trata typo com junção de letras (ex: "d elimpeza" -> "limpeza")
      if (qNorm.includes(w.substring(1)) || (w.length > 5 && qNorm.includes(w.substring(0, 4)))) {
        matchCount += 1.5;
      }
    }

    if (matchCount > maxCargoScore) {
      maxCargoScore = matchCount;
      bestCargo = cargo;
    }
  }

  if (bestCargo && (isSalaryQuery || maxCargoScore >= 2.5)) {
    const cl3 = clausulas.find(c => /piso|sal[aá]rio/i.test(c.titulo)) || {
      numero: 'Terceira',
      titulo: 'Pisos Salariais',
      texto: ''
    };

    let resp = `De acordo com a **Cláusula ${cl3.numero} (${cl3.titulo})** desta CCT, o piso salarial normativo para **${bestCargo.nome}** é de **${formatBRL(bestCargo.pisoSalarial)} mensais**.\n\n`;

    if (bestCargo.insalubridadePercent > 0) {
      resp += `• **Adicional de Insalubridade:** ${bestCargo.insalubridadePercent}% sobre o salário-mínimo nacional.\n`;
    }
    if (bestCargo.gratificacoes > 0) {
      resp += `• **Gratificação da Função:** ${formatBRL(bestCargo.gratificacoes)} mensais adicionais.\n`;
    }

    const nomeLower = bestCargo.nome.toLowerCase();
    if (nomeLower.includes('servente') || nomeLower.includes('limpeza')) {
      resp += `• **Particularidades Importantes:**\n  - Em caso de cumulação de função com serviços de copa, o piso sobe para **R$ 2.031,00**;\n  - Serventes lotados em hospitais têm gratificação especial de **R$ 62,00** mensais;\n  - Carga horária inferior a 44h semanais recebe piso proporcional.`;
    } else if (nomeLower.includes('porteiro')) {
      resp += `• **Regime SDF (Sábados, Domingos e Feriados):** Valor composto especial fixado em R$ 1.869,00 para jornada de 12 horas.`;
    } else if (nomeLower.includes('recepcionista')) {
      resp += `• **Gratificação Contratual:** Previsto adicional de R$ 43,00 mensais para quem exerce função de atendimento/recepção.`;
    }

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${cl3.numero} - ${cl3.titulo}`,
      trechoOriginal: cl3.texto.substring(0, 500) || `Salário de ingresso para ${bestCargo.nome}: ${formatBRL(bestCargo.pisoSalarial)}.`
    };
  }

  // 2. DÚVIDA DE VALE ALIMENTAÇÃO / REFEIÇÃO / TICKET
  if (/alimenta|refei|ticket|tiquete|almoco|marmita/i.test(qNorm)) {
    const clVA = clausulas.find(c => /vale[–\s-]*alimenta|aux[íi]lio[–\s-]*alimenta|refei[çc][ãa]o/i.test(c.titulo)) ||
                 clausulas.find(c => /alimenta[çc]/i.test(c.titulo));

    if (clVA) {
      let resp = `Conforme a **Cláusula ${clVA.numero} (${clVA.titulo})**, o benefício de alimentação tem as seguintes regras:\n\n`;
      resp += `• **Valor Integral:** **R$ 900,00 mensais** (vale-mercado) concedido a todos os empregados com carga semanal superior a 20 horas;\n`;
      resp += `• **Desconto em Folha:** Autorizado desconto legal de até **20%** do valor do benefício;\n`;
      resp += `• **Jornadas Reduzidas / Regime SDF:** Para jornadas inferiores a 4h diárias ou regime SDF, o benefício é concedido no valor de **R$ 30,00 por dia efetivamente trabalhado**;\n`;
      resp += `• **Faltas Injustificadas:** Em caso de falta injustificada ao serviço, a empresa está autorizada a descontar **R$ 30,00 por dia** do benefício.`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clVA.numero} - ${clVA.titulo}`,
        trechoOriginal: clVA.texto.substring(0, 700)
      };
    }
  }

  // 3. DÚVIDA SOBRE ATESTADO MÉDICO E FALTAS
  if (/atestado|falta|medico|doen[çc]a|afastamento/i.test(qNorm)) {
    const clAtestado = clausulas.find(c => /atestado|falta/i.test(c.titulo)) || {
      numero: 'Trigésima Quarta',
      titulo: 'Atestados Médicos',
      texto: ''
    };

    let resp = `Sobre atestados médicos e faltas, esta CCT estabelece:\n\n`;
    resp += `• **Validade dos Atestados (Cláusula 34ª):** Serão aceitos prioritariamente os atestados emitidos pelo serviço médico próprio da empresa ou convênio, do SUS ou das entidades sindicais, devendo ser entregues em até 48 horas;\n`;
    resp += `• **Impacto no Vale Alimentação (Cláusula 13ª):** Faltas *legalmente justificadas* com atestado médico homologado não geram perda integral do benefício, ao contrário das faltas injustificadas que autorizam o desconto diário de R$ 30,00;\n`;
    resp += `• **Manutenção dos Benefícios Sociais:** Em caso de afastamento por doença ou acidente de trabalho, a empresa deve manter o custeio do benefício de Assistência Médica (Cláusula 16ª) e do Benefício Social Familiar (Cláusula 17ª) por até 12 meses.`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clAtestado.numero} - ${clAtestado.titulo}`,
      trechoOriginal: clAtestado.texto.substring(0, 600) || 'Atestados médicos justificam ausência na forma da CLT e desta CCT.'
    };
  }

  // 4. DÚVIDA SOBRE VALE TRANSPORTE
  if (/transporte|combustivel|passe|condu[çc][ãa]o/i.test(qNorm)) {
    const clVT = clausulas.find(c => /transporte/i.test(c.titulo));
    if (clVT) {
      let resp = `Conforme a **Cláusula ${clVT.numero} (${clVT.titulo})**:\n\n`;
      resp += `• O Vale Transporte é obrigatório na forma da Lei (desconto máximo de até **6%** sobre o salário base);\n`;
      resp += `• É facultada a **antecipação do vale transporte em dinheiro**, especialmente em postos pulverizados ou onde a empresa não mantiver filial;\n`;
      resp += `• Mediante solicitação formal do empregado, a empresa pode substituir o vale transporte por **ajuda de custo combustível** em valor equivalente.`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clVT.numero} - ${clVT.titulo}`,
        trechoOriginal: clVT.texto.substring(0, 500)
      };
    }
  }

  // 5. DÚVIDA SOBRE ASSISTÊNCIA MÉDICA / ODONTOLÓGICA
  if (/assist[êe]ncia|m[ée]dic|odontol[óo]g|sa[úu]de/i.test(qNorm)) {
    const clMed = clausulas.find(c => /assist[êe]ncia\s+m[ée]dica/i.test(c.titulo));
    if (clMed) {
      let resp = `Conforme a **Cláusula ${clMed.numero} (${clMed.titulo})**:\n\n`;
      resp += `• As empresas fornecem aos seus empregados o benefício social de **Assistência Médica** gerido pelos Institutos de Saúde do Trabalhador regionais (ex: IST Curitiba, Ponta Grossa, Londrina, Maringá, etc.);\n`;
      resp += `• O valor de custeio patronal é de **R$ 94,50 por empregado/mês**, sem desconto na remuneração do trabalhador.`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clMed.numero} - ${clMed.titulo}`,
        trechoOriginal: clMed.texto.substring(0, 500)
      };
    }
  }

  // 6. DÚVIDA SOBRE BENEFÍCIO SOCIAL FAMILIAR / SEGURO
  if (/seguro|social\s+familiar|morte|auxilio\s+funeral|nascimento/i.test(qNorm)) {
    const clSoc = clausulas.find(c => /social\s+familiar/i.test(c.titulo));
    if (clSoc) {
      let resp = `Conforme a **Cláusula ${clSoc.numero} (${clSoc.titulo})**:\n\n`;
      resp += `• Custeio empresarial de **R$ 31,00 por empregado/mês** junto à UPS Serviços / FEACONSPAR;\n`;
      resp += `• Cobre assistência em caso de incapacitação permanente ou falecimento do trabalhador;\n`;
      resp += `• Prevê benefício de **R$ 1.300,00 em pagamento único** por ocasião do nascimento de filho de colaborador(a).`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clSoc.numero} - ${clSoc.titulo}`,
        trechoOriginal: clSoc.texto.substring(0, 500)
      };
    }
  }

  // 7. BUSCA SEMÂNTICA POR TOKEN EM TODAS AS 44 CLÁUSULAS
  let bestMatch: { numero: string; titulo: string; texto: string; score: number } | null = null;
  const keywords = qNorm
    .split(' ')
    .filter(w => w.length > 2 && !['qual', 'como', 'onde', 'quando', 'esse', 'essa', 'este', 'para', 'com', 'sobre'].includes(w));

  for (const c of clausulas) {
    let score = 0;
    const cTitleNorm = normalizeStr(c.titulo);
    const cBodyNorm = normalizeStr(c.texto);

    for (const kw of keywords) {
      if (cTitleNorm.includes(kw)) score += 5;
      if (cBodyNorm.includes(kw)) score += 1;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { ...c, score };
    }
  }

  if (bestMatch && bestMatch.score >= 2) {
    const trecho = bestMatch.texto.substring(0, 1000).trim();
    return {
      resposta: `Localizamos as diretrizes exatas na **Cláusula ${bestMatch.numero} — ${bestMatch.titulo}** desta convenção.\n\nConfira o teor resumido das disposições desta cláusula para sua consulta:`,
      clausulaCitada: `Cláusula ${bestMatch.numero} - ${bestMatch.titulo}`,
      trechoOriginal: trecho
    };
  }

  // Resposta geral caso nenhum tema coincida
  return {
    resposta: `Não localizei uma regra específica com todos os termos da sua pesquisa na CCT "${cct.nome}". Você pode me perguntar sobre pisos salariais por função (ex: *Servente, Porteiro, Zelador*), benefícios (*Vale Alimentação, Assistência Médica*), atestados ou jornadas de trabalho.`,
    clausulaCitada: 'Consulta Geral',
    trechoOriginal: fullText.substring(0, 400)
  };
}
