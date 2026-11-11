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

    const body = await req.json();
    const { action, termo, uf, pdfUrl, nomeSindicato, autoSave } = body;

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chave SERPER_API_KEY não configurada no servidor.' 
      }, { status: 500 });
    }

    // 1. AÇÃO: BUSCAR CCTS NA WEB
    if (action === 'search') {
      const ufClean = (uf || '').toUpperCase().trim();
      const termoClean = (termo || 'Limpeza e Conservação').trim();

      // Mapeamento de nomes de estados para busca mais assertiva
      const estadosNomes: Record<string, string> = {
        SC: 'Santa Catarina',
        PR: 'Paraná',
        SP: 'São Paulo',
        RJ: 'Rio de Janeiro',
        RS: 'Rio Grande do Sul',
        MG: 'Minas Gerais',
        BA: 'Bahia',
        GO: 'Goiás',
        DF: 'Distrito Federal',
        PE: 'Pernambuco',
        CE: 'Ceará',
        ES: 'Espírito Santo'
      };

      const estadoExtenso = estadosNomes[ufClean] || ufClean;
      const query = `filetype:pdf convenção coletiva "${termoClean}" ("${estadoExtenso}" OR "${ufClean}") 2025 OR 2026 OR 2027`;

      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          gl: 'br',
          hl: 'pt-br',
          num: 8
        })
      });

      if (!response.ok) {
        throw new Error(`Falha na busca externa (${response.status})`);
      }

      const searchData = await response.json();
      const organic = searchData.organic || [];

      // Filtra apenas resultados com links válidos
      const results = organic
        .filter((item: any) => item.link && (item.link.toLowerCase().includes('.pdf') || item.title?.toLowerCase().includes('pdf')))
        .map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet || '',
          source: new URL(item.link).hostname
        }));

      return NextResponse.json({
        success: true,
        query,
        count: results.length,
        results
      });
    }

    // 2. AÇÃO: BAIXAR PDF DA WEB, ANALISAR VIGÊNCIA E CADASTRAR CCT
    if (action === 'import') {
      if (!pdfUrl) {
        return NextResponse.json({ success: false, error: 'URL do PDF não informada.' }, { status: 400 });
      }

      // Download do PDF
      const pdfRes = await fetch(pdfUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!pdfRes.ok) {
        throw new Error(`Não foi possível baixar o PDF da fonte original (${pdfRes.status}).`);
      }

      const arrayBuffer = await pdfRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extrai texto usando unpdf
      const textoBruto = await extractTextFromPdf(buffer);
      if (!textoBruto || textoBruto.trim().length < 50) {
        return NextResponse.json({ 
          success: false, 
          error: 'O PDF baixado não contém texto legível (pode ser digitalização sem OCR).' 
        }, { status: 400 });
      }

      // Converter buffer para Data URL para visualização e download
      const base64Data = buffer.toString('base64');
      const dataPdfUrl = `data:application/pdf;base64,${base64Data}`;
      
      const fileNameMatch = pdfUrl.split('/').pop()?.split('?')[0] || 'convencao_coletiva.pdf';
      const parsedData = await parseCCT(textoBruto, fileNameMatch);

      if (nomeSindicato && nomeSindicato.trim()) {
        parsedData.nome = nomeSindicato.trim();
      }
      if (uf && uf.trim()) {
        parsedData.uf = uf.toUpperCase().trim();
      }

      if (autoSave) {
        const sIni = String(parsedData.vigenciaInicio).split('T')[0];
        const sFim = String(parsedData.vigenciaFim).split('T')[0];
        const vigInicio = new Date(`${sIni}T12:00:00.000Z`);
        const vigFim = new Date(`${sFim}T12:00:00.000Z`);

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
            vaRefeicaoLocal: parsedData.vaRefeicaoLocal || 0,
            vtValor: parsedData.vtValor || 0,
            vtDescPercent: parsedData.vtDescPercent || 6,
            seguroVida: parsedData.seguroVida || 0,
            cestaBasica: parsedData.cestaBasica || 0,
            examesMedicos: parsedData.examesMedicos || 0,
            custosSindicato: parsedData.custosSindicato || 0,
            salarioMinimo: parsedData.salarioMinimo || 1621,
            provisFerias: parsedData.provisFerias || 11.11,
            provis13: parsedData.provis13 || 8.33,
            encargoInss: parsedData.encargoInss || 20,
            encargoFgts: parsedData.encargoFgts || 8,

            pdfUrl: dataPdfUrl,
            pdfNome: fileNameMatch,
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
          message: 'CCT localizada na web, baixada, vigência extraída da cláusula e salva com sucesso!'
        });
      }

      return NextResponse.json({
        success: true,
        saved: false,
        parsedData,
        pdfUrl: dataPdfUrl,
        pdfNome: fileNameMatch,
        message: 'CCT localizada e analisada com sucesso!'
      });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida.' }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na rota de busca de CCT com IA:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro ao processar busca de CCT na web.' 
    }, { status: 500 });
  }
}
