import { ImageResponse } from 'next/og';

export const size        = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '108px',
        }}
      >
        {/* 동전 아이콘 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '280px', height: '280px',
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '12px solid rgba(255,255,255,0.5)',
          }}>
            <div style={{ color: 'white', fontSize: '160px', fontWeight: 900, lineHeight: 1 }}>W</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
