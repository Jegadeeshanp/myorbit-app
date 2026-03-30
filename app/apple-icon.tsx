import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
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
            width: 112,
            height: 112,
            borderRadius: '50%',
            border: '7px solid rgba(255,255,255,0.35)',
            display: 'flex',
          }}
        />
        {/* Tilted orbit ring */}
        <div
          style={{
            position: 'absolute',
            width: 112,
            height: 56,
            borderRadius: '50%',
            border: '7px solid rgba(255,255,255,0.2)',
            display: 'flex',
            transform: 'rotate(-30deg)',
          }}
        />
        {/* Center planet */}
        <div
          style={{
            width: 42,
            height: 42,
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
            top: 27,
            right: 34,
            width: 15,
            height: 15,
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
