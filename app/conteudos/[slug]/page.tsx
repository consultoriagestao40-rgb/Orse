import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSeoArticleBySlug, getAllSeoArticles, resolveAutoArtStyle } from '@/lib/seo-engine';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getSeoArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Artigo não encontrado | SmartBid Hub',
    };
  }

  const canonicalUrl = `https://www.smartbidhub.com.br/conteudos/${article.slug}`;
  const { style: autoArtStyle } = await resolveAutoArtStyle(article.slug);
  const ogImageUrl = `https://www.smartbidhub.com.br/api/seo/og?slug=${encodeURIComponent(article.slug)}&style=${encodeURIComponent(autoArtStyle)}`;

  return {
    title: article.title,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url: canonicalUrl,
      siteName: 'SmartBid Hub',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      locale: 'pt_BR',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function SeoArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getSeoArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getAllSeoArticles();
  const related = allArticles.filter((a) => a.slug !== article.slug).slice(0, 3);

  const canonicalUrl = `https://www.smartbidhub.com.br/conteudos/${article.slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'SmartBid Hub • Engenharia de Custos e Facilities',
      url: 'https://smartbidhub.com.br',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SmartBid Hub',
      url: 'https://smartbidhub.com.br',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const faqSchema =
    article.faqs && article.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#111418] antialiased font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FBFAF7]/90 backdrop-blur-md border-b border-[#E6E2DA]">
        <div className="max-w-[1100px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/lp" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-[#1B4D3E] flex items-center justify-center">
                <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[17px] font-bold tracking-tight">SmartBid</span>
            </Link>
            <span className="text-[#E6E2DA]">/</span>
            <Link
              href="/conteudos"
              className="text-[13px] font-semibold text-[#5B6470] hover:text-[#1B4D3E] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Todos os Guias
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/lp"
              className="hidden sm:inline-block text-[13.5px] font-medium text-[#5B6470] hover:text-[#111418]"
            >
              Plataforma
            </Link>
            <Link
              href="/cadastro"
              className="bg-[#FF6B1A] hover:bg-[#E85A0C] text-white text-[13px] font-bold px-4 py-2 rounded-full transition-all shadow-sm"
            >
              Testar grátis por 30 dias
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Artigo */}
      <article className="max-w-[840px] mx-auto px-6 pt-12 pb-20">
        {/* Categoria & Tempo de Leitura */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAF1ED] text-[#1B4D3E]">
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#5B6470] font-medium">
            <Clock size={14} /> Leitura de {article.readTimeMinutes} minutos
          </span>
        </div>

        {/* Título H1 */}
        <h1 className="text-[30px] sm:text-[42px] font-extrabold leading-[1.1] tracking-tight text-[#111418]">
          {article.title}
        </h1>

        {/* Subtítulo / Excerpt */}
        <p className="mt-5 text-[18px] leading-relaxed text-[#5B6470] font-medium border-l-4 border-[#1B4D3E] pl-4">
          {article.excerpt}
        </p>

        {/* Seções do Guia */}
        <div className="mt-10 space-y-10">
          {article.sections.map((sec, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-[#111418] pt-2">
                {sec.heading}
              </h2>

              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[16px] leading-[1.75] text-[#2C333A]">
                  {p}
                </p>
              ))}

              {sec.bullets && sec.bullets.length > 0 && (
                <ul className="space-y-2.5 bg-white border border-[#E6E2DA] rounded-2xl p-6 my-4">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 text-[15px] leading-relaxed text-[#2C333A]">
                      <CheckCircle2 size={18} className="text-[#1B4D3E] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {sec.table && (
                <div className="overflow-x-auto my-6 rounded-2xl border border-[#E6E2DA] bg-white shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1B4D3E] text-white text-[12px] font-bold uppercase tracking-wider">
                        {sec.table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="py-3.5 px-4 border-b border-[#1B4D3E]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2DA] text-[14px]">
                      {sec.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#FBFAF7]">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-3.5 px-4 ${cIdx === 0 ? 'font-bold text-[#111418]' : 'text-[#475569]'}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sec.highlightBox && (
                <div className="bg-[#EAF1ED] border border-[#1B4D3E]/25 rounded-2xl p-6 my-6">
                  <p className="text-[14px] font-extrabold text-[#1B4D3E] uppercase tracking-wider mb-1.5">
                    💡 {sec.highlightBox.title}
                  </p>
                  <p className="text-[15px] leading-relaxed text-[#14392E] font-medium">
                    {sec.highlightBox.text}
                  </p>
                </div>
              )}

              {/* CTA Intermediário após a 1ª seção */}
              {idx === 0 && (
                <div className="my-8 rounded-2xl bg-gradient-to-r from-[#1B4D3E] to-[#12352B] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-md">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 text-emerald-200">
                      Automatize na Prática
                    </span>
                    <h3 className="text-[19px] font-extrabold mt-2">
                      Faça esse cálculo em segundos no SmartBid Hub
                    </h3>
                    <p className="text-[13.5px] text-white/80 mt-1">
                      30 dias de teste grátis com CCTs, FPV, Reforma Tributária e propostas rastreadas.
                    </p>
                  </div>
                  <Link
                    href="/cadastro"
                    className="shrink-0 inline-flex items-center gap-2 bg-[#FF6B1A] hover:bg-[#E85A0C] text-white font-bold text-[13.5px] px-5 py-3 rounded-xl transition-all"
                  >
                    Testar 30 dias grátis <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Bloco de Perguntas Frequentes (FAQ Schema) */}
        {article.faqs && article.faqs.length > 0 && (
          <section className="mt-14 pt-10 border-t border-[#E6E2DA]">
            <h2 className="text-[24px] font-extrabold tracking-tight mb-6">
              Perguntas Frequentes sobre este tema
            </h2>
            <div className="space-y-4">
              {article.faqs.map((f, fIdx) => (
                <div key={fIdx} className="bg-white border border-[#E6E2DA] rounded-2xl p-6">
                  <h3 className="text-[16px] font-extrabold text-[#111418]">{f.question}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#5B6470]">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Final de Alta Conversão */}
        <section className="mt-14 rounded-3xl bg-[#111418] text-white p-8 sm:p-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#1B4D3E] text-emerald-200 mb-4">
            <BookOpen size={13} /> Teste Grátis por 30 Dias
          </span>
          <h2 className="text-[26px] sm:text-[32px] font-extrabold leading-tight max-w-[600px] mx-auto">
            Pronto para profissionalizar sua engenharia de custos e propostas comerciais?
          </h2>
          <p className="mt-3 text-[15px] text-white/75 max-w-[540px] mx-auto leading-relaxed">
            Crie sua conta em 2 minutos, sem cartão de crédito, e rode sua operação comercial por 30 dias completos no SmartBid Hub.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6B1A] hover:bg-[#E85A0C] text-white font-bold text-[15px] px-7 py-4 rounded-xl transition-all"
            >
              Começar teste grátis de 30 dias <ArrowRight size={17} />
            </Link>
            <Link
              href="/lp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-[15px] px-6 py-4 rounded-xl transition-all"
            >
              Conhecer todos os módulos
            </Link>
          </div>
        </section>

        {/* Artigos Relacionados */}
        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#E6E2DA]">
            <h2 className="text-[20px] font-extrabold mb-6">Continue lendo na Central Técnica</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/conteudos/${rel.slug}`}
                  className="bg-white border border-[#E6E2DA] rounded-2xl p-5 hover:border-[#1B4D3E] transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4D3E]">
                      {rel.category}
                    </span>
                    <h3 className="text-[14.5px] font-extrabold mt-1.5 leading-snug text-[#111418]">
                      {rel.title}
                    </h3>
                  </div>
                  <span className="mt-4 text-[12px] font-bold text-[#1B4D3E] inline-flex items-center gap-1">
                    Ler guia <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
