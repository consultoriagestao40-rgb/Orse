import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 1. Criar ou obter o Tenant "Silva Consultoria Empresarial LTDA"
    const tenant = await prisma.tenant.upsert({
      where: { cnpj: '40.180.983/0001-00' },
      update: { nomeFantasia: 'Silva Consultoria Empresarial LTDA' },
      create: {
        nomeFantasia: 'Silva Consultoria Empresarial LTDA',
        cnpj: '40.180.983/0001-00'
      }
    })

    // 2. Criar ou obter o usuário Administrador vinculado ao Tenant
    const email = 'cristiano@grupojvsserv.com.br'
    const password = '123456'
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password,
        role: 'ADMIN',
        nome: 'Cristiano Silva',
        tenantId: tenant.id
      },
      create: {
        email,
        nome: 'Cristiano Silva',
        password,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    })

    // 2.5 Criar ou obter o usuário Super Administrador da Plataforma (SaaS Admin)
    const superAdminEmail = 'admin@smartbidhub.com.br'
    const superAdminUser = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        nome: 'SmartBidHub Admin',
        role: 'ADMIN',
        tenantId: null // Sem vínculo com empresas clientes
      },
      create: {
        email: superAdminEmail,
        nome: 'SmartBidHub Admin',
        password: '123456',
        role: 'ADMIN',
        tenantId: null
      }
    })

    // 3. Migrar todas as tabelas órfãs (que possuem tenantId = null) para o Tenant da Silva Consultoria Empresarial LTDA
    const updates = await Promise.all([
      prisma.user.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.client.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.lead.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.proposta.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.contrato.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.documentoProposta.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.templatePropostaComercial.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.templateContrato.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.produto.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.cCT.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.equipeTecnicaComposicao.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.escala.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.activity.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
      prisma.comment.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } })
    ])

    const counts = {
      users: updates[0].count,
      clients: updates[1].count,
      leads: updates[2].count,
      propostas: updates[3].count,
      contratos: updates[4].count,
      documentos: updates[5].count,
      templatesProposta: updates[6].count,
      templatesContrato: updates[7].count,
      produtos: updates[8].count,
      ccts: updates[9].count,
      composicoes: updates[10].count,
      escalas: updates[11].count,
      activities: updates[12].count,
      comments: updates[13].count
    }
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>SaaS Inicializado</title>
        </head>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0F172A; color: white; margin: 0; padding: 20px; box-sizing: border-box;">
          <div style="max-width: 500px; width: 100%; background: #1E293B; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px border-slate-700;">
            <h1 style="color: #10B981; margin-top: 0;">SaaS Inicializado! 🎉</h1>
            <p style="font-size: 14px; color: #94A3B8;">O ERP SmartBid foi convertido com sucesso para Multi-Tenant.</p>
            
            <div style="background: #0F172A; border-radius: 12px; padding: 20px; text-align: left; margin: 20px 0; font-family: monospace; font-size: 12px; color: #10B981;">
              <div style="font-weight: bold; border-bottom: 1px solid #1E293B; padding-bottom: 8px; margin-bottom: 8px; color: #94A3B8;">CONTAS CONFIGURADAS:</div>
              • 💻 Dono do SaaS: <b>admin@smartbidhub.com.br</b> (Senha: 123456)<br/>
              • 🏢 CEO Silva Consultoria: <b>${user.email}</b> (Senha: 123456)<br/>
              
              <div style="font-weight: bold; border-bottom: 1px solid #1E293B; padding-bottom: 8px; margin-bottom: 8px; margin-top: 16px; color: #94A3B8;">MIGRAÇÃO DE REGISTROS (ÓRFÃOS -> SILVA):</div>
              • Usuários Vinculados: ${counts.users}<br/>
              • Clientes Vinculados: ${counts.clients}<br/>
              • Leads Vinculados: ${counts.leads}<br/>
              • Propostas Vinculadas: ${counts.propostas}<br/>
              • Contratos Vinculados: ${counts.contratos}<br/>
              • Documentos Vinculados: ${counts.documentos}<br/>
              • Insumos/Produtos Vinculados: ${counts.produtos}<br/>
              • CCTs / Composições: ${counts.ccts + counts.composicoes}<br/>
              • Atividades/Logs: ${counts.activities + counts.comments}
            </div>
            
            <p style="font-size: 13px; color: #EF4444; font-weight: bold; margin: 15px 0;">Nenhum dado original foi perdido ou deletado.</p>
            
            <a href="/login" style="display: inline-block; margin-top: 15px; padding: 12px 30px; background: #10B981; color: white; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(16,185,129,0.3); transition: transform 0.2s;">
              Ir para o Login Premium
            </a>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
