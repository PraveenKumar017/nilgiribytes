import * as THREE from 'three';

/**
 * Creates an authentic artisanal Ooty Varkey:
 * - Hand-rolled, puff-pastry laminated geometry with handcrafted rustic contours
 * - Golden roasted caramelized top crust and deep baked base
 * - Golden flaky crumbs & flour dust particles bursting from within the Varkey layers as it opens
 */

export interface VarkeyLayers {
  group: THREE.Group;
  baseLayer: THREE.Mesh;
  crumbLayer: THREE.Mesh;
  flakyLayers: THREE.Group;
  topCrust: THREE.Mesh;
  flourBurstPoints: THREE.Points;
  setLayerSpread: (progress: number) => void;
  update: (delta: number) => void;
}

// Procedural noise-based texture generator for real baked crust / crumb look
function createBakedCrustTexture(isTop = true): THREE.CanvasTexture {
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Warm golden bakery crust tones
  ctx.fillStyle = isTop ? '#c8762d' : '#884318';
  ctx.fillRect(0, 0, 512, 512);

  // Add buttery lamination streaks & flaky folds
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 15 + Math.random() * 50;
    const angle = (Math.random() - 0.5) * 0.35;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle =
      Math.random() > 0.45
        ? 'rgba(248, 204, 138, 0.55)'
        : 'rgba(125, 60, 20, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, len, 2 + Math.random() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Golden sugar crystalline glaze & flour speckles
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.8;
    ctx.fillStyle = Math.random() > 0.3 ? 'rgba(255, 245, 220, 0.35)' : 'rgba(215, 140, 60, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createBumpTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 3 + 1;
    const shade = Math.floor(Math.random() * 255);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createRusticDiscGeometry(
  topR: number,
  botR: number,
  height: number,
  aspectRatio = 1.35,
  ruggedness = 0.08
): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(topR, botR, height, 48, 4);
  geom.scale(aspectRatio, 1, 1);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const angle = Math.atan2(z, x);
    const irregularity =
      1 +
      Math.sin(angle * 3) * ruggedness * 0.4 +
      Math.cos(angle * 7) * ruggedness * 0.35 +
      (Math.random() - 0.5) * ruggedness * 0.25;

    pos.setX(i, x * irregularity);
    pos.setZ(i, z * irregularity);

    if (Math.abs(y) > height * 0.35) {
      const surfaceUndulation = Math.sin(x * 2.5) * Math.cos(z * 3.0) * 0.035;
      pos.setY(i, y + surfaceUndulation);
    }
  }

  geom.computeVertexNormals();
  return geom;
}

export function createProceduralVarkey(): VarkeyLayers {
  const group = new THREE.Group();

  const crustTex = createBakedCrustTexture(true);
  const baseTex = createBakedCrustTexture(false);
  const bumpTex = createBumpTexture();

  // 1. Butter-Caramelized Base
  const baseGeom = createRusticDiscGeometry(0.85, 0.92, 0.18, 1.4, 0.06);
  const baseMat = new THREE.MeshStandardMaterial({
    map: baseTex,
    bumpMap: bumpTex,
    bumpScale: 0.04,
    color: 0x6e330d,
    roughness: 0.88,
    metalness: 0.08,
  });
  const baseLayer = new THREE.Mesh(baseGeom, baseMat);
  baseLayer.position.y = -0.22;
  baseLayer.castShadow = true;
  baseLayer.receiveShadow = true;
  group.add(baseLayer);

  // 2. Inner Spiced Crumb
  const crumbGeom = createRusticDiscGeometry(0.88, 0.88, 0.24, 1.38, 0.08);
  const crumbMat = new THREE.MeshStandardMaterial({
    map: crustTex,
    bumpMap: bumpTex,
    bumpScale: 0.06,
    color: 0xdfad6b,
    roughness: 0.95,
    metalness: 0.02,
  });
  const crumbLayer = new THREE.Mesh(crumbGeom, crumbMat);
  crumbLayer.position.y = -0.02;
  crumbLayer.castShadow = true;
  crumbLayer.receiveShadow = true;
  group.add(crumbLayer);

  // 3. Flaky Thin Layers
  const flakyLayers = new THREE.Group();
  const flakeCount = 6;
  const flakeMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < flakeCount; i++) {
    const flakeGeom = createRusticDiscGeometry(
      0.86 + i * 0.008,
      0.86 + i * 0.008,
      0.035,
      1.37,
      0.09
    );
    const flakeMat = new THREE.MeshStandardMaterial({
      map: crustTex,
      bumpMap: bumpTex,
      bumpScale: 0.05,
      color: i % 2 === 0 ? 0xd09048 : 0xecbf82,
      roughness: 0.75,
      metalness: 0.06,
    });
    const flakeMesh = new THREE.Mesh(flakeGeom, flakeMat);
    flakeMesh.position.y = 0.12 + i * 0.055;
    flakeMesh.rotation.y = (i * 0.12) - 0.3;
    flakeMesh.castShadow = true;
    flakeMesh.receiveShadow = true;
    flakyLayers.add(flakeMesh);
    flakeMeshes.push(flakeMesh);
  }
  group.add(flakyLayers);

  // 4. Golden Caramelized Top Crust
  const crustGeom = createRusticDiscGeometry(0.78, 0.86, 0.14, 1.36, 0.07);
  const crustMat = new THREE.MeshStandardMaterial({
    map: crustTex,
    bumpMap: bumpTex,
    bumpScale: 0.08,
    color: 0xb55e1a,
    roughness: 0.6,
    metalness: 0.12,
  });
  const topCrust = new THREE.Mesh(crustGeom, crustMat);
  topCrust.position.y = 0.48;
  topCrust.castShadow = true;
  topCrust.receiveShadow = true;
  group.add(topCrust);

  // 5. Fine Golden Crumbs & Flour Burst particles that erupt out as layers separate
  const burstCount = 180;
  const burstGeom = new THREE.BufferGeometry();
  const burstPos = new Float32Array(burstCount * 3);
  const burstDirs = new Float32Array(burstCount * 3);

  for (let i = 0; i < burstCount; i++) {
    const rad = 0.3 + Math.random() * 0.8;
    const theta = Math.random() * Math.PI * 2;
    burstPos[i * 3 + 0] = Math.cos(theta) * rad * 1.35;
    burstPos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
    burstPos[i * 3 + 2] = Math.sin(theta) * rad;

    burstDirs[i * 3 + 0] = Math.cos(theta) * (1.2 + Math.random() * 1.8);
    burstDirs[i * 3 + 1] = (Math.random() - 0.2) * 1.6;
    burstDirs[i * 3 + 2] = Math.sin(theta) * (1.2 + Math.random() * 1.8);
  }

  burstGeom.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  const burstMat = new THREE.PointsMaterial({
    color: 0xfbd289,
    size: 0.048,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flourBurstPoints = new THREE.Points(burstGeom, burstMat);
  group.add(flourBurstPoints);

  // Handcrafted tilt
  group.rotation.x = 0.38;
  group.rotation.y = -0.45;

  let currentSpread = 0;

  const setLayerSpread = (progress: number) => {
    currentSpread = Math.max(0, Math.min(1, progress));
    const p = currentSpread;

    // Base pushes down
    baseLayer.position.y = -0.22 - p * 0.55;

    // Crumb stays centered
    crumbLayer.position.y = -0.02 - p * 0.1;

    // Flakes expand upward
    flakeMeshes.forEach((mesh, idx) => {
      mesh.position.y = 0.12 + idx * 0.055 + p * (0.28 + idx * 0.18);
    });

    // Top crust lifts high
    topCrust.position.y = 0.48 + p * 1.35;

    baseLayer.rotation.y = p * 0.22;
    topCrust.rotation.y = -p * 0.28;

    burstMat.opacity = Math.min(0.85, p * 1.5);

    const posAttr = flourBurstPoints.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < burstCount; i++) {
      const origX = burstPos[i * 3 + 0];
      const origY = burstPos[i * 3 + 1];
      const origZ = burstPos[i * 3 + 2];

      const dirX = burstDirs[i * 3 + 0];
      const dirY = burstDirs[i * 3 + 1];
      const dirZ = burstDirs[i * 3 + 2];

      arr[i * 3 + 0] = origX + dirX * (p * 0.9);
      arr[i * 3 + 1] = origY + dirY * (p * 0.9);
      arr[i * 3 + 2] = origZ + dirZ * (p * 0.9);
    }
    posAttr.needsUpdate = true;
  };

  const update = (delta: number) => {
    group.position.y += Math.sin(Date.now() * 0.0016) * 0.0006;

    if (currentSpread > 0.05) {
      flourBurstPoints.rotation.y += delta * 0.15;
    }
  };

  return {
    group,
    baseLayer,
    crumbLayer,
    flakyLayers,
    topCrust,
    flourBurstPoints,
    setLayerSpread,
    update,
  };
}

/**
 * Creates a soft, continuous organic heat haze & steam vapor texture
 */
function createSteamVaporTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  gradient.addColorStop(0.35, 'rgba(255, 245, 235, 0.22)');
  gradient.addColorStop(0.7, 'rgba(255, 240, 225, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates a realistic artisanal ceramic tea cup with natural rising hot heat haze / wisps of steam
 */
export function createTeaCupScene(): {
  group: THREE.Group;
  update: (delta: number) => void;
} {
  const group = new THREE.Group();

  // Premium glossy warm porcelain ceramic material
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xfcf8f2,
    roughness: 0.15,
    metalness: 0.04,
  });

  // 1. Saucer plate with realistic curves
  const saucerGeom = new THREE.CylinderGeometry(1.3, 0.8, 0.1, 40);
  const saucer = new THREE.Mesh(saucerGeom, ceramicMat);
  saucer.position.y = -0.52;
  saucer.receiveShadow = true;
  group.add(saucer);

  const saucerLipGeom = new THREE.TorusGeometry(1.22, 0.035, 16, 40);
  saucerLipGeom.rotateX(Math.PI / 2);
  const saucerLip = new THREE.Mesh(saucerLipGeom, ceramicMat);
  saucerLip.position.y = -0.47;
  group.add(saucerLip);

  // 2. Realistic curved tea cup (Lathe geometry for organic profile)
  const cupPoints = [
    new THREE.Vector2(0.48, -0.5),
    new THREE.Vector2(0.52, -0.42),
    new THREE.Vector2(0.62, -0.2),
    new THREE.Vector2(0.72, 0.15),
    new THREE.Vector2(0.76, 0.38),
    new THREE.Vector2(0.78, 0.42),
  ];
  const cupGeom = new THREE.LatheGeometry(cupPoints, 40);
  const cup = new THREE.Mesh(cupGeom, ceramicMat);
  cup.castShadow = true;
  cup.receiveShadow = true;
  group.add(cup);

  // 3. Elegant looped ceramic handle
  const handleCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.72, 0.3, 0),
    new THREE.Vector3(1.15, 0.28, 0),
    new THREE.Vector3(1.12, -0.22, 0),
    new THREE.Vector3(0.58, -0.25, 0)
  );
  const handleGeom = new THREE.TubeGeometry(handleCurve, 24, 0.055, 12, false);
  const handle = new THREE.Mesh(handleGeom, ceramicMat);
  group.add(handle);

  // 4. Fresh hot Nilgiri cardamom spiced tea
  const chaiGeom = new THREE.CircleGeometry(0.72, 36);
  chaiGeom.rotateX(-Math.PI / 2);
  const chaiMat = new THREE.MeshStandardMaterial({
    color: 0x984d1c, // rich amber milk chai
    roughness: 0.18,
    metalness: 0.08,
  });
  const chaiLiquid = new THREE.Mesh(chaiGeom, chaiMat);
  chaiLiquid.position.y = 0.32;
  group.add(chaiLiquid);

  // 5. Realistic rising heat wind / continuous steam wisps (Semi-transparent billboard planes)
  const steamTexture = createSteamVaporTexture();
  const steamWispCount = 6;
  const steamWisps: { mesh: THREE.Mesh; seed: number; speed: number }[] = [];

  for (let i = 0; i < steamWispCount; i++) {
    const wispGeom = new THREE.PlaneGeometry(0.7, 1.4);
    const wispMat = new THREE.MeshBasicMaterial({
      map: steamTexture,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const wispMesh = new THREE.Mesh(wispGeom, wispMat);
    wispMesh.position.set(
      (Math.random() - 0.5) * 0.25,
      0.55 + i * 0.3,
      (Math.random() - 0.5) * 0.25
    );
    group.add(wispMesh);
    steamWisps.push({
      mesh: wispMesh,
      seed: Math.random() * 100,
      speed: 0.007 + Math.random() * 0.006,
    });
  }

  // Position tea cup gracefully to the right side of the Varkey with plenty of breathing space
  group.position.set(3.4, -0.15, -0.6);
  group.scale.set(0.78, 0.78, 0.78);

  const update = (delta: number) => {
    // Realistic rising & curling thermal heat wind
    const time = Date.now() * 0.0015;

    steamWisps.forEach((wisp, idx) => {
      wisp.mesh.position.y += wisp.speed;

      // Gentle curling heat wind motion (sine waves)
      wisp.mesh.position.x = Math.sin(time * 1.8 + wisp.seed) * (0.08 + (wisp.mesh.position.y - 0.5) * 0.12);
      wisp.mesh.position.z = Math.cos(time * 1.4 + wisp.seed) * (0.08 + (wisp.mesh.position.y - 0.5) * 0.12);

      // Expand wisps naturally as heat dissipates into the cool hill air
      const heightAboveCup = wisp.mesh.position.y - 0.35;
      const scale = 0.8 + heightAboveCup * 0.85;
      wisp.mesh.scale.set(scale, scale * 1.2, 1);

      // Fade in at cup rim, fade out as it reaches top
      const mat = wisp.mesh.material as THREE.MeshBasicMaterial;
      if (heightAboveCup < 0.4) {
        mat.opacity = (heightAboveCup / 0.4) * 0.3;
      } else if (heightAboveCup > 1.6) {
        mat.opacity = Math.max(0, 0.3 - (heightAboveCup - 1.6) * 0.35);
      } else {
        mat.opacity = 0.3;
      }

      // Reset when faded high above the cup
      if (wisp.mesh.position.y > 2.6) {
        wisp.mesh.position.y = 0.45;
        wisp.mesh.position.x = (Math.random() - 0.5) * 0.2;
        wisp.mesh.position.z = (Math.random() - 0.5) * 0.2;
      }
    });
  };

  return { group, update };
}

/**
 * Creates a rustic bakery wooden tabletop surface so items rest naturally grounded
 */
export function createRusticBakeryTable(): THREE.Group {
  const tableGroup = new THREE.Group();

  // Wide rustic wooden bakery table plank
  const tableGeom = new THREE.BoxGeometry(18, 0.5, 10);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x22160d, // rich antique dark oak / teak bakery table
    roughness: 0.85,
    metalness: 0.04,
  });
  const tableMesh = new THREE.Mesh(tableGeom, tableMat);
  tableMesh.position.set(2.0, -0.92, -0.4);
  tableMesh.receiveShadow = true;
  tableGroup.add(tableMesh);

  // Soft contact shadow plane right beneath the items for grounded realism
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const ctx = shadowCanvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  // Contact shadow under Varkey
  const varkeyShadowGeom = new THREE.PlaneGeometry(3.2, 2.4);
  varkeyShadowGeom.rotateX(-Math.PI / 2);
  const varkeyShadow = new THREE.Mesh(varkeyShadowGeom, shadowMat);
  varkeyShadow.position.set(0.9, -0.66, 0.1);
  tableGroup.add(varkeyShadow);

  // Contact shadow under Tea Cup Saucer
  const cupShadowGeom = new THREE.PlaneGeometry(2.4, 2.4);
  cupShadowGeom.rotateX(-Math.PI / 2);
  const cupShadow = new THREE.Mesh(cupShadowGeom, shadowMat);
  cupShadow.position.set(3.4, -0.66, -0.5);
  tableGroup.add(cupShadow);

  return tableGroup;
}

export function createSteamParticles(count = 140): { points: THREE.Points; update: (delta: number) => void } {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.004;
    velocities[i * 3 + 1] = 0.003 + Math.random() * 0.007;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffd9a6,
    size: 0.065,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geom, mat);

  const update = (delta: number) => {
    const pos = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] += velocities[i * 3 + 0];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      if (arr[i * 3 + 1] > 3.8) {
        arr[i * 3 + 1] = -3;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 6;
      }
    }
    pos.needsUpdate = true;
  };

  return { points, update };
}
