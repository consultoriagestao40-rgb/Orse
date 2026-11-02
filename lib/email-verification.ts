import crypto from 'crypto';
import { prisma } from './prisma';
import { sendMail } from './mail';

/**
 * Retorna a URL base do sistema (produção ou localhost)
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://smartbidhub.com.br';
}

/**
 * Gera um token criptográfico seguro de 32 bytes (64 caracteres hex)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Envia o e-mail de ativação e confirmação de conta
 */
export async function sendVerificationEmail({
  email,
  nome,
  token,
}: {
  email: string;
  nome: string;
  token: string;
}) {
  const baseUrl = getAppBaseUrl();
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        
        <!-- Header Branded -->
        <div style="background: linear-gradient(135deg, #1B4D3E 0%, #13382D 100%); padding: 36px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
            Smart<span style="color: #10B981;">Bid</span>
          </h1>
          <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
            Confirmação de E-mail Corporativo
          </p>
        </div>

        <!-- Conteúdo Principal -->
        <div style="padding: 36px 32px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">
            Olá, ${nome.split(' ')[0]}!
          </h2>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Obrigado por criar sua conta no <strong>SmartBid</strong>. Para garantir a segurança dos seus dados e liberar seu acesso completo à plataforma, confirme seu endereço de e-mail clicando no botão abaixo:
          </p>

          <!-- Botão de Ação Primária -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #1B4D3E; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(27, 77, 62, 0.25); letter-spacing: 0.2px;">
              ✓ Confirmar Meu E-mail e Acessar
            </a>
          </div>

          <!-- Fallback Link -->
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px 18px; margin: 0 0 24px 0;">
            <p style="color: #64748b; font-size: 11.5px; margin: 0 0 6px 0;">
              Se o botão não funcionar, copie e cole o link abaixo diretamente no seu navegador:
            </p>
            <p style="color: #1B4D3E; font-size: 11px; word-break: break-all; margin: 0; font-family: monospace;">
              ${verificationUrl}
            </p>
          </div>

          <!-- Dica de Spam / Validade -->
          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 14px 18px; margin: 0 0 24px 0;">
            <p style="color: #854d0e; font-size: 12px; margin: 0 0 6px 0; line-height: 1.5; font-weight: 600;">
              ⚠️ Dica importante sobre sua Caixa de Entrada:
            </p>
            <p style="color: #713f12; font-size: 11.5px; margin: 0; line-height: 1.5;">
              Caso esta mensagem tenha chegado na pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>, marque-a como <em>"Não é Spam / Confiável"</em> para garantir o recebimento de notificações essenciais da sua conta.
            </p>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <p style="color: #94a3b8; font-size: 11.5px; line-height: 1.5; margin: 0;">
              ⏱️ <strong>Validade:</strong> Este link é válido por <strong>24 horas</strong>. Se você não solicitou este cadastro no SmartBid, nenhuma ação é necessária.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Footer Discreto -->
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          © ${new Date().getFullYear()} SmartBid SaaS — Gestão Inteligente de Contratos & Facilities.
        </p>
      </div>
    </div>
  `;

  return await sendMail({
    to: email,
    fromName: 'SmartBid • Verificação de Conta',
    subject: `✉️ Ative sua conta no SmartBid — Confirmação de E-mail`,
    html: emailHtml,
    text: `Olá ${nome}! Para confirmar seu e-mail no SmartBid e ativar sua conta, acesse o link: ${verificationUrl}`,
  });
}

/**
 * Reenvia o e-mail de ativação (com rate limiting / anti-spam)
 */
export async function resendVerificationEmail(email: string) {
  try {
    const emailNorm = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    // Se o usuário não existir, responde mensagem genérica (OWASP anti-enumeração)
    if (!user) {
      return {
        success: true,
        message: 'Se o e-mail informado estiver cadastrado, um novo link de ativação foi enviado.',
      };
    }

    // Se já estiver verificado, orienta a fazer login
    if (user.emailVerified) {
      return {
        success: false,
        alreadyVerified: true,
        message: 'Este e-mail já foi verificado anteriormente. Você pode entrar diretamente no sistema.',
      };
    }

    // Rate limit: verificar se enviou há menos de 60 segundos
    if (user.emailVerificationExpiresAt) {
      const msUntilExpiry = user.emailVerificationExpiresAt.getTime() - Date.now();
      const msSinceCreation = (24 * 60 * 60 * 1000) - msUntilExpiry;
      // Se foi gerado há menos de 60 segundos
      if (msSinceCreation < 60 * 1000 && msSinceCreation > 0) {
        const secondsWait = Math.ceil((60 * 1000 - msSinceCreation) / 1000);
        return {
          success: false,
          error: `Aguarde ${secondsWait} segundos antes de solicitar um novo e-mail.`,
        };
      }
    }

    // Gera novo token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    await sendVerificationEmail({
      email: user.email,
      nome: user.nome,
      token,
    });

    return {
      success: true,
      message: 'Novo link de ativação enviado com sucesso! Verifique sua caixa de entrada e spam.',
    };
  } catch (error: any) {
    console.error('Erro ao reenviar e-mail de verificação:', error);
    return {
      success: false,
      error: error.message || 'Erro ao enviar e-mail. Tente novamente mais tarde.',
    };
  }
}

/**
 * Envia o e-mail oficial de Boas-Vindas com oferta de Consultoria de Implementação
 * via WhatsApp diretamente com o Cristiano
 */
export async function sendWelcomeAndConsultancyEmail({
  email,
  nome,
  empresaNome,
}: {
  email: string;
  nome: string;
  empresaNome?: string;
}) {
  const baseUrl = getAppBaseUrl();
  const empresaDisplay = empresaNome || 'sua empresa';
  const primeiroNome = (nome || '').split(' ')[0] || 'Gestor';
  
  const whatsappMsg = `Olá Cristiano! Criei minha conta no SmartBid (${empresaDisplay}) e gostaria de agendar uma consultoria para implementação do sistema na minha empresa.`;
  const whatsappUrl = `https://wa.me/5541984042835?text=${encodeURIComponent(whatsappMsg)}`;

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
        
        <!-- Header Hero -->
        <div style="background: linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%); padding: 40px 32px; text-align: center; color: #ffffff;">
          <span style="background-color: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #6ee7b7; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 12px;">
            Conta Ativada com Sucesso
          </span>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
            Bem-vindo ao Smart<span style="color: #10B981;">Bid</span>! 🚀
          </h1>
          <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">
            A plataforma definitiva de Gestão Comercial, Contratos e Facilities.
          </p>
        </div>

        <!-- Conteúdo Principal -->
        <div style="padding: 36px 32px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 14px 0;">
            Olá, ${primeiroNome}!
          </h2>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Sua conta para a <strong>${empresaDisplay}</strong> foi habilitada e o seu período de teste já está liberado. Você agora tem em mãos uma infraestrutura completa para transformar sua operação comercial e operacional.
          </p>

          <!-- O que você pode fazer -->
          <div style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px; margin: 0 0 28px 0;">
            <p style="color: #1e293b; font-size: 13px; font-weight: 700; margin: 0 0 12px 0;">
              Por onde começar na plataforma:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.8;">
              <li><strong>CRM & Prospecção:</strong> Organize seus leads e funil de vendas.</li>
              <li><strong>Propostas Comerciais:</strong> Gere propostas e orçamentos automatizados com cálculo de BDI e tributos.</li>
              <li><strong>Gestão Operacional:</strong> Controle contratos, equipes técnicas, escalas e vistorias.</li>
            </ul>
          </div>

          <!-- BLOCO DESTACADO: CONSULTORIA DE IMPLEMENTAÇÃO -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #86efac; border-radius: 16px; padding: 24px; margin: 0 0 28px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 22px; margin-right: 10px;">🎯</span>
              <h3 style="color: #14532d; font-size: 16px; font-weight: 800; margin: 0;">
                Deseja uma Consultoria de Implementação?
              </h3>
            </div>
            
            <p style="color: #166534; font-size: 13.5px; line-height: 1.6; margin: 0 0 16px 0;">
              Se você deseja <strong>acelerar a implantação do sistema</strong>, parametrizar os modelos de propostas da sua empresa, importar sua carteira de clientes ou estruturar seu fluxo comercial sob medida, eu posso conduzir uma <strong>sessão estratégica individual com você e seu time</strong>.
            </p>

            <div style="text-align: center; margin-top: 18px;">
              <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); letter-spacing: 0.2px;">
                💬 Falar com Cristiano no WhatsApp
              </a>
              <p style="color: #15803d; font-size: 11.5px; margin: 10px 0 0 0; font-weight: 500;">
                (41) 98404-2835 • Resposta rápida direta com o fundador
              </p>
            </div>
          </div>

          <!-- Botão para acessar o sistema -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${baseUrl}/" target="_blank" style="display: inline-block; background-color: #1B4D3E; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(27, 77, 62, 0.2);">
              Acessar Meu Painel SmartBid →
            </a>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
              Conte conosco para levar a gestão da sua empresa ao mais alto nível de eficiência.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Footer Discreto -->
      <div style="text-align: center; margin-top: 20px;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">
          © ${new Date().getFullYear()} SmartBid SaaS • Equipe de Sucesso do Cliente
        </p>
      </div>
    </div>
  `;

  return await sendMail({
    to: email,
    fromName: 'Cristiano • SmartBid Consultoria',
    subject: `🚀 Bem-vindo ao SmartBid! Comece aqui + Consultoria de Implementação`,
    html: emailHtml,
    text: `Olá ${primeiroNome}! Sua conta SmartBid foi ativada. Se desejar agendar uma consultoria para implementação do sistema na ${empresaDisplay}, entre em contato diretamente comigo no WhatsApp: ${whatsappUrl}`,
  });
}
