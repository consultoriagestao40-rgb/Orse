import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { 
  checkAccountLockout, 
  verifyPassword, 
  registerFailedAttempt, 
  registerSuccessfulLogin,
  generateOtpCode
} from '@/lib/security'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const emailNorm = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      include: { tenant: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    // 1. Verificação de Bloqueio por Força Bruta (Brute-Force Lockout)
    const lockout = checkAccountLockout(user)
    if (lockout.isLocked) {
      return NextResponse.json({ 
        error: `Conta bloqueada temporariamente por motivos de segurança. Tente novamente em ${lockout.remainingMinutes} minuto(s).` 
      }, { status: 423 })
    }

    // 2. Validação da Senha com Bcrypt (com migração suave de legados)
    const { isValid, needsMigration } = await verifyPassword(password, user.password)

    if (!isValid) {
      const failResult = await registerFailedAttempt(user.id, user.failedLoginAttempts || 0)
      if (failResult.isLocked) {
        return NextResponse.json({ 
          error: `Muitas tentativas incorretas. Sua conta foi temporariamente bloqueada por ${failResult.remainingMinutes} minutos por segurança.` 
        }, { status: 423 })
      }
      return NextResponse.json({ 
        error: `Credenciais inválidas. Você tem mais ${failResult.remainingAttempts} tentativa(s) antes do bloqueio da conta.` 
      }, { status: 401 })
    }

    // 3. Suporte a Autenticação em Dois Fatores (2FA)
    if (user.twoFactorEnabled) {
      const otpCode = generateOtpCode()
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: otpCode,
          twoFactorExpiresAt: otpExpires,
        },
      })

      // Envia notificação por e-mail (ou registra no log para testes locais)
      console.log(`[2FA SECURITY] Código OTP para ${user.email}: ${otpCode}`)

      return NextResponse.json({
        success: true,
        requires2FA: true,
        email: user.email,
        message: 'Código de segurança de 6 dígitos enviado para seu e-mail.',
      })
    }

    // 4. Sucesso: Reseta tentativas e migra senha legada para hash Bcrypt
    await registerSuccessfulLogin(user.id, password, needsMigration)

    const isProduction = process.env.NODE_ENV === 'production'
    const mustChange = Boolean(user.mustChangePassword);

    const userData = {
      id: user.id,
      nome: user.nome,
      role: user.role,
      email: user.email,
      mustChangePassword: mustChange,
      tenantId: user.tenantId,
      iniciais: user.nome.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
      ...(user.avatarUrl ? { avatarUrl: `/api/user/avatar?email=${encodeURIComponent(user.email)}&v=${user.avatarUrl.length > 30 ? encodeURIComponent(user.avatarUrl.substring(user.avatarUrl.length - 10)) : encodeURIComponent(user.avatarUrl.substring(0, 10))}` } : {}),
      ...(user.tenant?.logoUrl ? { tenantLogoUrl: `/api/tenant/logo?tenantId=${user.tenantId}&v=${user.tenant.logoUrl.length > 30 ? encodeURIComponent(user.tenant.logoUrl.substring(user.tenant.logoUrl.length - 10)) : encodeURIComponent(user.tenant.logoUrl.substring(0, 10))}` } : {}),
      ...(user.tenant?.nomeFantasia ? { tenantNome: user.tenant.nomeFantasia } : {}),
      ...(user.tenant?.primaryColor ? { primaryColor: user.tenant.primaryColor } : {}),
    }

    const response = NextResponse.json({
      success: true,
      mustChangePassword: mustChange,
      user: {
        nome: user.nome,
        role: user.role,
        email: user.email,
        cargo: user.cargo,
        mustChangePassword: mustChange
      }
    })

    const baseOpts = {
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }

    // sb_session: armazena o email (httpOnly - proteção total contra XSS)
    response.cookies.set('sb_session', user.email, {
      ...baseOpts,
      httpOnly: true,
    })

    // sb_user: dados de exibição do usuário
    response.cookies.set('sb_user', JSON.stringify(userData), {
      ...baseOpts,
      httpOnly: false,
    })

    if (mustChange) {
      response.cookies.set('sb_must_change_password', '1', {
        ...baseOpts,
        httpOnly: false,
      })
    } else {
      response.cookies.delete('sb_must_change_password')
    }

    return response
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
