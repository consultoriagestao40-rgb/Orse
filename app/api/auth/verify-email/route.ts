import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeAndConsultancyEmail } from '@/lib/email-verification';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  const baseUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=token_invalido', baseUrl));
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=token_inexistente', baseUrl));
    }

    // Checa expiração do token (24 horas)
    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      return NextResponse.redirect(new URL(`/cadastro?expired=true&email=${encodeURIComponent(user.email)}`, baseUrl));
    }

    // Ativa a conta
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    // Dispara o e-mail oficial de Boas-Vindas com Consultoria de Implementação e WhatsApp
    try {
      sendWelcomeAndConsultancyEmail({
        email: user.email,
        nome: user.nome,
        empresaNome: user.tenant?.nomeFantasia || undefined,
      }).catch(err => console.error('Erro ao enviar e-mail de boas-vindas:', err));
    } catch (e) {
      console.warn('Falha assíncrona no disparo de boas-vindas:', e);
    }

    // Loga o usuário automaticamente configurando os cookies de sessão
    const isProduction = process.env.NODE_ENV === 'production';
    const userData = {
      nome: user.nome,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
      iniciais: user.nome.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
      ...(user.tenant?.nomeFantasia ? { tenantNome: user.tenant.nomeFantasia } : {}),
      ...(user.tenant?.primaryColor ? { primaryColor: user.tenant.primaryColor } : {}),
    };

    const response = NextResponse.redirect(new URL('/?ativado=true', baseUrl));

    response.cookies.set('sb_session', user.email, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('sb_user', JSON.stringify(userData), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Erro ao verificar e-mail:', error);
    return NextResponse.redirect(new URL('/login?error=erro_verificacao', baseUrl));
  }
}
