import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;

    const message = await prisma.internalMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || !message.fileUrl) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    // Check if the fileUrl is a base64 data URL
    const matches = message.fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's a regular URL (e.g. legacy static file), redirect to it
      if (message.fileUrl.startsWith('http') || message.fileUrl.startsWith('/')) {
        return NextResponse.redirect(new URL(message.fileUrl, request.url));
      }
      return new NextResponse('Formato de arquivo inválido', { status: 400 });
    }

    const fileType = matches[1];
    const fileBuffer = Buffer.from(matches[2], 'base64');
    const fileName = message.content || 'arquivo';

    const range = request.headers.get('range');
    const headers = new Headers();
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
      
      if (start >= fileBuffer.length || end >= fileBuffer.length) {
        return new NextResponse('Faixa de alcance inválida', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileBuffer.length}` }
        });
      }

      const chunksize = (end - start) + 1;
      const slicedBuffer = fileBuffer.slice(start, end + 1);

      headers.set('Content-Range', `bytes ${start}-${end}/${fileBuffer.length}`);
      headers.set('Content-Length', chunksize.toString());
      headers.set('Content-Type', fileType || message.fileType || 'application/octet-stream');

      return new NextResponse(slicedBuffer, {
        status: 206,
        headers,
      });
    }

    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Content-Type', fileType || message.fileType || 'application/octet-stream');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Erro ao servir arquivo do chat:', error);
    return new NextResponse('Erro interno no servidor', { status: 500 });
  }
}
