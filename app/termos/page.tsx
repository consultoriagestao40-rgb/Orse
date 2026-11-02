import React from 'react';
import Link from 'next/link';
import { FileText, Shield, CheckCircle2, ArrowLeft, Building2, AlertCircle, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso e Condições Gerais do SaaS | SmartBid',
  description: 'Termos e Condições Gerais de Uso da Plataforma SmartBid SaaS para Gestão de Facilities, Propostas e Contratos.',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Bar / Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 hover:opacity-85 transition">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              SB
            </div>
            <span>Smart<span className="text-emerald-600">Bid</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Início
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
            >
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-200">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Contrato de Licenciamento de Software como Serviço (SaaS)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Termos de Uso e Condições Gerais
          </h1>
          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            Estes Termos regulam o acesso e a utilização dos serviços e módulos da plataforma <strong className="text-slate-900">SmartBid</strong> por empresas contratantes, seus administradores e colaboradores autorizados.
          </p>
          <div className="mt-4 text-xs text-slate-500 flex flex-wrap gap-4 items-center">
            <span>Última atualização: <strong>Novembro de 2026</strong></span>
            <span>•</span>
            <span>Versão: <strong>2.1 (Vigente)</strong></span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-10">

          {/* 1. Objeto do Serviço */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900">Objeto e Licença de Uso</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              O SmartBid concede à empresa Contratante uma licença de uso limitada, não exclusiva, intransferível e revogável de sua plataforma de software baseada em nuvem (SaaS), destinada à gestão comercial de facilities, formação de preços e precificação técnica, atas de reunião, minutas de propostas comerciais e gestão de contratos.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              O acesso aos módulos contratados é disponibilizado mediante assinatura ativa e cadastramento de credenciais individuais para usuários autorizados.
            </p>
          </section>

          {/* 2. Propriedade Intelectual e Titularidade dos Dados */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900">Propriedade Intelectual vs. Titularidade dos Seus Dados</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Os Dados São 100% da Sua Empresa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Todas as informações comerciais, planilhas de custos, clientes cadastrados, propostas geradas, atas e contratos são de <strong>propriedade exclusiva da empresa Contratante</strong>. O SmartBid não reivindica direitos e não acessará esses dados para outros fins que não a prestação do suporte técnico contratado.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-700" />
                  Propriedade do Software SmartBid
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O software, arquitetura, design, algoritmos, marcas, logotipos e códigos-fonte da plataforma SmartBid são de propriedade intelectual exclusiva da desenvolvedora, protegidos pela Lei de Software (Lei nº 9.609/98) e de Direitos Autorais (Lei nº 9.610/98).
                </p>
              </div>
            </div>
          </section>

          {/* 3. Obrigações e Segurança das Credenciais */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-xl font-bold text-slate-900">Segurança das Credenciais e Obrigações do Usuário</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Ao utilizar o sistema, a empresa Contratante e seus colaboradores comprometem-se a:
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                <span>Manter a confidencialidade absoluta de seus logins e senhas, não compartilhando credenciais entre membros da equipe;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                <span>Obedecer à <strong>Política de Senhas Fortes</strong> exigida pelo sistema (mínimo de 8 caracteres, letras maiúsculas, minúsculas, números e caracteres especiais);</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                <span>Garantir que os dados de colaboradores e terceiros inseridos no sistema possuam base legal válida conforme a LGPD;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                <span>Notificar imediatamente o suporte SmartBid ao suspeitar de qualquer incidente de segurança ou acesso não autorizado à sua conta.</span>
              </li>
            </ul>
          </section>

          {/* 4. Disponibilidade (SLA) e Manutenção */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                4
              </div>
              <h2 className="text-xl font-bold text-slate-900">Disponibilidade do Serviço e Suporte Técnico</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              O SmartBid emprega infraestrutura em nuvem de padrão internacional com redundância geográfica, com meta de disponibilidade (uptime) de <strong>99,5%</strong> ao ano.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Eventuais manutenções preventivas programadas que demandem instabilidade temporária serão notificadas previamente com antecedência mínima de 24 horas por e-mail ou aviso no painel, priorizando horários de menor impacto operacional.
            </p>
          </section>

          {/* 5. Cancelamento e Exportação de Dados */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                5
              </div>
              <h2 className="text-xl font-bold text-slate-900">Cancelamento, Rescisão e Exportação de Dados</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              A assinatura poderá ser cancelada a qualquer momento pela empresa Contratante sem multas rescisórias para os planos mensais vigentes.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Em caso de rescisão, a Contratante terá o direito de exportar suas propostas, relatórios e cadastros antes do encerramento da conta. Decorrido o prazo legal de guarda obrigatória por lei, os dados são desindexados e excluídos com segurança definitiva de nossos servidores.
            </p>
          </section>

          {/* 6. Foro e Disposições Gerais */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                6
              </div>
              <h2 className="text-xl font-bold text-slate-900">Legislação Aplicável e Foro de Eleição</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, em especial o Código Civil Brasileiro, o Marco Civil da Internet (Lei nº 12.965/14) e a Lei Geral de Proteção de Dados (Lei nº 13.709/18).
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              Fica eleito o Foro da Comarca de Curitiba, Estado do Paraná, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer controvérsias oriundas deste instrumento.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SmartBid Plataforma SaaS. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/termos" className="text-emerald-700 font-bold">Termos de Uso</Link>
            <span>•</span>
            <Link href="/privacidade" className="hover:text-emerald-700 transition">Política de Privacidade</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-emerald-700 transition">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
