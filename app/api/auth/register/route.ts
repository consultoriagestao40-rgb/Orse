import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { nome, email, password, empresa, celular } = await request.json()

    if (!nome || !email || !password || !empresa?.trim()) {
      return NextResponse.json({ error: 'Nome, empresa, e-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const celularDigits = String(celular || '').replace(/\D/g, '')
    if (celularDigits.length < 10) {
      return NextResponse.json({ error: 'Informe um WhatsApp válido com DDD.' }, { status: 400 })
    }

    const emailNorm = email.toLowerCase().trim()

    // Validação da Política de Senhas Fortes
    const { validatePasswordStrength, hashPassword } = await import('@/lib/security')
    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid) {
      return NextResponse.json({ 
        error: passwordCheck.errors[0] || 'Por favor, crie uma senha mais forte (mínimo 8 caracteres com maiúsculas, números e símbolos).' 
      }, { status: 400 })
    }

    // Verifica se já existe usuário com esse e-mail
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } })
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail. Tente fazer login.' }, { status: 409 })
    }

    // Cada cadastro self-service cria SEMPRE uma empresa (Tenant) isolada em período de teste de 7 dias.
    // Nunca vincular a um tenant existente por nome: isso exporia dados de outra empresa.
    const tenant = await prisma.tenant.create({
      data: {
        nomeFantasia: empresa.trim(),
        cnpj: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // CNPJ temporário — será atualizado pelo cliente/admin
        plano: 'TESTE',
        trialStartedAt: new Date(),
        limiteUsuarios: 3,
        whatsappPhone: celularDigits,
      }
    })
    const tenantId = tenant.id

    const hashedPassword = await hashPassword(password)
    const { generateVerificationToken, sendVerificationEmail } = await import('@/lib/email-verification')
    const verificationToken = generateVerificationToken()
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        email: emailNorm,
        password: hashedPassword,
        role: 'ADMIN',
        celular: celularDigits,
        tenantId,
        emailVerified: false,
        mustChangePassword: false, // O usuário acabou de criar a própria senha forte
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
      include: { tenant: true }
    })

    // Dispara o e-mail de ativação com o link seguro
    try {
      await sendVerificationEmail({
        email: user.email,
        nome: user.nome,
        token: verificationToken,
      })
    } catch (mailErr) {
      console.error('Falha ao disparar e-mail de verificação no registro:', mailErr)
    }

    return NextResponse.json({
      success: true,
      requireVerification: true,
      email: user.email,
      message: 'Conta criada com sucesso! Enviamos um link de confirmação para o seu e-mail.'
    })
  } catch (error: any) {
    console.error('Register Error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 })
  }
}
