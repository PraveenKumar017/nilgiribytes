'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { THREE_CONFIG } from './config';
import {
  createProceduralVarkey,
  createTeaCupScene,
  createRusticBakeryTable,
  createSteamParticles,
} from './varkey-scene';

gsap.registerPlugin(ScrollTrigger);

export default function NilgiriCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!THREE_CONFIG.ENABLE_3D) {
      setIsSupported(false);
      return;
    }

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth <= 768;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent so site background shows through
    scene.fog = new THREE.FogExp2(0x19100a, 0.045);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    // On mobile, frame slightly back so both tea-time elements fit nicely
    camera.position.set(isMobile ? 0.8 : 1.4, isMobile ? 1.0 : 0.8, isMobile ? 6.8 : 5.8);

    // 2. Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile, // optimize performance on mobile
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.shadowMap.enabled = !isMobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D:', e);
      setIsSupported(false);
      return;
    }

    // 3. Bakery Factory Lighting: Warm brick oven hearth glow
    const ambientLight = new THREE.AmbientLight(0xffddbe, 1.4);
    scene.add(ambientLight);

    // Warm golden bake light from upper-right oven opening
    const ovenLight = new THREE.DirectionalLight(0xffaa55, 3.2);
    ovenLight.position.set(4, 6, 3.5);
    ovenLight.castShadow = true;
    ovenLight.shadow.mapSize.width = 1024;
    ovenLight.shadow.mapSize.height = 1024;
    scene.add(ovenLight);

    // Deep ember rim light for artisanal crust edge definition
    const emberRimLight = new THREE.DirectionalLight(0xd96820, 2.2);
    emberRimLight.position.set(-5, -2, -2.5);
    scene.add(emberRimLight);

    // Soft overhead cool bounce mimicking Kotagiri bakery kitchen window
    const windowBounce = new THREE.DirectionalLight(0x7ea090, 0.8);
    windowBounce.position.set(0, 5, -2);
    scene.add(windowBounce);

    // 4. Procedural Scene Objects: Pleasant Nilgiri Tea-Time with Authentic Varkey grounded on tabletop
    const table = createRusticBakeryTable();
    scene.add(table);

    const teaCup = createTeaCupScene();
    scene.add(teaCup.group);

    const varkey = createProceduralVarkey();
    scene.add(varkey.group);

    const steam = createSteamParticles(130);
    scene.add(steam.points);

    // 5. Scroll State Tracking & GSAP Scrubbing
    // Target state object scrubbed by ScrollTrigger
    const sceneState = {
      camX: isMobile ? 0.4 : 1.2,
      camY: isMobile ? 0.8 : 0.6,
      camZ: isMobile ? 6.8 : 5.6,
      varkeyX: isMobile ? 0.0 : 0.9,
      varkeyY: isMobile ? -0.4 : -0.15,
      varkeyZ: 0.2,
      teaCupX: isMobile ? 1.8 : 3.3,
      teaCupY: isMobile ? -0.4 : -0.15,
      teaCupZ: isMobile ? -0.2 : -0.5,
      teaCupScale: isMobile ? 0.62 : 0.78,
      varkeyRotX: 0.35,
      varkeyRotY: -0.42,
      varkeyRotZ: 0.08,
      varkeyScale: isMobile ? 0.78 : 0.95,
      layerSpread: 0,
      fogDensity: 0.045,
      sunIntensity: 3.0,
    };

    // Master ScrollTrigger timeline linking the 9 sections
    const scrollMaster = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      },
    });

    // Section 1: Hero Scroll begins -> Varkey layers and flaky crumbs burst open right here in the hero!
    scrollMaster
      .to(sceneState, {
        layerSpread: 0.85,
        varkeyRotY: -0.15,
        varkeyRotX: 0.32,
        teaCupX: 3.8, // drifts gently further to let the opened Varkey take center stage
        teaCupScale: 0.65,
        duration: 1.4,
        ease: 'power2.out',
      })
      // Hero -> Section 2: Range
      .to(sceneState, {
        camX: -1.2,
        camY: 0.8,
        camZ: 5.5,
        varkeyX: -1.8,
        varkeyY: 0.2,
        varkeyRotY: 0.4,
        varkeyScale: 0.85,
        layerSpread: 0.35,
        duration: 2,
        ease: 'power1.inOut',
      })
      // Section 3: Signature Range
      .to(sceneState, {
        camX: 1.4,
        camY: -0.1,
        camZ: 4.5,
        varkeyX: 1.6,
        varkeyY: -0.4,
        varkeyRotX: 0.4,
        varkeyRotY: -0.8,
        varkeyScale: 0.95,
        duration: 2,
        ease: 'power1.inOut',
      })
      // Section 4: Customer Favourites (Bestsellers)
      .to(sceneState, {
        camX: -1.6,
        camY: 0.3,
        camZ: 4.6,
        varkeyX: -1.4,
        varkeyY: 0.1,
        varkeyRotY: 0.6,
        duration: 2,
        ease: 'power1.inOut',
      })
      // Section 5: Our Story (Warm intimate heritage tone)
      .to(sceneState, {
        camX: 0,
        camY: 0.2,
        camZ: 4.2,
        varkeyX: 1.2,
        varkeyY: 0.0,
        varkeyRotX: 0.25,
        varkeyRotY: -0.1,
        sunIntensity: 3.2,
        duration: 2,
        ease: 'power1.inOut',
      })
      // Section 6: Freshly Baked (Craftsmanship) - Hero Anatomy Separation
      .to(sceneState, {
        camX: 0,
        camY: 0.3,
        camZ: 3.8,
        varkeyX: 0,
        varkeyY: -0.1,
        varkeyRotX: 0.2,
        varkeyRotY: 0.0,
        varkeyScale: 1.15,
        layerSpread: 1.0, // Full layer separation
        duration: 3,
        ease: 'power2.inOut',
      })
      // Section 7: Kind Words / Testimonials - Recombination
      .to(sceneState, {
        camX: 1.4,
        camY: 0.5,
        camZ: 4.8,
        varkeyX: 1.6,
        varkeyY: -0.2,
        varkeyRotY: -0.5,
        varkeyScale: 0.9,
        layerSpread: 0.0, // Recombined whole
        duration: 2,
        ease: 'power2.inOut',
      })
      // Section 8: FAQ
      .to(sceneState, {
        camX: -1.4,
        camY: 0.1,
        camZ: 5.0,
        varkeyX: -1.7,
        varkeyY: -0.3,
        varkeyRotY: 0.5,
        duration: 2,
        ease: 'power1.inOut',
      })
      // Section 9: CTA (Grand finale Nilgiri tea-time warm glow)
      .to(sceneState, {
        camX: 0,
        camY: 0.2,
        camZ: 4.0,
        varkeyX: 0,
        varkeyY: 0,
        varkeyRotX: 0.3,
        varkeyRotY: -0.2,
        varkeyScale: 1.1,
        sunIntensity: 3.5,
        duration: 2,
        ease: 'power1.out',
      });

    // 6. Animation Loop with smooth lerping
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Smooth camera interpolation towards scrubbed state
      camera.position.x += (sceneState.camX - camera.position.x) * 0.08;
      camera.position.y += (sceneState.camY - camera.position.y) * 0.08;
      camera.position.z += (sceneState.camZ - camera.position.z) * 0.08;
      camera.lookAt(sceneState.varkeyX * 0.4, sceneState.varkeyY * 0.4, 0);

      // Interpolate varkey model
      varkey.group.position.x += (sceneState.varkeyX - varkey.group.position.x) * 0.08;
      varkey.group.position.y += (sceneState.varkeyY - varkey.group.position.y) * 0.08;
      varkey.group.position.z += (sceneState.varkeyZ - varkey.group.position.z) * 0.08;

      varkey.group.rotation.x += (sceneState.varkeyRotX - varkey.group.rotation.x) * 0.08;
      varkey.group.rotation.y += (sceneState.varkeyRotY - varkey.group.rotation.y) * 0.08;
      varkey.group.rotation.z += (sceneState.varkeyRotZ - varkey.group.rotation.z) * 0.08;

      const targetScale = sceneState.varkeyScale;
      varkey.group.scale.set(targetScale, targetScale, targetScale);

      // Interpolate teaCup position & scale cleanly separated
      teaCup.group.position.x += (sceneState.teaCupX - teaCup.group.position.x) * 0.08;
      teaCup.group.position.y += (sceneState.teaCupY - teaCup.group.position.y) * 0.08;
      teaCup.group.position.z += (sceneState.teaCupZ - teaCup.group.position.z) * 0.08;
      const cupScale = sceneState.teaCupScale;
      teaCup.group.scale.set(cupScale, cupScale, cupScale);

      // Apply layer separation scrub
      varkey.setLayerSpread(sceneState.layerSpread);

      // Light & atmosphere scrub
      ovenLight.intensity = sceneState.sunIntensity;
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).density = sceneState.fogDensity;
      }

      // Idle updates
      varkey.update(delta);
      teaCup.update(delta);
      steam.update(delta);

      renderer?.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      scrollMaster.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());

      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      scene.clear();
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="nilgiri-3d-canvas-wrap"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
}
