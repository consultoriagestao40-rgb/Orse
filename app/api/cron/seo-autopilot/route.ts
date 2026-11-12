import { NextResponse } from 'next/server';
import { ensureDailyAutopilotArticle, publishToLinkedInAutopilot } from '@/lib/seo-engine';

export async function GET() {
  try {
    const daily = await ensureDailyAutopilotArticle();
    const article = daily.article;
    let linkedinResult: { ok: boolean; message: string } | null = null;
    if (article) {
      linkedinResult = await publishToLinkedInAutopilot(article, undefined, { style: 'auto' });
    }
    return NextResponse.json({
      success: true,
      message: 'Artigo de SEO gerado, indexado no sitemap.xml e enviado para o LinkedIn!',
      slug: article?.slug,
      title: article?.title,
      url: article ? `https://www.smartbidhub.com.br/conteudos/${article.slug}` : null,
      linkedin: linkedinResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro no piloto automático de SEO' },
      { status: 500 }
    );
  }
}
