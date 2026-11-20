'use client';

import dynamic from 'next/dynamic';

const NilgiriCanvasInner = dynamic(() => import('@/three/nilgiri-canvas'), {
  ssr: false,
});

export function NilgiriCanvasWrapper() {
  return <NilgiriCanvasInner />;
}
