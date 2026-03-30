import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 128,
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Orbit ring */}
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            border: '18px solid rgba(255,255,255,0.35)',
            display: 'flex',
          }}
        />
        {/* Tilted orbit ring */}
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 160,
            borderRadius: '50%',
            border: '18px solid rgba(255,255,255,0.2)',
            display: 'flex',
            transform: 'rotate(-30deg)',
          }}
        />
        {/* Center planet */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.95,
            display: 'flex',
          }}
        />
        {/* Orbiting dot */}
        <div
          style={{
            position: 'absolute',
            top: 76,
            right: 96,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
