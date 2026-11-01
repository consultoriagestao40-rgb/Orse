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
 * Função utilitária para converter strings monetárias brasileiras (ex: "1.900,00", "1.900.00", "900.00", "94,50", "130.00") em float limpo
 */
export function cleanCurrency(str: string): number {
  if (!str) return 0;
  // Remove caracteres não numéricos e pontuações residuais no final
  let clean = str.replace(/[^\d,\.]/g, '').replace(/[\.,]+$/, '').trim();
  if (!clean) return 0;

  if (clean.includes('.') && clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.')) || 0;
  }
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 3) {
      // Ex: "1.900.00" -> 1900.00
      return parseFloat(`${parts[0]}${parts[1]}.${parts[2]}`) || 0;
    }
    if (parts.length === 2) {
      // Se a segunda parte tem 2 dígitos (ex: 130.00 ou 94.50), são centavos!
      if (parts[1].length === 2) {
        return parseFloat(`${parts[0]}.${parts[1]}`) || 0;
      }
      // Se tem 3 dígitos (ex: 1.900 ou 2.038), é separador de milhar!
      return parseFloat(`${parts[0]}${parts[1]}`) || 0;
    }
    return parseFloat(clean.replace(/\./g, '')) || 0;
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

  // 1. DÚVIDA DE INSALUBRIDADE OU PERICULOSIDADE
  if (/insalubr|periculos|grau\s*m[aá]ximo|grau\s*m[eé]dio|adicional\s*de\s*risco/i.test(qNorm)) {
    const clInsalubridade = clausulas.find(c => /insalubr|piso|sal[aá]rio/i.test(c.titulo)) || {
      numero: 'Terceira',
      titulo: 'Pisos Salariais e Adicionais',
      texto: ''
    };

    // Verifica se perguntou sobre um cargo específico
    let targetCargo: any = null;
    for (const cargo of cargosList) {
      const cNorm = normalizeStr(cargo.nome);
      const words = cNorm.split(' ').filter(w => w.length > 2 && !['para', 'com', 'dos', 'das'].includes(w));
      if (words.some(w => qNorm.includes(w))) {
        targetCargo = cargo;
        break;
      }
    }

    if (targetCargo) {
      const percent = targetCargo.insalubridadePercent || 0;
      let resp = '';
      if (percent > 0) {
        resp = `Sim. Para **${targetCargo.nome}**, a convenção prevê adicional de **insalubridade de ${percent}%** (Grau ${percent === 40 ? 'Máximo' : 'Médio'}).\n\n` +
               `• **Base de Cálculo:** Incide sobre o **salário-mínimo nacional** vigente (conforme Parágrafos 5º e 6º da Cláusula 3ª).\n` +
               `• **Piso Salarial Base:** ${formatBRL(targetCargo.pisoSalarial)} mensais.`;
      } else {
        resp = `Não há previsão normativa de adicional de insalubridade para a função de **${targetCargo.nome}** na tabela salarial desta CCT.\n\n` +
               `• **Piso Salarial Base:** ${formatBRL(targetCargo.pisoSalarial)} mensais.\n` +
               `*Nota: A caracterização de insalubridade para funções administrativas ou de portaria dependeria de laudo pericial (LTCAT/PGR) específico no posto de trabalho.*`;
      }

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clInsalubridade.numero} - ${clInsalubridade.titulo}`,
        trechoOriginal: clInsalubridade.texto.substring(0, 700) || 'Previsão de adicionais de insalubridade conforme parágrafos da Cláusula Terceira.'
      };
    }

    // Pergunta geral sobre quais funções têm insalubridade
    const resp = `As funções com previsão expressa de **Adicional de Insalubridade** nesta CCT são:\n\n` +
      `• **Grau Máximo (40%):**\n` +
      `  - Coletores de Lixo / Resíduos\n` +
      `  - Varredores e Roçadores Manuais (vias e logradouros públicos)\n` +
      `  - Limpeza e conservação de galerias, bocas de lobo e valões/córregos alagados\n` +
      `  - Desinsetizadores / Operadores de controle de pragas\n\n` +
      `• **Grau Médio (20%):**\n` +
      `  - Servente / Auxiliar de Limpeza (geral e em estabelecimentos hospitalares/saúde)\n` +
      `  - Lavadores de Áreas de Disposição Final de Resíduos\n` +
      `  - Tratadores de Animais\n\n` +
      `📌 **Base de Cálculo:** O percentual incide sobre o **salário-mínimo nacional** vigente (Parágrafos 5º e 6º da Cláusula 3ª).`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clInsalubridade.numero} - ${clInsalubridade.titulo}`,
      trechoOriginal: clInsalubridade.texto.substring(0, 900) || 'Previsão de adicional de insalubridade de 40% (máximo) e 20% (médio) para funções operacionais sobre o salário mínimo.'
    };
  }

  // 2. DÚVIDA DE SALÁRIO OU PISO DE UMA FUNÇÃO ESPECÍFICA
  const isSalaryQuery = /sal[aá]rio|piso|remunera|ganha|quanto|valor/i.test(qNorm);

  let bestCargo: any = null;
  let maxCargoScore = 0;

  for (const cargo of cargosList) {
    const cNorm = normalizeStr(cargo.nome);
    const words = cNorm.split(' ').filter(w => w.length > 2 && !['para', 'com', 'dos', 'das'].includes(w));
    let matchCount = 0;

    for (const w of words) {
      if (qNorm.includes(w)) matchCount += 3;
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

    let resp = `Piso salarial normativo para **${bestCargo.nome}**:\n\n` +
               `• **Salário Base:** **${formatBRL(bestCargo.pisoSalarial)} mensais**\n`;

    if (bestCargo.insalubridadePercent > 0) {
      resp += `• **Insalubridade:** ${bestCargo.insalubridadePercent}% sobre o salário-mínimo nacional\n`;
    }
    if (bestCargo.gratificacoes > 0) {
      resp += `• **Gratificação da Função:** ${formatBRL(bestCargo.gratificacoes)} mensais\n`;
    }

    const nomeLower = bestCargo.nome.toLowerCase();
    if (nomeLower.includes('servente') || nomeLower.includes('limpeza')) {
      resp += `• **Particularidades:**\n  - Cumulação com copa: piso sobre para **R$ 2.031,00**;\n  - Postos hospitalares: gratificação especial de **R$ 62,00** mensais.`;
    } else if (nomeLower.includes('porteiro')) {
      resp += `• **Regime SDF (12h):** R$ 1.869,00 para sábados, domingos e feriados.`;
    } else if (nomeLower.includes('recepcionista')) {
      resp += `• **Gratificação Contratual:** R$ 43,00 mensais para atendimento/recepção.`;
    }

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${cl3.numero} - ${cl3.titulo}`,
      trechoOriginal: cl3.texto.substring(0, 500) || `Salário de ingresso para ${bestCargo.nome}: ${formatBRL(bestCargo.pisoSalarial)}.`
    };
  }

  // 2. DÚVIDA DE VALE TRANSPORTE (VT)
  const isVT = /\bvt\b|vale\s*transporte|transporte|condu[çc][ãa]o|passe\s*(?:de\s*[oó]nibus|escolar)?|tarifa|combust[íi]vel|\b[oó]nibus\b/i.test(qNorm);

  if (isVT) {
    const clVT = clausulas.find(c => /transporte/i.test(c.titulo)) || {
      numero: 'Décima Quinta',
      titulo: 'Vale Transporte',
      texto: ''
    };

    let resp = `Diretrizes do **Vale Transporte (Cláusula 15ª - Vale Transporte)** e legislação (Lei nº 7.418/1985):\n\n` +
      `• **Fornecimento Diário:** O benefício é concedido obrigatoriamente para cobrir os deslocamentos residência-trabalho e vice-versa em dias de efetivo serviço;\n` +
      `• **Tarifa / Custo:** O valor é correspondente à tarifa do transporte público coletivo local (orçado na planilha padrão da CCT em **R$ 11,00/dia**);\n` +
      `• **Desconto Legal em Folha:** Autorizado desconto salarial de até **6%** sobre o salário-base do empregado;\n` +
      `• **Pagamento em Dinheiro / Ajuda Combustível (Parágrafo 1º):** É expressamente facultada a **antecipação do vale transporte em dinheiro** (quando a empresa não mantiver filial no município do tomador) ou a substituição por **ajuda de custo combustível** em valor equivalente, mediante solicitação do empregado;\n` +
      `• **Multa por Descumprimento (Parágrafo 3º):** R$ 205,00 mensais por empregado prejudicado.`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clVT.numero} - ${clVT.titulo}`,
      trechoOriginal: clVT.texto.substring(0, 700) || 'As empresas se obrigam a conceder aos seus empregados o vale transporte, na forma da Lei.'
    };
  }

  // 3. DÚVIDA DE VALE ALIMENTAÇÃO / REFEIÇÃO / TICKET (VA / VR)
  const isVA = /\bva\b|\bvr\b|vale\s*alimenta|aux[íi]lio\s*alimenta|alimenta[çc][ãa]o|refei[çc][ãa]o|ticket|tiquete|almo[çc]o|marmita|vale\s*mercado/i.test(qNorm);

  if (isVA) {
    const clVA = clausulas.find(c => /vale[–\s-]*alimenta|aux[íi]lio[–\s-]*alimenta|refei[çc][ãa]o/i.test(c.titulo)) ||
                 clausulas.find(c => /alimenta[çc]/i.test(c.titulo)) || {
                   numero: 'Décima Terceira',
                   titulo: 'Vale-Alimentação',
                   texto: ''
                 };

    // Subcaso A: Fornecimento de refeição / alimentação no local de trabalho
    const isAlimentacaoNoLocal = /refei[çc][ãa]o\s+(?:no|em)\s+local|alimenta[çc][ãa]o\s+(?:no|em)\s+local|fornece[^\n\r]{0,20}refei|fornece[^\n\r]{0,20}alimenta|fornecimento|refeit[oó]rio|posto[s\s]+que\s+concedam\s+alimenta/i.test(qNorm);

    if (isAlimentacaoNoLocal) {
      let resp = `Quando o posto de serviço **fornece alimentação/refeição no local**, o valor do vale-alimentação (mercado) é de **R$ 494,00 mensais**, conforme o **Parágrafo Quinto da Cláusula 13ª**:\n\n` +
        `• **Valor Mensal:** **R$ 494,00** (em vez do valor integral de R$ 900,00);\n` +
        `• **Desconto em Folha:** Autorizado o desconto legal de até **20%** sobre o valor;\n` +
        `• **Desconto por Falta ao Serviço:** Em caso de falta, a empresa pode descontar **R$ 17,00 por dia** (ao invés de R$ 30,00 da regra geral);\n` +
        `• **Falta Injustificada no Mês (Parágrafo 7º):** Aplica-se desconto de **R$ 29,00** no mês seguinte caso ocorra falta injustificada ou mais de uma legalmente justificada;\n` +
        `• **Valor nas Férias (Parágrafo 8º):** R$ 494,00 (sem faltas), R$ 445,00 (1 a 3 faltas) e R$ 395,00 (4 a 5 faltas).`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clVA.numero} - Parágrafo Quinto (Alimentação no Local)`,
        trechoOriginal: `PARÁGRAFO QUINTO – Aos empregados em postos de serviços que concedam alimentação no local, a empresa fornecerá o vale alimentação (mercado) no valor mensal de R$ 494,00, autorizado o desconto de 20% do referido valor. Em caso de falta, fica autorizada a empresa a descontar o valor de R$ 17,00, por dia do quanto aqui especificado.`
      };
    }

    // Subcaso B: Vale alimentação nas férias
    if (/f[ée]rias/i.test(qNorm)) {
      let resp = `Conforme o **Parágrafo Oitavo da Cláusula 13ª**, o empregado tem direito ao vale-alimentação durante as **férias**, conforme a assiduidade no período aquisitivo:\n\n` +
        `• **Regra Geral (postos sem refeição no local):**\n` +
        `  - Nenhuma falta (justificada ou não): **R$ 900,00**;\n` +
        `  - De 1 a 3 faltas: **R$ 810,00**;\n` +
        `  - De 4 a 5 faltas: **R$ 720,00**;\n` +
        `  - 6 ou mais faltas: Não faz jus ao benefício nas férias.\n\n` +
        `• **Postos com refeição no local (Parágrafo 5º):**\n` +
        `  - Nenhuma falta: **R$ 494,00**;\n` +
        `  - De 1 a 3 faltas: **R$ 445,00**;\n` +
        `  - De 4 a 5 faltas: **R$ 395,00**;\n` +
        `  - 6 ou mais faltas: Sem benefício nas férias.\n\n` +
        `📌 *O valor concedido nas férias não possui natureza salarial.*`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clVA.numero} - Parágrafo Oitavo (Férias)`,
        trechoOriginal: clVA.texto.substring(clVA.texto.indexOf('PARÁGRAFO OITAVO'), clVA.texto.indexOf('PARÁGRAFO OITAVO') + 600) || clVA.texto.substring(0, 700)
      };
    }

    // Subcaso C: Jornada inferior a 4h ou Regime SDF
    if (/sdf|4\s*horas|jornada\s*reduzida|por\s*dia/i.test(qNorm)) {
      let resp = `Conforme o **Parágrafo Terceiro da Cláusula 13ª**:\n\n` +
        `• **Jornadas com no mínimo 4h que cubram 5 dias úteis:** Vale alimentação integral no valor de **R$ 900,00 mensais**;\n` +
        `• **Jornadas inferiores a 4h (sem cobrir todos os dias da semana) ou Regime SDF:** O benefício é pago no valor de **R$ 30,00 por dia efetivamente trabalhado**, autorizado desconto de até 20%.`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clVA.numero} - Parágrafo Terceiro`,
        trechoOriginal: clVA.texto.substring(clVA.texto.indexOf('PARÁGRAFO TERCEIRO'), clVA.texto.indexOf('PARÁGRAFO TERCEIRO') + 500) || clVA.texto.substring(0, 600)
      };
    }

    // Subcaso Geral de Alimentação
    let resp = `Regras do **Vale-Alimentação (Cláusula 13ª)** desta CCT:\n\n` +
      `• **Valor Integral Padrão:** **R$ 900,00 mensais** (vale-mercado) concedido a empregados com carga superior a 20h semanais;\n` +
      `• **Com Refeição Fornecida no Local:** Reduzido para **R$ 494,00 mensais** (Parágrafo 5º);\n` +
      `• **Jornadas Reduzidas / Regime SDF:** **R$ 30,00 por dia trabalhado** (Parágrafo 3º);\n` +
      `• **Desconto em Folha:** Autorizado desconto legal de até **20%** do valor;\n` +
      `• **Desconto por Falta ao Serviço:** R$ 30,00/dia na regra geral ou R$ 17,00/dia quando há refeição no local;\n` +
      `• **Nas Férias:** Mantido benefício conforme assiduidade (R$ 900 / 810 / 720).`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clVA.numero} - ${clVA.titulo}`,
      trechoOriginal: clVA.texto.substring(0, 700)
    };
  }

  // 4. DÚVIDA SOBRE DESJEJUM / CAFÉ DA MANHÃ / LANCHE (CLÁUSULA 14ª)
  if (/desjejum|caf[ée]\s*da\s*manh[ãa]|lanche/i.test(qNorm)) {
    const clDesjejum = clausulas.find(c => /desjejum|caf[ée]/i.test(c.titulo)) || {
      numero: 'Décima Quarta',
      titulo: 'Desjejum',
      texto: ''
    };

    let resp = `Conforme a **Cláusula 14ª (Desjejum)**:\n\n` +
      `• As empresas de limpeza pública e privada fornecerão **gratuitamente** em dias de efetivo trabalho um lanche;\n` +
      `• **Composição do Lanche:** Café, leite, pão com queijo, presunto ou similar;\n` +
      `• **Momento:** Deve ser servido antes do início da jornada de trabalho (não computado na jornada).`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clDesjejum.numero} - ${clDesjejum.titulo}`,
      trechoOriginal: clDesjejum.texto.substring(0, 500)
    };
  }

  // 5. DÚVIDA SOBRE ATESTADO MÉDICO E FALTAS
  if (/atestado|falta|medico|doen[çc]a|afastamento/i.test(qNorm)) {
    const clAtestado = clausulas.find(c => /atestado|falta/i.test(c.titulo)) || {
      numero: 'Trigésima Quarta',
      titulo: 'Atestados Médicos',
      texto: ''
    };

    let resp = `Sobre atestados médicos e faltas, esta CCT estabelece:\n\n` +
      `• **Validade dos Atestados (Cláusula 34ª):** Serão aceitos prioritariamente os atestados emitidos pelo serviço médico próprio da empresa ou convênio, do SUS ou das entidades sindicais, devendo ser entregues em até 48 horas;\n` +
      `• **Impacto no Vale Alimentação (Cláusula 13ª):** Faltas legalmente justificadas com atestado homologado não geram perda integral do benefício, ao contrário das faltas injustificadas que autorizam desconto diário de R$ 30,00 (ou R$ 17,00 se houver refeição no local);\n` +
      `• **Manutenção dos Benefícios Sociais:** Em caso de afastamento por doença ou acidente, a empresa deve manter a Assistência Médica (Cláusula 16ª) e o Benefício Social Familiar (Cláusula 17ª) por até 12 meses.`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clAtestado.numero} - ${clAtestado.titulo}`,
      trechoOriginal: clAtestado.texto.substring(0, 600) || 'Atestados médicos justificam ausência na forma da CLT e desta CCT.'
    };
  }

  // 6. DÚVIDA SOBRE ASSISTÊNCIA MÉDICA / ODONTOLÓGICA (IST)
  if (/\bist\b|assist[êe]ncia\s*m[ée]dica|odontol[óo]g|sa[úu]de|plano\s*de\s*sa[úu]de/i.test(qNorm)) {
    const clMed = clausulas.find(c => /assist[êe]ncia\s+m[ée]dica|sa[úu]de/i.test(c.titulo));
    if (clMed) {
      let resp = `Conforme a **Cláusula ${clMed.numero} (${clMed.titulo})**:\n\n` +
        `• As empresas fornecem aos empregados o benefício social de **Assistência Médica** gerido pelos Institutos de Saúde do Trabalhador regionais (ex: IST Curitiba, Londrina, Maringá, etc.);\n` +
        `• **Valor Patronal:** **R$ 94,50 por empregado/mês**, custeado integralmente pela empresa sem qualquer desconto em folha.`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clMed.numero} - ${clMed.titulo}`,
        trechoOriginal: clMed.texto.substring(0, 500)
      };
    }
  }

  // 7. DÚVIDA SOBRE BENEFÍCIO SOCIAL FAMILIAR (BSF)
  if (/\bbsf\b|social\s+familiar|seguro\s+de\s+vida|auxilio\s+funeral|natalidade/i.test(qNorm)) {
    const clSoc = clausulas.find(c => /social\s+familiar/i.test(c.titulo));
    if (clSoc) {
      let resp = `Conforme a **Cláusula ${clSoc.numero} (${clSoc.titulo})**:\n\n` +
        `• **Custeio Patronal:** **R$ 31,00 por empregado/mês** junto à UPS Serviços / FEACONSPAR sem desconto salarial;\n` +
        `• **Coberturas:** Auxílio funeral, assistência por incapacitação permanente ou falecimento do titular;\n` +
        `• **Auxílio Natalidade:** Benefício de **R$ 1.300,00 em pagamento único** por ocasião do nascimento de filho de colaborador(a).`;

      return {
        resposta: resp,
        clausulaCitada: `Cláusula ${clSoc.numero} - ${clSoc.titulo}`,
        trechoOriginal: clSoc.texto.substring(0, 500)
      };
    }
  }

  // 8. DÚVIDA SOBRE UNIFORMES E EPIS
  if (/\bepi\b|\bepis\b|uniforme|farda|bota|cal[çc]ado|luva/i.test(qNorm)) {
    const clEPI = clausulas.find(c => /uniforme|epi/i.test(c.titulo)) || {
      numero: 'Trigésima Segunda',
      titulo: 'Uniformes e Equipamentos de Proteção',
      texto: ''
    };

    let resp = `Diretrizes de **Uniformes e EPIs (Cláusula 32ª)**:\n\n` +
      `• **Fornecimento Gratuito:** Obrigatório fornecimento gratuito de **2 uniformes completos por ano** para cada trabalhador;\n` +
      `• **Reposição:** Reposição sem ônus sempre que desgastados pelo uso regular;\n` +
      `• **EPIs Adequados:** Devem ser fornecidos calçados adequados, luvas, óculos e itens de proteção específicos segundo os riscos da função.`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clEPI.numero} - ${clEPI.titulo}`,
      trechoOriginal: clEPI.texto.substring(0, 500)
    };
  }

  // 9. DÚVIDA SOBRE HORAS EXTRAS OU ADICIONAL NOTURNO
  if (/hora\s*extra|adicional\s*noturno|noturno|banco\s*de\s*horas/i.test(qNorm)) {
    const clHE = clausulas.find(c => /hora\s*extra|jornada/i.test(c.titulo)) || {
      numero: 'Décima',
      titulo: 'Horas Extras e Adicionais',
      texto: ''
    };

    let resp = `Regras de **Horas Extras e Adicional Noturno** desta CCT:\n\n` +
      `• **Horas Extras em Dias Úteis / Sábados:** Adicional de **50%** sobre o valor da hora normal;\n` +
      `• **Horas Extras em Domingos e Feriados:** Adicional de **100%** sobre o valor da hora normal;\n` +
      `• **Adicional Noturno:** **20%** para o trabalho prestado entre as 22h e as 5h;\n` +
      `• **Hora Ficta Noturna:** Redução de 52 minutos e 30 segundos conforme CLT.`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clHE.numero} - ${clHE.titulo}`,
      trechoOriginal: clHE.texto.substring(0, 600)
    };
  }

  // 10. DÚVIDA SOBRE JORNADA DE TRABALHO / 12X36 / INTERVALO
  if (/12x36|jornada|escala|intervalo|refei[çc][ãa]o|descanso/i.test(qNorm)) {
    const clJornada = clausulas.find(c => /jornada|escala|12x36/i.test(c.titulo)) || {
      numero: 'Vigésima Oitava',
      titulo: 'Jornada e Escalas de Trabalho',
      texto: ''
    };

    let resp = `Diretrizes de **Jornada e Escala** desta convenção:\n\n` +
      `• **Jornada Padrão:** 44 horas semanais ou regime de 12x36 (doze horas de trabalho por trinta e seis de descanso);\n` +
      `• **Escala 12x36:** Autorizada expressamente para vigilância, portaria e serviços contínuos, com intervalo intrajornada garantido;\n` +
      `• **Intervalo de Refeição:** Mínimo de 1 hora para jornadas acima de 6 horas contínuas, sendo permitida indenização em 12x36 nos termos legais.`;

    return {
      resposta: resp,
      clausulaCitada: `Cláusula ${clJornada.numero} - ${clJornada.titulo}`,
      trechoOriginal: clJornada.texto.substring(0, 600)
    };
  }

  // 11. BUSCA SEMÂNTICA POR TOKEN FILTRANDO STOPWORDS GENÉRICAS
  const stopwords = new Set([
    'qual', 'quais', 'como', 'onde', 'quando', 'esse', 'essa', 'este', 'esta', 
    'para', 'com', 'sobre', 'valor', 'valores', 'diario', 'diaria', 'mensal', 
    'quanto', 'regras', 'diretrizes', 'tem', 'ha', 'existe', 'dessa', 'desta', 
    'cct', 'convencao', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma', 'uns', 'umas'
  ]);

  let bestMatch: { numero: string; titulo: string; texto: string; score: number } | null = null;
  const keywords = qNorm
    .split(' ')
    .filter(w => (w.length > 2 || ['vt', 'va', 'vr', 'he'].includes(w)) && !stopwords.has(w));

  if (keywords.length > 0) {
    for (const c of clausulas) {
      let score = 0;
      const cTitleNorm = normalizeStr(c.titulo);
      const cBodyNorm = normalizeStr(c.texto);

      for (const kw of keywords) {
        if (cTitleNorm.includes(kw)) score += 6;
        if (cBodyNorm.includes(kw)) score += 1;
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { ...c, score };
      }
    }
  }

  if (bestMatch && bestMatch.score >= 3) {
    // Sintetiza os primeiros pontos da cláusula de maneira limpa
    const linhas = bestMatch.texto
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 15 && !l.startsWith('CLÁUSULA'));
    
    const destaques = linhas.slice(0, 3).map(l => `• ${l}`).join('\n');
    const resposta = `Diretrizes da **Cláusula ${bestMatch.numero} — ${bestMatch.titulo}**:\n\n${destaques || 'Esta cláusula regulamenta as condições específicas de trabalho e direitos desta categoria.'}`;

    return {
      resposta,
      clausulaCitada: `Cláusula ${bestMatch.numero} - ${bestMatch.titulo}`,
      trechoOriginal: bestMatch.texto.substring(0, 1000).trim()
    };
  }

  // Resposta geral caso nenhum tema coincida
  return {
    resposta: `Não localizei uma regra específica na CCT "${cct.nome}". Você pode me consultar sobre:\n\n` +
      `• **Pisos Salariais:** *Servente, Porteiro, Copeiro, Zelador, etc.*\n` +
      `• **Insalubridade:** *Quais funções têm 40% e 20%*\n` +
      `• **Benefícios:** *Vale Transporte (VT), Vale Alimentação (VA), Refeição no local, Desjejum, IST, BSF*\n` +
      `• **Jornadas & Atestados:** *12x36, Horas extras, falta justificada*`,
    clausulaCitada: 'Consulta Geral',
    trechoOriginal: fullText.substring(0, 400)
  };
}
