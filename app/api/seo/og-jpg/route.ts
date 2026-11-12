import { GET as getOgPng } from '../og/route';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const pngResponse = await getOgPng(request);
  const pngBuffer = Buffer.from(await pngResponse.arrayBuffer());

  try {
    // Instagram Graph API exige estritamente image/jpeg para publicações no Feed
    // @ts-ignore
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
    const jpgBuffer = await sharp(pngBuffer).jpeg({ quality: 94, mozjpeg: true }).toBuffer();

    return new Response(new Uint8Array(jpgBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
