import { NextResponse } from 'next/server';
import {
  getAllSeoArticles,
  generateAndPublishSeoArticle,
  deleteCustomSeoArticle,
  fetchTrendingGoogleSearchTerms,
  ensureDailyAutopilotArticle,
  AUTOPILOT_SEO_TOPICS,
} from '@/lib/seo-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchLiveTrends = searchParams.get('trends') === '1';

    // Garante que o artigo diário automático de hoje já está gerado e publicado
    const dailyStatus = await ensureDailyAutopilotArticle();
    const articles = await getAllSeoArticles();

    let suggestedTopics = AUTOPILOT_SEO_TOPICS;
    if (fetchLiveTrends) {
      suggestedTopics = await fetchTrendingGoogleSearchTerms();
    }

    return NextResponse.json({
      success: true,
      articles,
      suggestedTopics,
      dailyAutopilot: {
        active: true,
        todayDateKey: dailyStatus.todayDateKey,
        triggeredNow: dailyStatus.triggered,
        todayArticleTitle: dailyStatus.article?.title || null,
        todayArticleSlug: dailyStatus.article?.slug || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao listar artigos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const topic = body?.topic ? String(body.topic) : undefined;
    const article = await generateAndPublishSeoArticle(topic);

    return NextResponse.json({
      success: true,
      article,
      url: `/conteudos/${article.slug}`,
    });
  } catch (err: any) {
    console.error('Erro ao gerar artigo de SEO:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao gerar artigo de SEO' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug obrigatório' }, { status: 400 });
    }
    await deleteCustomSeoArticle(slug);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao remover artigo' }, { status: 500 });
  }
}
