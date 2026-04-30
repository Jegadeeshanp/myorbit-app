import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

// App_icon3 style: neon green M on dark background — used for Play Store / App Store
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 115,
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
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Orbit ring */}
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: '3px solid rgba(74,222,128,0.5)',
            display: 'flex',
          }}
        />
        {/* Top dot */}
        <div
          style={{
            position: 'absolute',
            top: 106,
            left: '50%',
            marginLeft: -14,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 16px 6px rgba(74,222,128,0.7)',
            display: 'flex',
          }}
        />
        {/* Right dot */}
        <div
          style={{
            position: 'absolute',
            right: 106,
            top: '50%',
            marginTop: -14,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#86efac',
            boxShadow: '0 0 14px 5px rgba(134,239,172,0.6)',
            display: 'flex',
          }}
        />
        {/* Bottom dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 106,
            left: '50%',
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 12px 4px rgba(74,222,128,0.6)',
            display: 'flex',
          }}
        />
        {/* Left dot */}
        <div
          style={{
            position: 'absolute',
            left: 106,
            top: '50%',
            marginTop: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#86efac',
            boxShadow: '0 0 10px 4px rgba(134,239,172,0.5)',
            display: 'flex',
          }}
        />
        {/* M letter */}
        <span
          style={{
            fontSize: 220,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1,
            letterSpacing: -8,
            textShadow: '0 0 40px rgba(74,222,128,0.4)',
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  );
}
