export interface ProposalShareContext {
  docId: string;
  numeroFPV?: number | string | null;
  versaoFPV?: number | string | null;
  clienteNome?: string | null;
  contatoNome?: string | null;
  contatoWhatsApp?: string | null;
  empresaEmissora?: string | null;
  codigoAcessoCustom?: string | null;
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
  const num = String(ctx.numeroFPV || 1).padStart(3, '0');
  const rev = String(ctx.versaoFPV || 1).padStart(2, '0');
  const clientPart = slugifyAscii(ctx.clienteNome, 26);
  const tail = ctx.docId.length > 10 ? ctx.docId.slice(-10) : ctx.docId;
  return ['fpv', num, `r${rev}`, clientPart || null, tail].filter(Boolean).join('-');
}

export function buildExecutiveProposalUrl(ctx: {
  docId: string;
  numeroFPV?: number | string | null;
  versaoFPV?: number | string | null;
  clienteNome?: string | null;
}): string {
  const slug = buildExecutiveProposalSlug(ctx);
  return `https://www.smartbidhub.com.br/p/${slug}`;
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

export function buildExecutiveWhatsAppMessage(ctx: ProposalShareContext): string {
  const shareUrl = buildExecutiveProposalUrl(ctx);
  const code = formatProposalCode(ctx.numeroFPV, ctx.versaoFPV);
  const firstContactName = (ctx.contatoNome || '').trim().split(/\s+/)[0] || '';
  const greeting = firstContactName ? `Olá, *${firstContactName}*! Tudo bem?` : `Olá! Tudo bem?`;
  const cliente = (ctx.clienteNome || '').trim();
  const pin = (ctx.codigoAcessoCustom || '').trim();

  const lines: string[] = [
    greeting,
    '',
    cliente
      ? `Encaminho o acesso digital à nossa *Proposta Comercial (${code})* elaborada para *${cliente}*:`
      : `Encaminho o acesso digital à nossa *Proposta Comercial (${code})*:`,
    '',
    shareUrl,
    '',
    `Pelo link seguro você visualiza a apresentação, o detalhamento da proposta e realiza o aceite eletrônico.`,
  ];

  if (pin) {
    lines.push(`🔑 *Código de acesso:* ${pin}`);
  }

  lines.push(`Qualquer dúvida, fico à disposição!`);
  return lines.join('\n');
}

export function buildWhatsAppWebUrl(rawPhone: string | null | undefined, message: string): string {
  const cleanPhone = normalizeWhatsAppDigits(rawPhone);
  const encoded = encodeURIComponent(message);
  if (cleanPhone.length >= 12) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
