import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Verifica se uma string já é um hash Bcrypt válido
 */
export function isBcryptHash(str?: string | null): boolean {
  if (!str) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

/**
 * Gera o hash Bcrypt de uma senha
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Valida a senha fornecida comparando com o hash do banco.
 * Suporta migração automática (lazy migration): se o banco ainda tiver a senha
 * em texto puro legado, compara diretamente e indica se precisa ser migrada.
 */
export async function verifyPassword(
  providedPassword: string,
  storedPasswordOrHash: string
): Promise<{ isValid: boolean; needsMigration: boolean }> {
  if (!storedPasswordOrHash) {
    return { isValid: false, needsMigration: false };
  }

  // Se já é um hash Bcrypt, faz a comparação segura
  if (isBcryptHash(storedPasswordOrHash)) {
    const isValid = await bcrypt.compare(providedPassword, storedPasswordOrHash);
    return { isValid, needsMigration: false };
  }

  // Fallback para senhas legadas em texto plano (migração suave)
  const isPlainMatch = providedPassword === storedPasswordOrHash;
  return { isValid: isPlainMatch, needsMigration: isPlainMatch };
}

/**
 * Validação rigorosa de Política de Senhas Fortes
 * - Mínimo de 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number; // 0 a 4
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres.');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula.');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula.');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número.');
  } else {
    score++;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%&*).');
  } else {
    score++;
  }

  return {
    valid: errors.length === 0,
    score: Math.min(score, 4),
    errors,
  };
}

/**
 * Verifica se a conta do usuário está atualmente bloqueada por tentativas excessivas
 */
export function checkAccountLockout(user: { lockedUntil?: Date | string | null }): {
  isLocked: boolean;
  remainingMinutes: number;
} {
  if (!user.lockedUntil) {
    return { isLocked: false, remainingMinutes: 0 };
  }

  const lockTime = new Date(user.lockedUntil).getTime();
  const now = Date.now();

  if (lockTime > now) {
    const remainingMinutes = Math.ceil((lockTime - now) / (60 * 1000));
    return { isLocked: true, remainingMinutes };
  }

  return { isLocked: false, remainingMinutes: 0 };
}

/**
 * Registra uma tentativa de login falha e bloqueia se atingir o limite
 */
export async function registerFailedAttempt(userId: string, currentAttempts = 0): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  remainingMinutes?: number;
}> {
  const newAttempts = currentAttempts + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      },
    });

    return {
      isLocked: true,
      remainingAttempts: 0,
      remainingMinutes: LOCKOUT_MINUTES,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
    },
  });

  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts,
  };
}

/**
 * Reseta o contador de tentativas após um login bem-sucedido e aplica hash se necessário
 */
export async function registerSuccessfulLogin(
  userId: string,
  providedPassword?: string,
  needsMigration = false
): Promise<void> {
  const dataToUpdate: any = {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastActive: new Date(),
  };

  // Se a senha estava em texto plano legado, migra silenciosamente para Bcrypt
  if (needsMigration && providedPassword) {
    dataToUpdate.password = await hashPassword(providedPassword);
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });
}

/**
 * Gera código OTP numérico de 6 dígitos para 2FA
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
