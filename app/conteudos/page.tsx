import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllSeoArticles } from '@/lib/seo-engine';
import { ArrowRight, BookOpen, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Guias de Engenharia de Custos, FPV, CCT e Facilities | SmartBid Hub',
  description:
    'Central técnica de conteúdos sobre Formação de Preço de Venda (FPV), cálculo de encargos sociais, CCTs, escala 12x36, Reforma Tributária (IBS/CBS) e gestão de contratos para prestadoras de serviços.',
  keywords: [
    'guias de formação de preço de venda',
    'como calcular FPV facilities',
    'encargos sociais terceirização',
    'reforma tributária IBS CBS serviços',
    'cálculo escala 12x36 portaria limpeza',
    'repactuação de contratos CCT',
  ],
  alternates: {
    canonical: 'https://smartbidhub.com.br/conteudos',
  },
  openGraph: {
    title: 'Central Técnica de Custos, FPV & Facilities | SmartBid Hub',
    description:
      'Guias práticos e planilhas automatizadas para empresas de Limpeza, Portaria, Vigilância, Manutenção e Terceirização de Serviços.',
    url: 'https://smartbidhub.com.br/conteudos',
    siteName: 'SmartBid Hub',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default async function ConteudosIndexPage() {
  const articles = await getAllSeoArticles();

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#111418] antialiased font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FBFAF7]/90 backdrop-blur-md border-b border-[#E6E2DA]">
        <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/lp" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-[#1B4D3E] flex items-center justify-center">
              <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[17px] font-bold tracking-tight">SmartBid</span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF1ED] text-[#1B4D3E] ml-1">
              Central Técnica
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/lp"
              className="hidden sm:inline-block text-[14px] font-medium text-[#5B6470] hover:text-[#111418] transition-colors"
            >
              Conhecer a Plataforma
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-block text-[14px] font-medium text-[#5B6470] hover:text-[#111418] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="bg-[#FF6B1A] hover:bg-[#E85A0C] text-white text-[13.5px] font-bold px-4 py-2 rounded-full transition-all shadow-sm"
            >
              Testar grátis por 30 dias
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-10 pb-14">
        <div className="max-w-[1200px] mx-auto rounded-[28px] bg-gradient-to-br from-[#1B4D3E] to-[#0F2D24] text-white px-6 sm:px-12 py-14 md:py-18 relative overflow-hidden">
          <div className="max-w-[780px] relative z-10">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-200 mb-5">
              <BookOpen size={14} /> Biblioteca de Engenharia de Custos & Facilities
            </span>
            <h1 className="text-[32px] sm:text-[46px] font-extrabold leading-[1.08] tracking-tight">
              Guias práticos para precificar contratos, dominar CCTs e blindar sua margem de lucro.
            </h1>
            <p className="mt-4 text-[16px] sm:text-[18px] text-white/80 leading-relaxed max-w-[660px]">
              Artigos técnicos elaborados para diretores comerciais, gestores e orçamentistas de empresas de Limpeza, Portaria, Vigilância, Manutenção Predial e Terceirização de Mão de Obra.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 bg-[#FF6B1A] hover:bg-[#E85A0C] text-white font-bold text-[14px] px-6 py-3.5 rounded-xl transition-all shadow-lg"
              >
                Começar teste grátis de 30 dias <ArrowRight size={16} />
              </Link>
              <Link
                href="/lp"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-[14px] px-5 py-3.5 rounded-xl transition-all"
              >
                Ver demonstração interativa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Artigos */}
      <main className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E6E2DA]">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight">
              Todos os Guias e Artigos Técnicos ({articles.length})
            </h2>
            <p className="text-[14px] text-[#5B6470] mt-0.5">
              Escolha um tema abaixo para ver a memória de cálculo completa e exemplos práticos.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <Link
              key={art.slug}
              href={`/conteudos/${art.slug}`}
              className="group bg-white rounded-2xl border border-[#E6E2DA] p-6 flex flex-col justify-between hover:border-[#1B4D3E] hover:shadow-xl transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EAF1ED] text-[#1B4D3E]">
                    {art.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] text-[#5B6470] font-medium">
                    <Clock size={12} /> {art.readTimeMinutes} min
                  </span>
                </div>

                <h3 className="text-[18px] font-extrabold leading-snug text-[#111418] group-hover:text-[#1B4D3E] transition-colors">
                  {art.title}
                </h3>

                <p className="mt-3 text-[14px] text-[#5B6470] leading-relaxed line-clamp-3">
                  {art.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6E2DA] flex items-center justify-between text-[13px] font-bold text-[#1B4D3E]">
                <span>Ler guia completo</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Banner de Conversão Inferior */}
        <div className="mt-16 rounded-3xl bg-white border-2 border-[#1B4D3E]/20 p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="max-w-[640px]">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1B4D3E] bg-[#EAF1ED] px-3 py-1 rounded-full">
              Substitua Planilhas Manuais
            </span>
            <h3 className="text-[24px] sm:text-[28px] font-extrabold mt-3 leading-tight">
              Calcule FPVs, CCTs, Reforma Tributária e envie propostas rastreadas em minutos.
            </h3>
            <div className="mt-3 flex flex-wrap gap-4 text-[13.5px] text-[#5B6470] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#1B4D3E]" /> 30 dias grátis com acesso completo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#1B4D3E]" /> Sem cartão de crédito
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#1B4D3E]" /> Apoio direto no WhatsApp
              </span>
            </div>
          </div>

          <Link
            href="/cadastro"
            className="shrink-0 inline-flex items-center gap-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-[15px] px-7 py-4 rounded-xl transition-all shadow-md"
          >
            Criar conta grátis por 30 dias <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    </div>
  );
}
