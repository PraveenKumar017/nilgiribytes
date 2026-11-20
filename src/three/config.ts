/**
 * 3D Nilgiri Experience Configuration
 * Controls 3D features, quality tiers, fallbacks, and rendering parameters.
 */

export const THREE_CONFIG = {
  // Master toggle to enable or completely disable the 3D canvas
  ENABLE_3D: true,

  // Allow 3D on mobile devices with mobile-optimized camera & performance
  MOBILE_FALLBACK: false,

  // Enable procedural hills background
  ENABLE_HILLS: true,

  // Enable tea steam & dust ambient particles
  ENABLE_PARTICLES: true,

  // Visual & Render quality settings
  QUALITY: {
    dpr: [1, 2], // Device pixel ratio clamp
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance' as WebGLPowerPreference,
  },

  // Colors aligned with the Nilgiribytes warm heritage palette
  PALETTE: {
    mistSky: '#0e1d16',
    mountainFar: '#162e24',
    mountainMid: '#1b3b2b',
    mountainNear: '#234e38',
    teaAmber: '#d48b38',
    varkeyCrust: '#c88034',
    varkeyFlake: '#e8af67',
    varkeyCrumb: '#f7d399',
    varkeyBase: '#8f4e19',
    steamParticle: '#ffffff',
  },
};

export type QualityTier = 'high' | 'medium' | 'low' | 'disabled';
