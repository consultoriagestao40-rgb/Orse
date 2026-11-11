import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/cctParser';
import { getSessionUser } from '@/lib/sessionUser';

export const runtime = 'nodejs';

function formatCnpj(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 14);
  if (clean.length !== 14) return digits;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

function formatCep(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 8);
  if (clean.length !== 8) return digits;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

function formatPhone(raw: string): string {
  const clean = raw.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return raw.trim();
}

interface ExtractedClientData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cep: string;
  endereco: string;
  email: string;
  whatsapp: string;
  contato: string;
  contatoCargo: string;
  cnaeDescricao?: string;
}

async function fetchCnpjFromPublicApis(cleanCnpj: string): Promise<Partial<ExtractedClientData> | null> {
  if (cleanCnpj.length !== 14) return null;

  // 1. Tenta BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SmartBidHub/1.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const d = await res.json();
      const logradouro = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ').trim();
      const numero = d.numero ? `Nº ${d.numero}` : '';
      const complemento = d.complemento ? String(d.complemento).trim() : '';
      const bairro = d.bairro ? String(d.bairro).trim() : '';
      const cidadeUf = [d.municipio, d.uf].filter(Boolean).join(' - ');
      const cepFmt = d.cep ? formatCep(String(d.cep)) : '';

      const endParts = [
        logradouro,
        numero,
        complemento,
        bairro,
        cidadeUf,
        cepFmt ? `CEP: ${cepFmt}` : '',
      ].filter(Boolean);

      const socio = Array.isArray(d.qsa) && d.qsa.length > 0 ? d.qsa[0] : null;
      const rawPhone = d.ddd_telefone_1 || d.ddd_telefone_2 || '';

      return {
        cnpj: formatCnpj(cleanCnpj),
        razaoSocial: (d.razao_social || '').trim(),
        nomeFantasia: (d.nome_fantasia || d.razao_social || '').trim(),
        cep: cepFmt,
        endereco: endParts.join(', '),
        email: (d.email || '').toLowerCase().trim(),
        whatsapp: rawPhone ? formatPhone(String(rawPhone)) : '',
        contato: socio?.nome_socio ? String(socio.nome_socio).trim() : '',
        contatoCargo: socio?.qualificacao_socio ? String(socio.qualificacao_socio).replace(/^\d+\s*-\s*/, '').trim() : '',
        cnaeDescricao: d.cnae_fiscal_descricao || '',
      };
    }
  } catch (e) {
    console.warn('[CNPJ Lookup] BrasilAPI falhou, tentando ReceitaWS...', e);
  }

  // 2. Fallback: ReceitaWS
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SmartBidHub/1.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const d = await res.json();
      if (d && d.status !== 'ERROR') {
        const cepFmt = d.cep ? formatCep(String(d.cep)) : '';
        const endParts = [
          d.logradouro,
          d.numero ? `Nº ${d.numero}` : '',
          d.complemento,
          d.bairro,
          [d.municipio, d.uf].filter(Boolean).join(' - '),
          cepFmt ? `CEP: ${cepFmt}` : '',
        ].filter(Boolean);

        const socio = Array.isArray(d.qsa) && d.qsa.length > 0 ? d.qsa[0] : null;
        const firstPhone = d.telefone ? String(d.telefone).split('/')[0].trim() : '';

        return {
          cnpj: formatCnpj(cleanCnpj),
          razaoSocial: (d.nome || '').trim(),
          nomeFantasia: (d.fantasia || d.nome || '').trim(),
          cep: cepFmt,
          endereco: endParts.join(', '),
          email: (d.email || '').toLowerCase().trim(),
          whatsapp: firstPhone ? formatPhone(firstPhone) : '',
          contato: socio?.nome ? String(socio.nome).trim() : '',
          contatoCargo: socio?.qual ? String(socio.qual).replace(/^\d+\s*-\s*/, '').trim() : '',
          cnaeDescricao: d.atividade_principal?.[0]?.text || '',
        };
      }
    }
  } catch (e) {
    console.warn('[CNPJ Lookup] ReceitaWS falhou, tentando CNPJ.ws...', e);
  }

  // 3. Fallback: Publica CNPJ.ws
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SmartBidHub/1.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const d = await res.json();
      const est = d.estabelecimento || {};
      const cepFmt = est.cep ? formatCep(String(est.cep)) : '';
      const logradouro = [est.tipo_logradouro, est.logradouro].filter(Boolean).join(' ').trim();
      const endParts = [
        logradouro,
        est.numero ? `Nº ${est.numero}` : '',
        est.complemento,
        est.bairro,
        [est.cidade?.nome, est.estado?.sigla].filter(Boolean).join(' - '),
        cepFmt ? `CEP: ${cepFmt}` : '',
      ].filter(Boolean);

      const socio = Array.isArray(d.socios) && d.socios.length > 0 ? d.socios[0] : null;
      const phone = est.ddd1 && est.telefone1 ? `${est.ddd1}${est.telefone1}` : '';

      return {
        cnpj: formatCnpj(cleanCnpj),
        razaoSocial: (d.razao_social || '').trim(),
        nomeFantasia: (est.nome_fantasia || d.razao_social || '').trim(),
        cep: cepFmt,
        endereco: endParts.join(', '),
        email: (est.email || '').toLowerCase().trim(),
        whatsapp: phone ? formatPhone(phone) : '',
        contato: socio?.nome ? String(socio.nome).trim() : '',
        contatoCargo: socio?.qualificacao_socio?.descricao || '',
        cnaeDescricao: est.atividade_principal?.descricao || '',
      };
    }
  } catch (e) {
    console.warn('[CNPJ Lookup] CNPJ.ws falhou:', e);
  }

  return null;
}

function parseClientPdfText(rawText: string): Partial<ExtractedClientData> {
  const text = rawText.replace(/\r/g, '\n');
  const result: Partial<ExtractedClientData> = {};

  // 1. Extrair CNPJ
  const cnpjMatch = text.match(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/);
  if (cnpjMatch) {
    const digits = cnpjMatch[1].replace(/\D/g, '');
    if (digits.length === 14) {
      result.cnpj = formatCnpj(digits);
    }
  }

  // 2. Extrair Razão Social (Padrão Cartão CNPJ da Receita Federal ou Ficha Cadastral)
  const razaoCartaoMatch = text.match(/NOME\s+EMPRESARIAL\s*\n+\s*([^\n]+)/i);
  const razaoFichaMatch = text.match(/(?:RAZ[ÃA]O\s+SOCIAL|EMPRESA|DENOMINA[ÇC][ÃA]O\s+SOCIAL)\s*[:\-]\s*([^\n]+)/i);
  if (razaoCartaoMatch && razaoCartaoMatch[1].trim() && !/T[ÍI]TULO\s+DO\s+ESTABELECIMENTO/i.test(razaoCartaoMatch[1])) {
    result.razaoSocial = razaoCartaoMatch[1].trim();
  } else if (razaoFichaMatch && razaoFichaMatch[1].trim()) {
    result.razaoSocial = razaoFichaMatch[1].trim();
  }

  // 3. Extrair Nome Fantasia
  const fantasiaCartaoMatch = text.match(/\(NOME\s+DE\s+FANTASIA\)\s*\n+\s*([^\n]+)/i);
  const fantasiaFichaMatch = text.match(/NOME\s*(?:DE\s*)?FANTASIA\s*[:\-]\s*([^\n]+)/i);
  if (fantasiaCartaoMatch && fantasiaCartaoMatch[1].trim()) {
    const val = fantasiaCartaoMatch[1].replace(/PORTE\s*$/i, '').trim();
    if (val && !/^\*+$/.test(val) && !/^PORTE$/i.test(val)) {
      result.nomeFantasia = val;
    }
  } else if (fantasiaFichaMatch && fantasiaFichaMatch[1].trim()) {
    const val = fantasiaFichaMatch[1].trim();
    if (val && !/^\*+$/.test(val)) {
      result.nomeFantasia = val;
    }
  }

  // 4. Extrair CEP
  const cepMatch = text.match(/\b(\d{2}\.?\d{3}-\d{3})\b/) || text.match(/CEP\s*[:\-]?\s*(\d{5}-?\d{3})/i);
  if (cepMatch) {
    result.cep = formatCep(cepMatch[1]);
  }

  // 5. Extrair E-mail
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.email = emailMatch[1].toLowerCase().trim();
  }

  // 6. Extrair Telefone / WhatsApp
  const phoneCartaoMatch = text.match(/TELEFONE\s*\n+\s*(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/i);
  const phoneFichaMatch = text.match(/(?:TELEFONE|WHATSAPP|CELULAR|FONE|CONTATO\s+TELEF[ÔO]NICO)\s*[:\-]?\s*(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/i);
  const genericPhoneMatch = text.match(/(\(\d{2}\)\s*\d{4,5}[-\s]?\d{4})/);
  const rawPhone = phoneCartaoMatch?.[1] || phoneFichaMatch?.[1] || genericPhoneMatch?.[1] || '';
  if (rawPhone) {
    result.whatsapp = formatPhone(rawPhone);
  }

  // 7. Extrair Endereço (Cartão CNPJ ou Ficha Cadastral)
  const logradouroCartao = text.match(/LOGRADOURO\s*\n+\s*([^\n]+)/i)?.[1]?.trim() || '';
  const numeroCartao = text.match(/N[ÚU]MERO\s*\n+\s*([^\n]+)/i)?.[1]?.trim() || '';
  const bairroCartao = text.match(/BAIRRO\/DISTRITO\s*\n+\s*([^\n]+)/i)?.[1]?.trim() || '';
  const municipioCartao = text.match(/MUNIC[ÍI]PIO\s*\n+\s*([^\n]+)/i)?.[1]?.trim() || '';
  const ufCartao = text.match(/\bUF\s*\n+\s*([A-Z]{2})\b/i)?.[1]?.trim() || '';

  if (logradouroCartao && !/N[ÚU]MERO|COMPLEMENTO/i.test(logradouroCartao)) {
    const parts = [
      logradouroCartao,
      numeroCartao && !/COMPLEMENTO/i.test(numeroCartao) ? `Nº ${numeroCartao}` : '',
      bairroCartao && !/MUNIC[ÍI]PIO/i.test(bairroCartao) ? bairroCartao : '',
      [municipioCartao, ufCartao].filter(Boolean).join(' - '),
      result.cep ? `CEP: ${result.cep}` : '',
    ].filter(Boolean);
    result.endereco = parts.join(', ');
  } else {
    const enderecoFichaMatch = text.match(/(?:ENDERE[ÇC]O(?:\s+COMPLETO|\s+COMERCIAL)?|LOGRADOURO)\s*[:\-]\s*([^\n]+)/i);
    if (enderecoFichaMatch && enderecoFichaMatch[1].trim()) {
      result.endereco = enderecoFichaMatch[1].trim();
    }
  }

  // 8. Extrair Contato / Responsável e Cargo (Ficha Cadastral)
  const contatoMatch = text.match(/(?:CONTATO|RESPONS[ÁA]VEL|REPRESENTANTE(?:\s+LEGAL)?|S[ÓO]CIO(?:\s+ADMINISTRADOR)?|COMPRADOR)\s*[:\-]\s*([^\n]+)/i);
  if (contatoMatch && contatoMatch[1].trim()) {
    result.contato = contatoMatch[1].trim();
  }

  const cargoMatch = text.match(/(?:CARGO|FUN[ÇC][ÃA]O|QUALIFICA[ÇC][ÃA]O)\s*[:\-]\s*([^\n]+)/i);
  if (cargoMatch && cargoMatch[1].trim()) {
    result.contatoCargo = cargoMatch[1].trim();
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // MODO 1: Busca direta por CNPJ (JSON)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const cleanCnpj = String(body.cnpj || '').replace(/\D/g, '');
      if (cleanCnpj.length !== 14) {
        return NextResponse.json({
          success: false,
          error: 'Informe um CNPJ válido com 14 dígitos.',
        }, { status: 400 });
      }

      const apiData = await fetchCnpjFromPublicApis(cleanCnpj);
      if (!apiData) {
        return NextResponse.json({
          success: false,
          error: 'Não foi possível localizar os dados deste CNPJ na Receita Federal no momento.',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        source: 'RECEITA_FEDERAL',
        data: apiData,
      });
    }

    // MODO 2: Upload de Arquivo PDF (Cartão CNPJ ou Ficha Cadastral)
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('pdf')) as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const textoBruto = await extractTextFromPdf(buffer);
    if (!textoBruto || textoBruto.trim().length < 15) {
      return NextResponse.json({
        success: false,
        error: 'O PDF não contém texto selecionável (pode ser uma imagem escaneada). Você também pode digitar o CNPJ diretamente para puxar os dados.',
      }, { status: 400 });
    }

    const pdfExtracted = parseClientPdfText(textoBruto);

    // Se encontrou um CNPJ válido dentro do PDF, enriquece automaticamente com a consulta oficial da Receita Federal!
    let apiData: Partial<ExtractedClientData> | null = null;
    if (pdfExtracted.cnpj) {
      const cleanCnpj = pdfExtracted.cnpj.replace(/\D/g, '');
      if (cleanCnpj.length === 14) {
        apiData = await fetchCnpjFromPublicApis(cleanCnpj);
      }
    }

    const merged: ExtractedClientData = {
      cnpj: pdfExtracted.cnpj || apiData?.cnpj || '',
      razaoSocial: pdfExtracted.razaoSocial || apiData?.razaoSocial || '',
      nomeFantasia: pdfExtracted.nomeFantasia || apiData?.nomeFantasia || pdfExtracted.razaoSocial || apiData?.razaoSocial || '',
      cep: pdfExtracted.cep || apiData?.cep || '',
      endereco: pdfExtracted.endereco || apiData?.endereco || '',
      email: pdfExtracted.email || apiData?.email || '',
      whatsapp: pdfExtracted.whatsapp || apiData?.whatsapp || '',
      contato: pdfExtracted.contato || apiData?.contato || '',
      contatoCargo: pdfExtracted.contatoCargo || apiData?.contatoCargo || '',
      cnaeDescricao: apiData?.cnaeDescricao || '',
    };

    return NextResponse.json({
      success: true,
      source: apiData ? 'PDF_AND_RECEITA' : 'PDF',
      data: merged,
    });
  } catch (error: any) {
    console.error('[API /api/clientes/extract] Erro:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Erro ao processar os dados do cliente.',
    }, { status: 500 });
  }
}
