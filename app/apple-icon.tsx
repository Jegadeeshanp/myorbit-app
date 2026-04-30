import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// App_icon3 style: neon green M on dark background — used for Apple touch icon
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(160deg, #0a1f0a 0%, #0d2b14 50%, #0a1a0a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Orbit ring */}
        <div
          style={{
            position: 'absolute',
            width: 106,
            height: 106,
            borderRadius: '50%',
            border: '2px solid rgba(74,222,128,0.5)',
            display: 'flex',
          }}
        />
        {/* Top dot */}
        <div
          style={{
            position: 'absolute',
            top: 37,
            left: '50%',
            marginLeft: -5,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 8px 3px rgba(74,222,128,0.7)',
            display: 'flex',
          }}
        />
        {/* Right dot */}
        <div
          style={{
            position: 'absolute',
            right: 37,
            top: '50%',
            marginTop: -5,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#86efac',
            boxShadow: '0 0 6px 2px rgba(134,239,172,0.6)',
            display: 'flex',
          }}
        />
        {/* Bottom dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 37,
            left: '50%',
            marginLeft: -4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 6px 2px rgba(74,222,128,0.6)',
            display: 'flex',
          }}
        />
        {/* Left dot */}
        <div
          style={{
            position: 'absolute',
            left: 37,
            top: '50%',
            marginTop: -4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#86efac',
            boxShadow: '0 0 6px 2px rgba(134,239,172,0.5)',
            display: 'flex',
          }}
        />
        {/* M letter */}
        <span
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  );
}
