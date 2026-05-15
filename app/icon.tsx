import { ImageResponse } from 'next/og';

// Configurações do ícone
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#1B4D3E',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10B981',
          borderRadius: '8px',
          fontWeight: '900',
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    }
  );
}
