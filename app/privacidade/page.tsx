import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, Server, UserCheck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade e Proteção de Dados (LGPD) | SmartBid',
  description: 'Conheça as diretrizes de privacidade, segurança da informação e tratamento de dados pessoais da plataforma SmartBid em conformidade com a LGPD (Lei nº 13.709/2018).',
};

export default function PrivacidadePage() {
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
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Em conformidade com a Lei Federal nº 13.709/2018 (LGPD)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            Esta Política de Privacidade descreve como o <strong className="text-slate-900">SmartBid</strong> coleta, armazena, utiliza e protege os dados pessoais e as informações corporativas no âmbito de nossos serviços de software como serviço (SaaS).
          </p>
          <div className="mt-4 text-xs text-slate-500 flex flex-wrap gap-4 items-center">
            <span>Última atualização: <strong>Novembro de 2026</strong></span>
            <span>•</span>
            <span>Versão: <strong>2.4 (Vigente)</strong></span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-10">

          {/* 1. Visão Geral e Princípios */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900">Visão Geral e Princípios Fundamentais</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              O SmartBid preza pela segurança, confidencialidade e privacidade de todos os seus usuários e contratantes. Nossas operações de tratamento de dados são orientadas pelos princípios da boa-fé, finalidade, necessidade, transparência, segurança, prevenção e não discriminação, conforme previstos no Artigo 6º da Lei Geral de Proteção de Dados (LGPD).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Lock className="w-5 h-5 text-emerald-600 mb-2" />
                <h3 className="text-xs font-bold text-slate-900 uppercase mb-1">Sigilo Absoluto</h3>
                <p className="text-xs text-slate-500 leading-normal">Os dados comerciais de cada empresa inquilina são confidenciais e nunca comercializados.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Database className="w-5 h-5 text-emerald-600 mb-2" />
                <h3 className="text-xs font-bold text-slate-900 uppercase mb-1">Segregação de Dados</h3>
                <p className="text-xs text-slate-500 leading-normal">Ambiente multi-tenant com isolamento lógico estrito por identificador de empresa (tenantId).</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <UserCheck className="w-5 h-5 text-emerald-600 mb-2" />
                <h3 className="text-xs font-bold text-slate-900 uppercase mb-1">Direitos dos Titulares</h3>
                <p className="text-xs text-slate-500 leading-normal">Facilidade para consulta, correção, portabilidade e revogação de dados pessoais.</p>
              </div>
            </div>
          </section>

          {/* 2. Papéis na LGPD: Controlador vs. Operador */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900">Papéis no Tratamento de Dados (Controlador e Operador)</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Para efeitos de cumprimento da legislação aplicável, os papéis são claramente segregados:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  SmartBid como Controlador de Dados
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O SmartBid atua como <strong>Controlador</strong> exclusivamente em relação aos dados cadastrais e de faturamento da empresa cliente contratante e de seus usuários autorizados (ex: nome, e-mail corporativo, celular corporativo, cargo, senha criptografada e dados de pagamento da assinatura do SaaS).
                </p>
              </div>
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  SmartBid como Operador de Dados
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Em relação aos dados de terceiros que o cliente insere na plataforma (ex: dados de clientes finais em propostas, colaboradores terceirizados em escalas operacionais, regras de CCTs e contatos de leads no CRM), a empresa contratante atua como <strong>Controladora</strong> e o SmartBid atua exclusivamente como <strong>Operador</strong>, processando os dados estritamente para o funcionamento do sistema contratado.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Dados Coletados e Finalidades */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-xl font-bold text-slate-900">Quais Dados Coletamos e Para Quais Finalidades</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Coletamos apenas os dados estritamente necessários para viabilizar as funcionalidades da plataforma e garantir a segurança do ambiente:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Dados Tratados</th>
                    <th className="p-3">Finalidade do Tratamento</th>
                    <th className="p-3">Base Legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Cadastro e Autenticação</td>
                    <td className="p-3">Nome, e-mail corporativo, celular, senha em hash e foto de perfil opcional.</td>
                    <td className="p-3">Identificação, login seguro, envio de código de redefinição de senha e alertas.</td>
                    <td className="p-3 text-emerald-700 font-semibold">Execução de Contrato (Art. 7º, V)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Faturamento e Assinatura</td>
                    <td className="p-3">Razão social, CNPJ, endereço da sede e dados fiscais.</td>
                    <td className="p-3">Emissão de notas fiscais, cobrança de mensalidades e controle de planos.</td>
                    <td className="p-3 text-emerald-700 font-semibold">Cumprimento Legal (Art. 7º, II)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Segurança e Auditoria</td>
                    <td className="p-3">Endereço IP, data/hora de acesso, identificador de dispositivo e logs de ações.</td>
                    <td className="p-3">Prevenção a fraudes, detecção de acessos suspeitos e bloqueio de força bruta.</td>
                    <td className="p-3 text-emerald-700 font-semibold">Legítimo Interesse & Marco Civil da Internet</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Operação do Cliente (CRM/Propostas)</td>
                    <td className="p-3">Contatos de clientes, minutas de propostas, escalas e atas de reunião.</td>
                    <td className="p-3">Execução das ferramentas de gestão de facilities e contratos.</td>
                    <td className="p-3 text-emerald-700 font-semibold">Operador a mando do Controlador</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Segurança da Informação */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                4
              </div>
              <h2 className="text-xl font-bold text-slate-900">Medidas Técnicas de Segurança da Informação</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Adotamos padrões internacionais de segurança para prevenir acessos não autorizados, vazamentos, destruição ou alterações ilícitas de dados:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Criptografia em Repouso e Trânsito:</strong> Conexões 100% protegidas via protocolo SSL/TLS com HTTPS e certificados de alta segurança.</span>
              </li>
              <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Hash de Senhas Bcrypt:</strong> Senhas nunca são salvas em texto puro. Utilizamos algoritmos de hashing com salt de alta entropia.</span>
              </li>
              <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Proteção Anti-Brute Force:</strong> Bloqueio automático de tentativas de acesso após 5 falhas consecutivas com tempo de suspensão.</span>
              </li>
              <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Cookies de Sessão Blindados:</strong> Cookies de autenticação protegidos com flags HttpOnly e SameSite, bloqueando invasões XSS e CSRF.</span>
              </li>
            </ul>
          </section>

          {/* 5. Direitos dos Titulares */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                5
              </div>
              <h2 className="text-xl font-bold text-slate-900">Seus Direitos como Titular de Dados (Art. 18 da LGPD)</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Você ou qualquer colaborador cadastrado possui os seguintes direitos garantidos por lei, exercíveis mediante solicitação ao nosso canal de privacidade:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Confirmação e Acesso</strong>
                Saber se tratamos seus dados e solicitar cópia estruturada dos mesmos.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Correção de Dados</strong>
                Atualizar dados incompletos, inexatos ou desatualizados pelo painel ou suporte.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Anonimização ou Bloqueio</strong>
                Solicitar a anonimização de dados desnecessários ou tratados em desconformidade.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Eliminação de Dados</strong>
                Exclusão de dados tratados mediante consentimento ou após término do contrato de serviço.
              </div>
            </div>
          </section>

          {/* 6. Encarregado de Dados (DPO) e Contato */}
          <section className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 border border-emerald-900 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Canal do Encarregado de Dados (DPO)</h2>
                <p className="text-xs text-emerald-300">Atendimento aos titulares e à Autoridade Nacional de Proteção de Dados (ANPD)</p>
              </div>
            </div>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              Para exercer qualquer um dos seus direitos, esclarecer dúvidas sobre o tratamento de informações ou reportar qualquer incidente de segurança, entre em contato direto com o nosso Comitê de Privacidade:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 bg-emerald-900/60 p-4 rounded-xl border border-emerald-800 text-xs">
              <div>
                <span className="text-emerald-400 block font-semibold mb-0.5">E-mail Oficial de Privacidade & DPO:</span>
                <a href="mailto:suporte@smartbidhub.com.br" className="text-white font-bold hover:underline">
                  suporte@smartbidhub.com.br
                </a>
              </div>
              <div className="sm:border-l sm:border-emerald-800 sm:pl-4">
                <span className="text-emerald-400 block font-semibold mb-0.5">Prazo de Resposta:</span>
                <span className="text-white font-semibold">Até 15 (quinze) dias úteis conforme Art. 19 da LGPD.</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SmartBid Plataforma SaaS. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/termos" className="hover:text-emerald-700 transition">Termos de Uso</Link>
            <span>•</span>
            <Link href="/privacidade" className="text-emerald-700 font-bold">Política de Privacidade</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-emerald-700 transition">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
