import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import type { Points as ThreePoints, Group as ThreeGroup, LineSegments as ThreeLineSegments } from 'three';
import * as THREE from 'three';

/**
 * Rotating Purple 3D Neural Nodes with Interconnected Lattice
 */
const PurpleNeuralLattice: React.FC = () => {
  const groupRef = useRef<ThreeGroup>(null);
  const pointsRef = useRef<ThreePoints>(null);

  // Generate 80 geometric node vertices on an icosahedron-like spherical cluster
  const { nodePositions, linePositions } = useMemo(() => {
    const nodes: number[] = [];
    const lines: number[] = [];
    const count = 90;
    const radius = 2.4;

    const pointsList: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * (0.65 + 0.35 * Math.random());
      const p = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      pointsList.push(p);
      nodes.push(p.x, p.y, p.z);
    }

    // Connect close neighbors with subtle lines
    for (let i = 0; i < pointsList.length; i++) {
      for (let j = i + 1; j < pointsList.length; j++) {
        const dist = pointsList[i].distanceTo(pointsList[j]);
        if (dist < 1.15) {
          lines.push(
            pointsList[i].x, pointsList[i].y, pointsList[i].z,
            pointsList[j].x, pointsList[j].y, pointsList[j].z
          );
        }
      }
    }

    return {
      nodePositions: new Float32Array(nodes),
      linePositions: new Float32Array(lines),
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
      groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.1) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, -1]}>
      {/* Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nodePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#c084fc"
          size={0.075}
          sizeAttenuation={true}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Interconnecting Purple Lattice Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#9333ea"
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

/**
 * Ambient Glowing White Grid Lines Plane
 */
const GlowingWhiteGrid: React.FC = () => {
  const gridRef = useRef<ThreeGroup>(null);

  useFrame((state) => {
    if (gridRef.current) {
      // Gentle floating perspective drift
      gridRef.current.position.y = -1.8 + Math.sin(state.clock.elapsedTime * 0.25) * 0.04;
    }
  });

  return (
    <group ref={gridRef} position={[0, -1.8, -1]} rotation={[-Math.PI / 2.3, 0, 0]}>
      <gridHelper
        args={[36, 36, '#ffffff', 'rgba(255, 255, 255, 0.18)']}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
};

/**
 * Subtle Floating Luminous Particles
 */
const AmbientParticleField: React.FC = () => {
  const pointsRef = useRef<ThreePoints>(null);

  const particlePositions = useMemo(() => {
    const count = 1800;
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < coords.length; i += 3) {
      coords[i] = (Math.random() - 0.5) * 12;
      coords[i + 1] = (Math.random() - 0.5) * 10;
      coords[i + 2] = (Math.random() - 0.5) * 8;
    }
    return coords;
  }, []);

  useFrame((_state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.015;
      pointsRef.current.rotation.x -= delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#e9d5ff"
        size={0.022}
        sizeAttenuation={true}
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/**
 * ThreeBackground Component
 * High-tech Purple & White 3D glassmorphic background layer
 */
export const ThreeBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#090415]"
      style={{ isolation: 'isolate' }}
    >
      {/* Deep purple radial gradient backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(147,51,234,0.28),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.15),transparent_45%)]" />

      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} color="#faf5ff" />
        <pointLight position={[0, 4, 3]} intensity={1.2} color="#d8b4fe" />
        <pointLight position={[-4, -2, -2]} intensity={0.8} color="#a855f7" />

        <PurpleNeuralLattice />
        <GlowingWhiteGrid />
        <AmbientParticleField />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
