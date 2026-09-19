import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { StressScenarioId } from '../../core/stressTesting';

interface StressSpatialSceneProps {
  scenario: StressScenarioId;
  severity?: number; // 0 to 1
  className?: string;
  height?: number;
}

// Scenario specific parameters to drive spatial deformation
const SCENARIO_DYNAMICS: Record<StressScenarioId, {
  compression: number; // how much nodes pull into center
  volRingScale: number; // how large volatility shells expand
  crimsonTension: number; // intensity of crimson lines
  shakeSpeed: number; // instability frequency
  label: string;
}> = {
  GFC_2008: {
    compression: 0.55,
    volRingScale: 1.8,
    crimsonTension: 0.95,
    shakeSpeed: 1.2,
    label: '2008 SYSTEMIC DELEVERAGING',
  },
  COVID_2020: {
    compression: 0.4,
    volRingScale: 2.2,
    crimsonTension: 0.85,
    shakeSpeed: 2.4,
    label: '2020 FLASH COMPRESSION',
  },
  RATE_SHOCK_2022: {
    compression: 0.7,
    volRingScale: 1.4,
    crimsonTension: 0.65,
    shakeSpeed: 0.6,
    label: '2022 DURATION PRESSURE',
  },
  CRYPTO_CRASH: {
    compression: 0.6,
    volRingScale: 1.9,
    crimsonTension: 0.8,
    shakeSpeed: 1.8,
    label: 'CRYPTO CONTAGION UNWIND',
  },
  CUSTOM: {
    compression: 0.6,
    volRingScale: 1.5,
    crimsonTension: 0.75,
    shakeSpeed: 1.0,
    label: 'PARAMETRIC USER STRESS',
  },
};

function StressStructure({ scenario }: { scenario: StressScenarioId }) {
  const groupRef = useRef<THREE.Group>(null!);
  const dynamics = SCENARIO_DYNAMICS[scenario] || SCENARIO_DYNAMICS.GFC_2008;

  // 3 Asset node positions deformed by compression factor
  const positions = useMemo(() => {
    const factor = dynamics.compression;
    return {
      GOLD: [-2.8 * factor, 1.2 * factor, 0.4] as [number, number, number],
      BTC: [2.8 * factor, 1.2 * factor, -0.4] as [number, number, number],
      NVDA: [0, -2.5 * factor, 0.5] as [number, number, number],
      CORE: [0, 0, 0] as [number, number, number],
    };
  }, [dynamics.compression]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * dynamics.shakeSpeed;
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.position.y = Math.sin(t * 2) * 0.08;
    }
  });

  const goldLine = useMemo(() => [new THREE.Vector3(...positions.CORE), new THREE.Vector3(...positions.GOLD)], [positions]);
  const btcLine = useMemo(() => [new THREE.Vector3(...positions.CORE), new THREE.Vector3(...positions.BTC)], [positions]);
  const nvdaLine = useMemo(() => [new THREE.Vector3(...positions.CORE), new THREE.Vector3(...positions.NVDA)], [positions]);
  const crossLine1 = useMemo(() => [new THREE.Vector3(...positions.GOLD), new THREE.Vector3(...positions.BTC)], [positions]);
  const crossLine2 = useMemo(() => [new THREE.Vector3(...positions.BTC), new THREE.Vector3(...positions.NVDA)], [positions]);

  return (
    <group ref={groupRef}>
      {/* Expanding Volatility Shock Shell */}
      <mesh>
        <sphereGeometry args={[2.5 * dynamics.volRingScale, 24, 24]} />
        <meshBasicMaterial
          color="#B40023"
          wireframe
          transparent
          opacity={0.15 * dynamics.crimsonTension}
        />
      </mesh>

      {/* Central Shock Focus Core */}
      <mesh position={positions.CORE}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#870019"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <Html position={[0, 1.2, 0]} center pointerEvents="none">
        <div className="text-[10px] font-mono font-bold text-crimson bg-cream px-2 py-0.5 rounded border border-crimson/30 shadow-xs whitespace-nowrap">
          {dynamics.label}
        </div>
      </Html>

      {/* Asset Nodes under Stress */}
      <mesh position={positions.GOLD}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#C9A84C" metalness={0.8} roughness={0.2} />
      </mesh>
      <Html position={[positions.GOLD[0], positions.GOLD[1] - 0.9, positions.GOLD[2]]} center pointerEvents="none">
        <div className="text-[10px] font-mono font-bold text-graphite bg-white/95 px-1.5 py-0.5 rounded border border-border shadow-xs whitespace-nowrap">
          GOLD
        </div>
      </Html>

      <mesh position={positions.BTC}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial color="#F7931A" metalness={0.8} roughness={0.2} />
      </mesh>
      <Html position={[positions.BTC[0], positions.BTC[1] - 1.0, positions.BTC[2]]} center pointerEvents="none">
        <div className="text-[10px] font-mono font-bold text-graphite bg-white/95 px-1.5 py-0.5 rounded border border-border shadow-xs whitespace-nowrap">
          BTC
        </div>
      </Html>

      <mesh position={positions.NVDA}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#76B900" metalness={0.8} roughness={0.2} />
      </mesh>
      <Html position={[positions.NVDA[0], positions.NVDA[1] - 0.95, positions.NVDA[2]]} center pointerEvents="none">
        <div className="text-[10px] font-mono font-bold text-graphite bg-white/95 px-1.5 py-0.5 rounded border border-border shadow-xs whitespace-nowrap">
          NVDA
        </div>
      </Html>

      {/* Tightened Crimson Shock Tension Lines */}
      <Line points={goldLine} color="#B40023" lineWidth={3.5} transparent opacity={dynamics.crimsonTension} />
      <Line points={btcLine} color="#B40023" lineWidth={4} transparent opacity={dynamics.crimsonTension} />
      <Line points={nvdaLine} color="#B40023" lineWidth={3.5} transparent opacity={dynamics.crimsonTension} />
      <Line points={crossLine1} color="#B40023" lineWidth={2} dashed dashSize={0.3} gapSize={0.2} transparent opacity={0.6} />
      <Line points={crossLine2} color="#B40023" lineWidth={2} dashed dashSize={0.3} gapSize={0.2} transparent opacity={0.6} />
    </group>
  );
}

export function StressSpatialScene({
  scenario = 'GFC_2008',
  severity = 0.8,
  className = '',
  height = 440,
}: StressSpatialSceneProps) {
  return (
    <div className={`w-full relative select-none overflow-hidden ${className}`} style={{ height }}>
      <Canvas
        camera={{ position: [0, 1, 8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[6, 8, 6]} intensity={1.2} color="#FCF0D6" />
          <directionalLight position={[-6, -4, 4]} intensity={0.4} color="#FFFFFF" />
          <pointLight position={[0, 0, 3]} intensity={0.8} color="#B40023" />

          <StressStructure scenario={scenario} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-border px-3 py-1.5 rounded text-[10px] font-mono text-taupe">
        <span className="text-crimson font-bold">SPATIAL SHOCK DEFORMATION:</span> GEOMETRY COMPRESSING UNDER STRESS
      </div>
    </div>
  );
}
