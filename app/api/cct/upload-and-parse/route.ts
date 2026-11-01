import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf, parseCCT } from '@/lib/cctParser';
import { getSessionUser } from '@/lib/sessionUser';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('pdf')) as File | null;
    const nomeSindicatoParam = formData.get('nomeSindicato') as string | null;
    const autoSave = formData.get('autoSave') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo PDF enviado.' }, { status: 400 });
    }

    // Validação de tipo
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'O arquivo deve ser um PDF válido de Convenção Coletiva (CCT).' }, { status: 400 });
    }

    // Leitura do Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extrair texto do PDF
    const textoBruto = await extractTextFromPdf(buffer);
    if (!textoBruto || textoBruto.trim().length < 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'O PDF não contém texto legível (pode ser uma digitalização/imagem sem OCR). Envie um PDF com texto selecionável.' 
      }, { status: 400 });
    }

    // Converter buffer para Data URL para permitir download imediato do PDF
    const base64Data = buffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${base64Data}`;
    const pdfNome = file.name;

    // Processamento dos dados estruturados via IA / Parser
    const parsedData = await parseCCT(textoBruto, file.name);
    if (nomeSindicatoParam && nomeSindicatoParam.trim()) {
      parsedData.nome = nomeSindicatoParam.trim();
    }

    // Se o usuário solicitou salvar direto no banco de dados
    if (autoSave) {
      let vigInicio = new Date();
      let vigFim = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
      if (parsedData.vigenciaInicio) vigInicio = new Date(parsedData.vigenciaInicio);
      if (parsedData.vigenciaFim) vigFim = new Date(parsedData.vigenciaFim);

      const novaCct = await prisma.cCT.create({
        data: {
          nome: parsedData.nome,
          uf: parsedData.uf,
          cidade: parsedData.cidade || '',
          vigenciaInicio: vigInicio,
          vigenciaFim: vigFim,
          tenantId: user.tenantId || null,

          vaValor: parsedData.vaValor || 0,
          vaTipo: parsedData.vaTipo || 'DIARIO',
          vaDescPercent: parsedData.vaDescPercent || 0,
          vtValor: parsedData.vtValor || 0,
          vtDescPercent: parsedData.vtDescPercent || 6,
          seguroVida: parsedData.seguroVida || 0,
          cestaBasica: parsedData.cestaBasica || 0,
          examesMedicos: parsedData.examesMedicos || 0,
          provisFerias: parsedData.provisFerias || 11.11,
          provis13: parsedData.provis13 || 8.33,
          encargoInss: parsedData.encargoInss || 20,
          encargoFgts: parsedData.encargoFgts || 8,

          pdfUrl,
          pdfNome,
          textoCompleto: textoBruto,
          resumoClausulas: parsedData.clausulas as any,

          cargos: {
            create: (parsedData.cargos || []).map(c => ({
              nome: c.nome,
              pisoSalarial: c.pisoSalarial,
              insalubridadePercent: c.insalubridadePercent || 0,
              gratificacoes: c.gratificacoes || 0,
              assiduidade: c.assiduidade || 0,
              adicionalCopa: c.adicionalCopa || 0
            }))
          }
        },
        include: {
          cargos: true
        }
      });

      return NextResponse.json({
        success: true,
        saved: true,
        cctId: novaCct.id,
        cct: novaCct,
        message: 'CCT cadastrada e publicada com sucesso!'
      });
    }

    return NextResponse.json({
      success: true,
      saved: false,
      parsedData,
      pdfUrl,
      pdfNome,
      message: 'PDF analisado com sucesso! Revise os dados abaixo.'
    });

  } catch (error: any) {
    console.error('Erro na API de upload de CCT:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro interno ao processar PDF da CCT.' 
    }, { status: 500 });
  }
}
