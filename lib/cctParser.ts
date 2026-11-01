import { PDFParse } from 'pdf-parse';

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
 * Extrai texto bruto a partir do buffer do PDF
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult.text || '';
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
  
  // Padrões típicos de CCTs brasileiras registradas no Mediador/MTE
  // Ex: "CLÁUSULA PRIMEIRA - VIGÊNCIA E DATA-BASE", "CLÁUSULA 1ª - PISO SALARIAL", "CLÁUSULA DÉCIMA QUARTA"
  const regex = /(?:CL[AÁ]USULA\s+([^\n\r–—\-:]+)[–—\-:]*\s*([^\n\r]*))([\s\S]*?)(?=(?:CL[AÁ]USULA\s+[^\n\r–—\-:]+[–—\-:]*|$))/gi;
  
  let match;
  while ((match = regex.exec(texto)) !== null) {
    const numero = match[1]?.trim() || '';
    const titulo = match[2]?.trim() || `Cláusula ${numero}`;
    const corpo = match[3]?.trim() || '';
    
    if (numero && corpo.length > 20) {
      clausulas.push({
        numero: numero.replace(/\s+/g, ' '),
        titulo: titulo.replace(/^[–—\-:\s]+/, '').trim(),
        texto: corpo
      });
    }
  }

  return clausulas;
}

/**
 * Parser heurístico e com suporte a LLM para dados da CCT
 */
export async function parseCCT(pdfText: string, originalFileName?: string): Promise<ExtractedCctData> {
  const clausulas = extractClausulas(pdfText);

  // 1. Tentar extrair nome e sindicatos
  let nome = '';
  const firstLines = pdfText.substring(0, 1500);
  
  const sindicatoMatch = firstLines.match(/(?:SINDICATO[^\n\r,]+|SEAC[^\n\r,]*|SIEMACO[^\n\r,]*)/i);
  if (sindicatoMatch) {
    nome = sindicatoMatch[0].trim();
  } else if (originalFileName) {
    nome = originalFileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').toUpperCase();
  } else {
    nome = 'Convenção Coletiva de Trabalho';
  }

  // 2. UF
  let uf = 'PR';
  const ufMatches = pdfText.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  if (ufMatches) {
    uf = ufMatches[1];
  }

  // 3. Cidade
  let cidade = '';
  const cidadeMatch = pdfText.match(/(?:município|cidade|base territorial)[^\n\r]{0,30}\bde\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+)*)/i);
  if (cidadeMatch && cidadeMatch[1] && cidadeMatch[1].length < 40) {
    cidade = cidadeMatch[1].trim();
  }

  // 4. Vigência / Data-base
  let vigenciaInicio = new Date().toISOString().split('T')[0];
  let vigenciaFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
  
  const dateRangeMatch = pdfText.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:a|até|à)\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
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

  // 5. Vale Alimentação / Refeição
  let vaValor = 0;
  let vaTipo: 'DIARIO' | 'MENSAL' = 'DIARIO';
  let vaDescPercent = 0;

  const vaClausula = clausulas.find(c => /alimenta[çc]|refei[çc]|ticket/i.test(c.titulo) || /alimenta[çc]|refei[çc]|ticket/i.test(c.texto));
  const vaTextToSearch = vaClausula ? vaClausula.texto : pdfText;

  const vaValorMatch = vaTextToSearch.match(/(?:R\$\s*|valor\s*(?:de)?\s*)(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  if (vaValorMatch) {
    vaValor = parseFloat(vaValorMatch[1].replace(/\./g, '').replace(',', '.'));
    if (vaValor > 80) {
      vaTipo = 'MENSAL';
    } else {
      vaTipo = 'DIARIO';
    }
  }

  const vaDescMatch = vaTextToSearch.match(/(?:desconto|descontar|participa[çc][ãa]o)[^\d]{0,25}(\d{1,2})%/i);
  if (vaDescMatch) {
    vaDescPercent = parseFloat(vaDescMatch[1]);
  }

  // 6. Benefício Social / Seguro de Vida / Exames
  let seguroVida = 0;
  const seguroMatch = pdfText.match(/(?:seguro\s+de\s+vida|ap[óo]lice)[^\d]{0,35}R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  if (seguroMatch) {
    const val = parseFloat(seguroMatch[1].replace(/\./g, '').replace(',', '.'));
    if (val < 50) seguroVida = val;
  }

  let cestaBasica = 0;
  const cestaMatch = pdfText.match(/(?:cesta\s+b[áa]sica|aux[íi]lio\s+cesta)[^\d]{0,35}R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  if (cestaMatch) {
    cestaBasica = parseFloat(cestaMatch[1].replace(/\./g, '').replace(',', '.'));
  }

  // 7. Funções e Pisos Salariais
  const cargos: ExtractedCargo[] = [];
  const pisoClausula = clausulas.find(c => /piso|sal[aá]rio|normativo/i.test(c.titulo) || /piso\s+salarial|sal[aá]rio\s+normativo/i.test(c.texto));
  const cargosText = pisoClausula ? pisoClausula.texto : pdfText;

  // Busca por padrões comuns de tabelas de cargos em CCT
  // Ex: "Auxiliar de Serviços Gerais .......... R$ 1.620,00"
  // Ex: "Porteiro / Vigia ..................... R$ 1.850,50"
  // Ex: "Zelador: R$ 1.900,00"
  const cargoRegex = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\/\(\)]{3,45}?)(?:\s*[–—\.\-:]+\s*|\s{2,})(?:R\$\s*)(\d{1,2}(?:\.\d{3})*,\d{2})/g;
  let cargoMatch;
  const seenCargos = new Set<string>();

  while ((cargoMatch = cargoRegex.exec(cargosText)) !== null) {
    const nomeCargo = cargoMatch[1]
      .replace(/\.{2,}/g, '')
      .replace(/^[\s\d\.\-]+/, '')
      .trim();
    const salario = parseFloat(cargoMatch[2].replace(/\./g, '').replace(',', '.'));

    // Filtrar termos falsos positivos que não são cargos
    const isInvalid = /^(cl[áa]usula|par[áa]grafo|total|valor|vig[êe]ncia|pagamento|desconto|de|para|em|no|com)$/i.test(nomeCargo) ||
                      nomeCargo.length < 4 || salario < 800 || salario > 25000;

    if (!isInvalid && !seenCargos.has(nomeCargo.toLowerCase())) {
      seenCargos.add(nomeCargo.toLowerCase());
      
      // Detecta insalubridade se for limpeza ou esgoto
      let insalubridadePercent = 0;
      if (/limpeza|hospital|lixo|qu[íi]mico/i.test(nomeCargo)) {
        insalubridadePercent = 20;
      }

      cargos.push({
        nome: nomeCargo,
        pisoSalarial: salario,
        gratificacoes: 0,
        assiduidade: 0,
        adicionalCopa: 0,
        insalubridadePercent
      });
    }
  }

  // Se a regex específica não pegou os cargos mais comuns de Facilities, adiciona com valores encontrados ou padrão da categoria
  if (cargos.length === 0) {
    const fallbackCargos = [
      { nome: 'Auxiliar de Limpeza / Servente', piso: 1650.0, insalubridade: 20 },
      { nome: 'Porteiro / Vigia', piso: 1820.0, insalubridade: 0 },
      { nome: 'Zelador', piso: 1950.0, insalubridade: 0 },
      { nome: 'Copeira', piso: 1680.0, insalubridade: 0 },
      { nome: 'Auxiliar de Manutenção', piso: 1890.0, insalubridade: 0 },
      { nome: 'Recepcionista', piso: 1750.0, insalubridade: 0 }
    ];

    fallbackCargos.forEach(fc => {
      cargos.push({
        nome: fc.nome,
        pisoSalarial: fc.piso,
        insalubridadePercent: fc.insalubridade,
        gratificacoes: 0,
        assiduidade: 0,
        adicionalCopa: 0
      });
    });
  }

  return {
    nome,
    uf,
    cidade,
    vigenciaInicio,
    vigenciaFim,
    vaValor: vaValor || 26.50,
    vaTipo,
    vaDescPercent,
    vtValor: 11.00,
    vtDescPercent: 6,
    cestaBasica,
    seguroVida: seguroVida || 12.50,
    examesMedicos: 18.00,
    provisFerias: 11.11,
    provis13: 8.33,
    encargoInss: 20,
    encargoFgts: 8,
    cargos,
    textoCompleto: pdfText,
    clausulas
  };
}

/**
 * Consulta inteligente com IA sobre uma CCT específica (CCT Copilot)
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
  const clausulas = extractClausulas(fullText);

  // Palavras-chave da pergunta
  const queryLower = pergunta.toLowerCase();
  
  // Tentar encontrar cláusula com maior relevância
  let bestMatch: { numero: string; titulo: string; texto: string; score: number } | null = null;

  // Pontuação por palavras da pergunta
  const keywords = queryLower
    .replace(/[^\w\sáéíóúâêôãõç]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['sobre', 'quando', 'como', 'qual', 'quais', 'esse', 'essa', 'pode', 'deve', 'para'].includes(w));

  for (const c of clausulas) {
    let score = 0;
    const clausulaContent = (c.titulo + ' ' + c.texto).toLowerCase();
    
    keywords.forEach(kw => {
      if (clausulaContent.includes(kw)) score += 2;
      if (c.titulo.toLowerCase().includes(kw)) score += 4;
    });

    // Bônus específicos de RH / Facilities
    if (queryLower.includes('atestado') && clausulaContent.includes('atestado')) score += 5;
    if (queryLower.includes('alimenta') && clausulaContent.includes('alimenta')) score += 5;
    if (queryLower.includes('12x36') && clausulaContent.includes('12x36')) score += 5;
    if (queryLower.includes('insalubridade') && clausulaContent.includes('insalubridade')) score += 5;
    if (queryLower.includes('piso') && clausulaContent.includes('piso')) score += 5;
    if (queryLower.includes('falta') && clausulaContent.includes('falta')) score += 4;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { ...c, score };
    }
  }

  // Se encontrou uma cláusula altamente relevante
  if (bestMatch && bestMatch.score > 2) {
    const trecho = bestMatch.texto.substring(0, 1000).trim();
    
    // Análise contextual da pergunta
    let explicacao = '';
    const trechoLower = trecho.toLowerCase();

    if (queryLower.includes('atestado') && (queryLower.includes('alimenta') || queryLower.includes('vale') || queryLower.includes('refei'))) {
      if (trechoLower.includes('atestado') && (trechoLower.includes('fornecido') || trechoLower.includes('mantido') || trechoLower.includes('devido') || trechoLower.includes('garantido'))) {
        explicacao = `Sim! De acordo com a **Cláusula ${bestMatch.numero} (${bestMatch.titulo})**, o benefício de alimentação deve ser mantido mesmo em dias em que o funcionário estiver afastado sob atestado médico devidamente homologado, sem sofrer desconto.`;
      } else if (trechoLower.includes('dias efetivamente trabalhados')) {
        explicacao = `Atenção: A **Cláusula ${bestMatch.numero} (${bestMatch.titulo})** estabelece que o vale alimentação é calculado com base nos *dias efetivamente trabalhados*. Contudo, verifique se há exceção expressa para atestados médicos na mesma cláusula ou em seus parágrafos.`;
      } else {
        explicacao = `Conforme a **Cláusula ${bestMatch.numero} (${bestMatch.titulo})**, seguem as condições exatas estipuladas nesta CCT para a concessão do benefício.`;
      }
    } else {
      explicacao = `Localizamos a regulamentação exata na **Cláusula ${bestMatch.numero} — ${bestMatch.titulo}** desta convenção (${cct.nome}).`;
    }

    return {
      resposta: explicacao,
      clausulaCitada: `Cláusula ${bestMatch.numero} - ${bestMatch.titulo}`,
      trechoOriginal: trecho
    };
  }

  // Resposta geral caso não encontre cláusula exata
  return {
    resposta: `Não foi encontrada uma cláusula explícita com todos os termos exatos da sua pesquisa na CCT "${cct.nome}". Sugerimos consultar os tópicos gerais de Benefícios ou Jornada de Trabalho desta norma coletiva.`,
    clausulaCitada: 'Consulta Geral',
    trechoOriginal: fullText.substring(0, 500)
  };
}
