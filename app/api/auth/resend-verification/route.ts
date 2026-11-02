import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationEmail } from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'E-mail é obrigatório.' },
        { status: 400 }
      );
    }

    const result = await resendVerificationEmail(email);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na rota resend-verification:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar reenvio.' },
      { status: 500 }
    );
  }
}
