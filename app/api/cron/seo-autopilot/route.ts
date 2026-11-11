import { NextResponse } from 'next/server';
import { generateAndPublishSeoArticle } from '@/lib/seo-engine';

export async function GET() {
  try {
    const article = await generateAndPublishSeoArticle();
    return NextResponse.json({
      success: true,
      message: 'Artigo de SEO gerado e publicado automaticamente no sitemap.xml!',
      slug: article.slug,
      title: article.title,
      url: `https://smartbidhub.com.br/conteudos/${article.slug}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro no piloto automático de SEO' },
      { status: 500 }
    );
  }
}
