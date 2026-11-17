export interface ProposalShareContext {
  docId: string;
  numeroFPV?: number | string | null;
  versaoFPV?: number | string | null;
  clienteNome?: string | null;
  contatoNome?: string | null;
  contatoWhatsApp?: string | null;
  empresaEmissora?: string | null;
  codigoAcessoCustom?: string | null;
  valorTotal?: number | null;
  tipoServicos?: string | null;
  objetoProposta?: string | null;
  tipoProposta?: string | null;
  cargoPrincipal?: string | null;
}

export function slugifyAscii(input?: string | null, maxLen = 28): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '');
}

export function formatProposalCode(
  numeroFPV?: number | string | null,
  versaoFPV?: number | string | null
): string {
  const num = String(numeroFPV || 1).padStart(3, '0');
  const rev = String(versaoFPV || 1).padStart(2, '0');
  return `FPV-${num}-R${rev}`;
}

export function buildExecutiveProposalSlug(ctx: {
  docId: string;
  numeroFPV?: number | string | null;
  versaoFPV?: number | string | null;
  clienteNome?: string | null;
}): string {
  return ctx.docId.length > 8 ? ctx.docId.slice(-8) : ctx.docId;
}

export function buildExecutiveProposalUrl(ctx: {
  docId: string;
  numeroFPV?: number | string | null;
  versaoFPV?: number | string | null;
  clienteNome?: string | null;
}): string {
  const slug = buildExecutiveProposalSlug(ctx);
  return `https://smartbidhub.com.br/p/${slug}`;
}

const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'por', 'a', 'o', 'as', 'os']);

function smartTitleCase(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      if (word.length <= 3 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function stripHtmlPlain(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCompactClientName(raw?: string | null): string {
  const base = (raw || 'Cliente')
    .replace(/\b(LTDA\.?|S\/A|S\.A\.|EIRELI|MEI|ME|EPP|SS)\b/gi, '')
    .replace(/\s*-\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return 'Cliente';
  // Se estiver todo em CAIXA ALTA (e tiver mais de 4 letras), converte para Title Case harmônico
  if (base.length > 4 && base === base.toUpperCase()) {
    return smartTitleCase(base);
  }
  return base;
}

/**
 * Título conciso e relativo à proposta, sem repetir o cliente e sem estourar/cortar no celular:
 * Ex.: "Proposta FPV-063 · R01"
 */
export function buildProposalCardHeadline(params: {
  tipoServicos?: string | null;
  objetoProposta?: string | null;
  cargoPrincipal?: string | null;
  numeroFPV?: number | string | null;
  versaoFPV?: number | string | null;
  clienteNome?: string | null;
}): string {
  const code = formatProposalCode(params.numeroFPV, params.versaoFPV).replace(/-R/, ' · R');
  return `Proposta ${code}`;
}

/**
 * Subtítulo harmônico em cinza suave com cliente (sem repetição) + valor da proposta:
 * Ex.: "Transportadora Taborda · R$ 29.867,89/mês" (Recorrente) ou "Zober SP 02 · R$ 36.572,18" (SPOT)
 */
export function buildProposalCardSubtitle(params: {
  clienteNome?: string | null;
  valorTotal?: number | null;
  tipoProposta?: string | null;
  empresaEmissora?: string | null;
}): string {
  const cliente = cleanCompactClientName(params.clienteNome);
  const val = Number(params.valorTotal || 0);
  if (val > 0) {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
    const isSpot = String(params.tipoProposta || '').toUpperCase() === 'SPOT';
    return isSpot ? `${cliente} · ${formatted}` : `${cliente} · ${formatted}/mês`;
  }
  return `${cliente} · ${params.empresaEmissora || 'SmartBid Hub'}`;
}

export function normalizeWhatsAppDigits(raw?: string | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    return `55${digits}`;
  }
  return digits;
}

export function maskBrazilPhone(raw?: string | null): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Envia o link limpo para que o WhatsApp renderize exclusivamente o Card Executivo SmartBid
 * (adicionando o PIN apenas caso a proposta possua senha personalizada configurada)
 */
export function buildExecutiveWhatsAppMessage(ctx: ProposalShareContext): string {
  const shareUrl = buildExecutiveProposalUrl(ctx);
  const pin = (ctx.codigoAcessoCustom || '').trim();
  if (pin) {
    return `${shareUrl}\n🔑 Código de acesso: ${pin}`;
  }
  return shareUrl;
}

export function buildWhatsAppWebUrl(rawPhone: string | null | undefined, message: string): string {
  const cleanPhone = normalizeWhatsAppDigits(rawPhone);
  const encoded = encodeURIComponent(message);
  if (cleanPhone.length >= 12) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
