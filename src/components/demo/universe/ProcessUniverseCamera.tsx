/**
 * BLACKBOX X — 3D PROCESS UNIVERSE CAMERA CONTROLLER
 * Smooth cinematic framing for each computational stage
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ProcessUniverseStageId } from '../../../core/demo/demoTypes';
import { UNIVERSE_STAGES } from './universeStages';

interface ProcessUniverseCameraProps {
  stageId: ProcessUniverseStageId;
  enableUserControl?: boolean;
}

export const ProcessUniverseCamera: React.FC<ProcessUniverseCameraProps> = ({
  stageId,
  enableUserControl = true,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Track desired camera target and position
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-12, 6, 16));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(-8, 0, 0));
  const isTransitioningRef = useRef<boolean>(true);

  // Update desired positions when stage changes
  useEffect(() => {
    const config = UNIVERSE_STAGES.find((s) => s.id === stageId) || UNIVERSE_STAGES[0];
    targetPosRef.current.set(
      config.cameraPosition[0],
      config.cameraPosition[1],
      config.cameraPosition[2]
    );
    targetLookAtRef.current.set(
      config.cameraTarget[0],
      config.cameraTarget[1],
      config.cameraTarget[2]
    );
    isTransitioningRef.current = true;
  }, [stageId]);

  useFrame((_, delta) => {
    // Smooth cinematic dampening toward stage vantage point
    if (isTransitioningRef.current) {
      // Step factor scaled with delta (standard 60fps ~ 0.016s)
      const factor = Math.min(1, delta * 2.8);
      camera.position.lerp(targetPosRef.current, factor);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAtRef.current, factor);
        controlsRef.current.update();
      } else {
        camera.lookAt(targetLookAtRef.current);
      }

      // Check if settled
      if (
        camera.position.distanceTo(targetPosRef.current) < 0.05 &&
        (!controlsRef.current || controlsRef.current.target.distanceTo(targetLookAtRef.current) < 0.05)
      ) {
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={enableUserControl}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      panSpeed={0.5}
      minDistance={3}
      maxDistance={35}
      maxPolarAngle={Math.PI / 1.7}
      minPolarAngle={Math.PI / 8}
      onStart={() => {
        // Pause auto-transition if user actively drags
        isTransitioningRef.current = false;
      }}
    />
  );
};
