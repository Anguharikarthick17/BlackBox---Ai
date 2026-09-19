/**
 * BLACKBOX X — 3D PROCESS UNIVERSE NODE COMPONENT
 * Physical Representation of Computational Operations
 * 
 * NO FAKE NUMBERS · BOUND DIRECTLY TO DEMO ORCHESTRATOR OUTPUTS
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ProcessUniverseStageConfig, PipelineNodeStatus } from '../../../core/demo/demoTypes';

interface ProcessUniverseNodeProps {
  config: ProcessUniverseStageConfig;
  position: [number, number, number];
  status: PipelineNodeStatus;
  isActive: boolean;
  valueSnippet?: string;
  detailSnippet?: string;
  onClick?: () => void;
}

const COLOR_CRIMSON = new THREE.Color('#B40023');
const COLOR_EMERALD = new THREE.Color('#059669');
const COLOR_GRAPHITE = new THREE.Color('#2A2A2A');
const COLOR_CREAM = new THREE.Color('#FCF0D6');

export const ProcessUniverseNode: React.FC<ProcessUniverseNodeProps> = ({
  config,
  position,
  status,
  isActive,
  valueSnippet,
  detailSnippet,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  // Dynamic color selection based on execution status
  const nodeColor = useMemo(() => {
    if (isActive) return COLOR_CRIMSON;
    if (status === 'COMPLETE') return COLOR_EMERALD;
    if (status === 'PROCESSING') return COLOR_CRIMSON;
    return COLOR_GRAPHITE;
  }, [status, isActive]);

  // Subtle breathing rotation on active nodes
  useFrame((_, delta) => {
    if (meshRef.current) {
      if (isActive || status === 'PROCESSING') {
        meshRef.current.rotation.y += delta * 0.8;
        meshRef.current.rotation.x += delta * 0.4;
      }
    }
    if (ringRef.current && (isActive || status === 'PROCESSING')) {
      ringRef.current.rotation.z += delta * 1.2;
      const s = 1 + Math.sin(Date.now() * 0.004) * 0.08;
      ringRef.current.scale.set(s, s, s);
    }
  });

  const isComplete = status === 'COMPLETE';
  const isProcessing = status === 'PROCESSING';

  return (
    <group position={position}>
      {/* Outer Halo Ring (for active or processing nodes) */}
      {(isActive || isProcessing) && (
        <mesh ref={ringRef}>
          <ringGeometry args={[0.55, 0.62, 32]} />
          <meshBasicMaterial
            color={COLOR_CRIMSON}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Main Node Sphere */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        scale={isActive ? 1.2 : 0.9}
      >
        <octahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isActive ? 0.6 : isComplete ? 0.25 : 0.05}
          roughness={0.2}
          metalness={0.8}
          wireframe={status === 'WAITING' && !isActive}
        />
      </mesh>

      {/* Subtle Anchor Dot */}
      <mesh position={[0, -0.65, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={COLOR_CREAM} transparent opacity={0.5} />
      </mesh>

      {/* High-Resolution HTML Overlay Tag */}
      <Html
        position={[0, 0.8, 0]}
        center
        distanceFactor={18}
        zIndexRange={[10, 50]}
        className="pointer-events-none select-none font-mono text-[10px]"
      >
        <div
          className={`flex flex-col items-center px-2 py-1 border transition-all duration-300 whitespace-nowrap shadow-xs ${
            isActive
              ? 'bg-[#151515]/90 border-crimson text-cream ring-1 ring-crimson/40 scale-105'
              : isComplete
              ? 'bg-[#151515]/80 border-emerald-600/70 text-cream/90'
              : 'bg-[#151515]/60 border-border/40 text-cream/40 opacity-70'
          }`}
        >
          {/* Header & Order Number */}
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px]">
            <span className={isActive ? 'text-crimson' : isComplete ? 'text-emerald-400' : 'text-cream/50'}>
              {String(config.order).padStart(2, '0')}
            </span>
            <span>{config.id}</span>
          </div>

          {/* Real Output Snippet (When Available) */}
          {valueSnippet && (
            <div className="text-[9px] font-bold text-cream mt-0.5 max-w-[140px] truncate">
              {valueSnippet}
            </div>
          )}

          {/* Secondary Status Badge */}
          <div className="text-[8px] uppercase tracking-widest text-cream/60 mt-0.5">
            {isActive ? '● ACTIVE' : isComplete ? '✓ COMPLETE' : isProcessing ? '◌ PROCESSING' : '○ WAITING'}
          </div>
        </div>
      </Html>
    </group>
  );
};
