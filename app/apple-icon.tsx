import { ImageResponse } from 'next/og';

export const size        = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        }}
      >
        <div style={{
          width: '110px', height: '110px',
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '5px solid rgba(255,255,255,0.5)',
        }}>
          <div style={{ color: 'white', fontSize: '60px', fontWeight: 900, lineHeight: 1 }}>W</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
