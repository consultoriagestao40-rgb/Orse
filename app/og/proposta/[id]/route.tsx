import React from 'react';
import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 88px',
          background: 'linear-gradient(135deg, #0B2E24 0%, #0F3B2E 55%, #144939 100%)',
          fontFamily: 'sans-serif',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          {/* Ícone quadrado arredondado SmartBid (seta ascendente) */}
          <div
            style={{
              width: '138px',
              height: '138px',
              borderRadius: '34px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '3.5px solid rgba(52, 211, 153, 0.48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '44px',
              flexShrink: 0,
            }}
          >
            <svg
              width="74"
              height="74"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6EE7B7"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17 L9 11 L13 15 L21 7" />
              <path d="M15 7 H21 V13" />
            </svg>
          </div>

          {/* Título executivo limpo e legível em mobile e desktop */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '84px',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            <span>SmartBid</span>
            <span
              style={{
                marginLeft: '24px',
                marginRight: '24px',
                color: '#6EE7B7',
                fontWeight: 700,
              }}
            >
              ·
            </span>
            <span>Proposta</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
