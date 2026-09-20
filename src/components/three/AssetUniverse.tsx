import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ASSET_COLORS, Asset } from '../../core/data';
import { WebGLErrorBoundary } from '../common/WebGLErrorBoundary';

interface AssetNodeProps {
  position: [number, number, number];
  color: string;
  label: string;
  symbol: string;
  volatility: number;  // 0–1 normalized
  size?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

function AssetNode({ position, color, label: _label, symbol, volatility, size = 1, isSelected, onClick }: AssetNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      glowRef.current.scale.setScalar(pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
    }
  });

  const nodeSize = size * (0.8 + volatility * 0.4);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position} onClick={onClick}>
        {/* Glow sphere */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[nodeSize * 1.8, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>

        {/* Main node */}
        <Sphere ref={meshRef} args={[nodeSize, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            distort={0.2 + volatility * 0.15}
            speed={2}
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>

        {/* Selection ring */}
        {isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[nodeSize * 1.5, nodeSize * 1.6, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Label */}
        <Html position={[0, -nodeSize - 0.5, 0]} center pointerEvents="none">
          <div className="text-[10px] font-mono font-bold text-graphite bg-white/95 px-1.5 py-0.5 rounded border border-border shadow-xs whitespace-nowrap select-none">
            {symbol}
          </div>
        </Html>
      </group>
    </Float>
  );
}

interface CorrelationBeamProps {
  start: [number, number, number];
  end: [number, number, number];
  correlation: number;  // -1 to 1
  color: string;
}

function CorrelationBeam({ start, end, correlation, color }: CorrelationBeamProps) {
  const absCorr = Math.abs(correlation);
  if (absCorr < 0.1) return null;

  const points = useMemo(() => {
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + absCorr * 0.5,
      (start[2] + end[2]) / 2,
    ];
    return [start, mid, end].map(p => new THREE.Vector3(...p));
  }, [start, end, absCorr]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={absCorr * 1.5}
      transparent
      opacity={0.15 + absCorr * 0.25}
      dashed={correlation < 0}
      dashSize={0.3}
      gapSize={0.2}
    />
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.08;
    camera.position.x += (Math.sin(t) * 0.5 - camera.position.x) * 0.005;
    camera.position.y += (Math.cos(t) * 0.3 - camera.position.y) * 0.005;
  });
  return null;
}

interface AssetUniverseProps {
  correlations?: { GOLD_BTC: number; GOLD_NVDA: number; BTC_NVDA: number };
  volatilities?: { GOLD: number; BTC: number; NVDA: number };
  selectedAsset?: Asset;
  onAssetClick?: (asset: Asset) => void;
  compact?: boolean;
}

export function AssetUniverse({
  correlations = { GOLD_BTC: 0.12, GOLD_NVDA: 0.08, BTC_NVDA: 0.35 },
  volatilities = { GOLD: 0.3, BTC: 0.8, NVDA: 0.6 },
  selectedAsset,
  onAssetClick,
  compact = false,
}: AssetUniverseProps) {
  const positions: Record<Asset, [number, number, number]> = {
    GOLD: [-2.5, 0.5, 0],
    BTC: [0, -0.8, 0.5],
    NVDA: [2.5, 0.5, 0],
  };

  const sizes: Record<Asset, number> = {
    GOLD: 0.7,
    BTC: 1.0,
    NVDA: 0.85,
  };

  const fallback2D = (
    <div className="w-full h-full flex items-center justify-center p-4 bg-ivory-100 rounded border border-border">
      <div className="flex gap-3 justify-center items-center">
        {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((asset) => (
          <button
            key={asset}
            onClick={() => onAssetClick?.(asset)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono border transition-all cursor-pointer ${
              selectedAsset === asset
                ? 'bg-graphite text-white border-graphite shadow-xs'
                : 'bg-white text-graphite border-border hover:border-graphite'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[asset] }} />
            <span>{asset === 'GOLD' ? 'XAU' : asset}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`w-full ${compact ? 'h-48' : 'h-full'} relative`} style={{ minHeight: compact ? 192 : 400 }}>
      <WebGLErrorBoundary fallback={fallback2D}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} color="#FFF8EF" />
          <directionalLight position={[-5, -3, 2]} intensity={0.3} color="#EEF2FF" />
          <pointLight position={[0, 0, 3]} intensity={0.4} color="#FFFFFF" />

          {/* Correlation beams */}
          <CorrelationBeam
            start={positions.GOLD}
            end={positions.BTC}
            correlation={correlations.GOLD_BTC}
            color={ASSET_COLORS.GOLD}
          />
          <CorrelationBeam
            start={positions.GOLD}
            end={positions.NVDA}
            correlation={correlations.GOLD_NVDA}
            color={ASSET_COLORS.GOLD}
          />
          <CorrelationBeam
            start={positions.BTC}
            end={positions.NVDA}
            correlation={correlations.BTC_NVDA}
            color={ASSET_COLORS.BTC}
          />

          {/* Asset nodes */}
          {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((asset) => (
            <AssetNode
              key={asset}
              position={positions[asset]}
              color={ASSET_COLORS[asset]}
              label={asset}
              symbol={asset === 'GOLD' ? 'XAU' : asset}
              volatility={volatilities[asset]}
              size={sizes[asset]}
              isSelected={selectedAsset === asset}
              onClick={() => onAssetClick?.(asset)}
            />
          ))}

          <CameraRig />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 4}
            autoRotate
            autoRotateSpeed={0.4}
            dampingFactor={0.05}
            enableDamping
          />
        </Suspense>
      </Canvas>
      </WebGLErrorBoundary>

      {/* Fallback label if WebGL fails */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center text-graphite-400 text-sm">
          3D visualization requires WebGL
        </div>
      </noscript>
    </div>
  );
}

export { BxKnowledgeCore } from './BxKnowledgeCore';
