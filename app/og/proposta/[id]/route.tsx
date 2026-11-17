import { promises as fs } from 'fs';
import path from 'path';

let cachedLogoBytes: Buffer | null = null;

/**
 * Serve o logo oficial 256x256 (< 300px) do SmartBidHub para o Card Compacto nativo do WhatsApp
 * (linkType: SMALL, sem link verde exposto embaixo e clicável em qualquer parte).
 */
export async function GET() {
  if (!cachedLogoBytes) {
    const filePath = path.join(process.cwd(), 'public', 'whatsapp-card-logo.png');
    cachedLogoBytes = await fs.readFile(filePath);
  }

  return new Response(new Uint8Array(cachedLogoBytes), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
