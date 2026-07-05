'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ambient 3D background for the hero only. Flowing light-tube strands drift
 * on their own and lean gently toward the pointer — no click-triggered
 * reshuffling. Disabled below 768px and under prefers-reduced-motion: the
 * WebGL context is never created in either case, not just paused, so it
 * costs nothing on the phones most artists are actually using.
 */

const TUBE_COLORS = ['#00cfff', '#4169e1', '#c850c0', '#ff6eb4'];
const MOBILE_BREAKPOINT = 768;

type Strand = {
  group: THREE.Group;
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  amplitudeY: number;
  freqY: number;
  phaseY: number;
  zBase: number;
  parallax: number;
  rotationSpeed: number;
  colorPhase: number;
};

function createGradientTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  TUBE_COLORS.forEach((color, index) => {
    gradient.addColorStop(index / (TUBE_COLORS.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildStrandCurve(freqY: number, phaseY: number, freqZ: number, phaseZ: number, ampZ: number) {
  const points: THREE.Vector3[] = [];
  const pointCount = 10;
  for (let p = 0; p < pointCount; p++) {
    const x = (p / (pointCount - 1) - 0.5) * 15;
    const y = Math.sin(x * freqY + phaseY) * 1.6;
    const z = Math.cos(x * freqZ + phaseZ) * ampZ;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points);
}

export function TubesCursorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reducedMotionQuery.matches || window.innerWidth < MOBILE_BREAKPOINT) {
      // Never allocate a WebGL context on mobile / reduced-motion — this is a
      // cost-avoidance guard, not just a paused animation.
      return;
    }

    let disposed = false;
    let frameId = 0;
    let reduceMotion = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const gradientTexture = createGradientTexture();

    const strandConfigs = [
      { freqY: 0.32, phaseY: 0.0, freqZ: 0.5, phaseZ: 0.3, ampZ: 1.5, zBase: -2, radius: 0.05, parallax: 0.6, rotationSpeed: 0.03, colorPhase: 0.0 },
      { freqY: 0.26, phaseY: 1.1, freqZ: 0.4, phaseZ: 1.4, ampZ: 2.0, zBase: -0.5, radius: 0.065, parallax: 0.9, rotationSpeed: -0.02, colorPhase: 0.2 },
      { freqY: 0.4, phaseY: 2.4, freqZ: 0.55, phaseZ: 0.8, ampZ: 1.2, zBase: 1, radius: 0.045, parallax: 1.2, rotationSpeed: 0.025, colorPhase: 0.4 },
      { freqY: 0.22, phaseY: 3.6, freqZ: 0.35, phaseZ: 2.1, ampZ: 1.8, zBase: -1.5, radius: 0.055, parallax: 0.75, rotationSpeed: -0.018, colorPhase: 0.55 },
      { freqY: 0.35, phaseY: 4.8, freqZ: 0.6, phaseZ: 3.3, ampZ: 1.4, zBase: 0.5, radius: 0.04, parallax: 1.05, rotationSpeed: 0.032, colorPhase: 0.7 },
      { freqY: 0.29, phaseY: 5.7, freqZ: 0.45, phaseZ: 1.9, ampZ: 2.2, zBase: -2.5, radius: 0.06, parallax: 0.5, rotationSpeed: -0.028, colorPhase: 0.85 },
      { freqY: 0.38, phaseY: 0.7, freqZ: 0.5, phaseZ: 4.2, ampZ: 1.0, zBase: 1.8, radius: 0.035, parallax: 1.35, rotationSpeed: 0.02, colorPhase: 0.95 },
    ];

    const strands: Strand[] = strandConfigs.map((config) => {
      const curve = buildStrandCurve(config.freqY, config.phaseY, config.freqZ, config.phaseZ, config.ampZ);
      const geometry = new THREE.TubeGeometry(curve, 64, config.radius, 8, false);
      const material = new THREE.MeshBasicMaterial({
        map: gradientTexture,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh);
      group.position.z = config.zBase;
      scene.add(group);

      return {
        group,
        mesh,
        material,
        amplitudeY: 0.6,
        freqY: config.freqY,
        phaseY: config.phaseY,
        zBase: config.zBase,
        parallax: config.parallax,
        rotationSpeed: config.rotationSpeed,
        colorPhase: config.colorPhase,
      };
    });

    const targetPointer = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener('pointermove', handlePointerMove);

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    const clock = new THREE.Clock();

    const tick = () => {
      if (disposed) return;

      const shouldRender = !reduceMotion && container.clientWidth >= MOBILE_BREAKPOINT;

      if (shouldRender) {
        const t = clock.getElapsedTime();
        pointer.x += (targetPointer.x - pointer.x) * 0.04;
        pointer.y += (targetPointer.y - pointer.y) * 0.04;

        strands.forEach((strand) => {
          const wobble = Math.sin(t * 0.25 + strand.phaseY) * strand.amplitudeY * 0.3;
          strand.group.position.y = wobble + pointer.y * strand.parallax;
          strand.group.position.x = pointer.x * strand.parallax * 1.1;
          strand.group.rotation.z = Math.sin(t * strand.rotationSpeed + strand.phaseY) * 0.08;

          if (gradientTexture) {
            gradientTexture.offset.x = (t * 0.04 + strand.colorPhase) % 1;
          }
        });

        camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.02;
        camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }

      frameId = requestAnimationFrame(tick);
    };

    tick();

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);

      strands.forEach((strand) => {
        strand.mesh.geometry.dispose();
        strand.material.dispose();
      });
      gradientTexture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true" />;
}
