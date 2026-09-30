import React from 'react';

/**
 * Clinical Command Center 2D Medical Backdrop
 * Completely replaces background 3D canvas, particles, and purple glow with a clean,
 * performant deep slate/navy (#0f172a / #1e293b) theme.
 * Keeps interactive 3D rendering isolated exclusively to the 3D ICU Ward view.
 */
export const ThreeBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0f172a]"
      style={{ isolation: 'isolate' }}
    >
      {/* Subtle Medical Command Center Ambient Radial Accents (Deep Navy / Slate) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(6,182,212,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.8),transparent_50%)]" />

      {/* Subtle High-Tech 2D Telemetry Grid (Pure CSS, 0% GPU / WebGL overhead) */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #06b6d4 1px, transparent 1px),
            linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};

export default ThreeBackground;
