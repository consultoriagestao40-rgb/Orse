import React from 'react';
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cleanId = id.replace(/\.png$/i, '').trim();

    const doc: any = await (prisma.documentoProposta as any).findUnique({
      where: { id: cleanId },
      select: {
        id: true,
        versaoFPV: true,
        statusAssinatura: true,
        client: {
          select: {
            nomeFantasia: true,
            razaoSocial: true,
          },
        },
        empresaEmissora: {
          select: {
            nomeFantasia: true,
            razaoSocial: true,
          },
        },
        proposta: {
          select: {
            numero: true,
            user: { select: { nome: true } },
            versoes: {
              orderBy: { versao: 'desc' },
              take: 3,
              select: { versao: true, metadados: true },
            },
          },
        },
      },
    });

    const numStr = String(doc?.proposta?.numero || 1).padStart(3, '0');
    const revNum = doc?.versaoFPV || doc?.proposta?.versoes?.[0]?.versao || 1;
    const revStr = String(revNum).padStart(2, '0');
    const codeLabel = `FPV-${numStr} • REV. ${revStr}`;

    const matchedVer =
      doc?.proposta?.versoes?.find((v: any) => v.versao === revNum) || doc?.proposta?.versoes?.[0];
    const meta = (matchedVer?.metadados as Record<string, any>) || {};

    const rawCliente =
      doc?.client?.nomeFantasia ||
      doc?.client?.razaoSocial ||
      meta.clienteNome ||
      'Proposta Comercial Executiva';
    const clienteDisplay =
      rawCliente.length > 42 ? `${rawCliente.slice(0, 40).trim()}…` : rawCliente;

    const rawObjeto =
      (typeof meta.objetoProposta === 'string' && meta.objetoProposta.trim()) ||
      'Apresentação Institucional, Escopo Técnico e Aceite Eletrônico';
    const objetoDisplay =
      rawObjeto.length > 84 ? `${rawObjeto.slice(0, 82).trim()}…` : rawObjeto;

    const emissora =
      doc?.empresaEmissora?.nomeFantasia ||
      doc?.empresaEmissora?.razaoSocial ||
      'SmartBid Hub';
    const consultor = doc?.proposta?.user?.nome || 'Consultor Comercial';
    const isSigned = doc?.statusAssinatura === 'ASSINADO';

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 56px',
            background: 'linear-gradient(135deg, #071F18 0%, #12382C 55%, #1B4D3E 100%)',
            fontFamily: 'sans-serif',
            color: '#FFFFFF',
          }}
        >
          {/* Barra superior de marca estilo Autentique / SmartBid */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '18px',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 17 L9 11 L13 15 L21 7" />
                  <path d="M15 7 H21 V13" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '30px',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    color: '#FFFFFF',
                  }}
                >
                  SmartBid
                  <span style={{ color: '#34D399', marginLeft: '6px', fontWeight: 700 }}>Hub</span>
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    color: '#A7F3D0',
                    textTransform: 'uppercase',
                  }}
                >
                  Portal de Propostas &amp; Aceite Digital
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 22px',
                borderRadius: '999px',
                background: isSigned ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.10)',
                border: isSigned
                  ? '1.5px solid rgba(52,211,153,0.65)'
                  : '1.5px solid rgba(167,243,208,0.35)',
                fontSize: '15px',
                fontWeight: 700,
                color: '#ECFDF5',
                letterSpacing: '0.8px',
              }}
            >
              {isSigned ? '✓ DOCUMENTO ASSINADO' : '🔒 AMBIENTE SEGURO • VALIDADE JURÍDICA'}
            </div>
          </div>

          {/* Cartão central de documento comercial */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              height: '410px',
              borderRadius: '30px',
              background: '#FFFFFF',
              padding: '42px 48px',
              boxShadow: '0 28px 70px rgba(0, 0, 0, 0.42)',
              border: '2px solid rgba(52, 211, 153, 0.35)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '17px',
                    fontWeight: 800,
                    letterSpacing: '1.2px',
                  }}
                >
                  PROPOSTA COMERCIAL • {codeLabel}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#64748B',
                  }}
                >
                  smartbidhub.com.br
                </div>
              </div>

              <div
                style={{
                  fontSize: clienteDisplay.length > 28 ? '44px' : '52px',
                  fontWeight: 900,
                  color: '#0F172A',
                  lineHeight: 1.12,
                  letterSpacing: '-1px',
                  marginBottom: '14px',
                }}
              >
                {clienteDisplay}
              </div>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 500,
                  color: '#475569',
                  lineHeight: 1.35,
                }}
              >
                {objetoDisplay}
              </div>
            </div>

            {/* Rodapé interno do documento */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '24px',
                borderTop: '2px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#94A3B8',
                    letterSpacing: '1.4px',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  EMITIDA POR
                </div>
                <div
                  style={{
                    fontSize: '21px',
                    fontWeight: 800,
                    color: '#1E293B',
                  }}
                >
                  {emissora.slice(0, 34)} • {consultor.slice(0, 24)}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  borderRadius: '16px',
                  background: '#1B4D3E',
                  color: '#FFFFFF',
                  fontSize: '20px',
                  fontWeight: 800,
                }}
              >
                Visualizar &amp; Assinar →
              </div>
            </div>
          </div>

          {/* Barra inferior de selos */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 700,
              color: '#A7F3D0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              ✓ Apresentação Executiva &nbsp;&nbsp;•&nbsp;&nbsp; ✓ Detalhamento Técnico &nbsp;&nbsp;•&nbsp;&nbsp; ✓ Aceite Digital em 1 Clique
            </div>
            <div style={{ color: '#6EE7B7' }}>SmartBid Document Cloud</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    console.error('Erro ao gerar OG da proposta:', err);
    return new Response('Erro ao gerar imagem da proposta', { status: 500 });
  }
}
