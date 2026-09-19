/**
 * BLACKBOX X — 3D PROCESS UNIVERSE DATA PACKETS
 * Subtle, Performant Instanced Particles Traveling Between Active Nodes
 * 
 * NO FAKE NUMBERS · ONLY ANIMATES DURING REAL ENGINE EXECUTION
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIVERSE_STAGES, NODE_SPATIAL_POSITIONS } from './universeStages';
import { ProcessUniverseStageId } from '../../../core/demo/demoTypes';

interface ProcessUniverseParticlesProps {
  currentStageId: ProcessUniverseStageId;
  isExecuting: boolean;
}

const PARTICLE_COUNT = 16;
const dummy = new THREE.Object3D();

export const ProcessUniverseParticles: React.FC<ProcessUniverseParticlesProps> = ({
  currentStageId,
  isExecuting,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // Find index of current stage
  const stageIndex = useMemo(() => {
    return UNIVERSE_STAGES.findIndex(s => s.id === currentStageId);
  }, [currentStageId]);

  // Points between current and next node (or previous and current)
  const trajectory = useMemo(() => {
    const fromStage = UNIVERSE_STAGES[Math.max(0, stageIndex)];
    const toStage = UNIVERSE_STAGES[Math.min(UNIVERSE_STAGES.length - 1, stageIndex + 1)];

    const p1 = new THREE.Vector3(...NODE_SPATIAL_POSITIONS[fromStage.id]);
    const p2 = new THREE.Vector3(...NODE_SPATIAL_POSITIONS[toStage.id]);

    return { p1, p2 };
  }, [stageIndex]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Progress from 0 to 1 along the segment
      const offset = i / PARTICLE_COUNT;
      const speed = isExecuting ? 0.8 : 0.25;
      const alpha = ((t * speed + offset) % 1.0);

      // Interpolate position along the vector
      const currentPos = new THREE.Vector3().lerpVectors(trajectory.p1, trajectory.p2, alpha);

      // Add gentle organic deviation
      currentPos.y += Math.sin(t * 2 + i) * 0.08;
      currentPos.z += Math.cos(t * 2 + i) * 0.08;

      dummy.position.copy(currentPos);
      const scale = 0.04 + Math.sin(alpha * Math.PI) * 0.05;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color={isExecuting ? '#B40023' : '#FCF0D6'}
        transparent
        opacity={isExecuting ? 0.9 : 0.4}
      />
    </instancedMesh>
  );
};
