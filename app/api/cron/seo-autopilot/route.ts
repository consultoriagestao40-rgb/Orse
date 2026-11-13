import { NextResponse } from 'next/server';
import { ensureDailyAutopilotArticle } from '@/lib/seo-engine';

export async function GET() {
  try {
    // A publicação nas redes acontece UMA vez, dentro de ensureDailyAutopilotArticle (com trava).
    // Aqui não publicamos de novo, para não duplicar o post.
    const daily = await ensureDailyAutopilotArticle();
    const article = daily.article;
    return NextResponse.json({
      success: true,
      message: daily.triggered
        ? 'Artigo do dia gerado e publicado nas redes uma única vez.'
        : 'Artigo do dia já tratado (nenhuma nova publicação).',
      triggered: daily.triggered,
      slug: article?.slug,
      title: article?.title,
      url: article ? `https://www.smartbidhub.com.br/conteudos/${article.slug}` : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro no piloto automático de SEO' },
      { status: 500 }
    );
  }
}
