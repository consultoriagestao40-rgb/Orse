export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureDailyAutopilotArticle } = await import('@/lib/seo-engine');

    // Executa 30 segundos após o boot do servidor para garantir o artigo do dia
    setTimeout(() => {
      ensureDailyAutopilotArticle().catch(() => {});
    }, 30_000);

    // Verifica a cada 4 horas (24/7 no servidor) se virou o dia em Brasília para publicar 1 artigo novo sozinho
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    setInterval(() => {
      ensureDailyAutopilotArticle().catch(() => {});
    }, FOUR_HOURS_MS);
  }
}
