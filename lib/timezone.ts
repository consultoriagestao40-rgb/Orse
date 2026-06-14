/**
 * Utilitário de Fuso Horário para o sistema Orse (Slimpe)
 */

/**
 * Obtém o fuso horário ativo para o usuário logado.
 * Se o usuário não tiver configurado ou estiver fora do browser,
 * retorna o fuso padrão ('America/Sao_Paulo').
 */
export function getUserTimezone(): string {
  if (typeof window === 'undefined') return 'America/Sao_Paulo';
  
  try {
    // Tenta obter do cache rápido do LocalStorage
    const cachedTz = localStorage.getItem('sb_user_timezone');
    if (cachedTz) return cachedTz;

    // Tenta obter do cookie do usuário
    const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
    if (cookie) {
      let cleaned = cookie.split('=')[1].trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      const decoded = JSON.parse(decodeURIComponent(cleaned));
      if (decoded.timezone) {
        localStorage.setItem('sb_user_timezone', decoded.timezone);
        return decoded.timezone;
      }
    }
  } catch (e) {
    console.error('Erro ao obter fuso horário nas preferências do cookie:', e);
  }
  
  return 'America/Sao_Paulo'; // Fuso horário padrão do Brasil
}

/**
 * Garante que a data seja interpretada corretamente como UTC (GMT)
 * antes de fazer qualquer formatação para fuso local.
 */
export function parseDateUTC(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  let dateStr = String(dateInput).trim();
  
  // Se for timestamp no formato postgres 'YYYY-MM-DD HH:MM:SS.ms' sem timezone
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(dateStr)) {
    dateStr = dateStr.replace(' ', 'T');
  }

  // Se for formato ISO mas sem especificação de Z ou fuso offset, força o sufixo Z (UTC)
  if (dateStr.includes('T') && !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    dateStr += 'Z';
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(dateInput) : parsed;
}

/**
 * Formata apenas a hora no fuso horário do usuário (hh:mm)
 */
export function formatTimeBrasilia(dateInput: any): string {
  try {
    const date = parseDateUTC(dateInput);
    return date.toLocaleTimeString('pt-BR', {
      timeZone: getUserTimezone(),
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
}

/**
 * Formata data e hora no fuso horário do usuário (DD/MM/AAAA hh:mm)
 */
export function formatDateTimeBrasilia(dateInput: any): string {
  try {
    const date = parseDateUTC(dateInput);
    const tz = getUserTimezone();
    const datePart = date.toLocaleDateString('pt-BR', {
      timeZone: tz
    });
    const timePart = date.toLocaleTimeString('pt-BR', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart} ${timePart}`;
  } catch (e) {
    return '';
  }
}
