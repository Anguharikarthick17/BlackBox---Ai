import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PRICE_DATA, Asset, ASSET_COLORS } from '../../core/data';
import { computeMetrics } from '../../core/metrics';
import { computeCorrelationMatrix } from '../../core/correlations';
import { WebGLErrorBoundary } from '../common/WebGLErrorBoundary';

const goldMetrics = computeMetrics(PRICE_DATA.GOLD);
const btcMetrics = computeMetrics(PRICE_DATA.BTC);
const nvdaMetrics = computeMetrics(PRICE_DATA.NVDA);
const corrMatrix = computeCorrelationMatrix(PRICE_DATA);

interface AssetNodeSpec {
  asset: Asset;
  name: string;
  symbol: string;
  color: string;
  radius: number; // derived from volatility
  orbitalDistance: number;
  speed: number;
  metrics: {
    annReturn: string;
    volatility: string;
    sharpe: string;
    maxDd: string;
    description: string;
  };
}

const ASSET_SPECS: Record<Asset, AssetNodeSpec> = {
  GOLD: {
    asset: 'GOLD',
    name: 'Gold',
    symbol: 'XAU',
    color: '#C9A84C',
    radius: 0.8 + (goldMetrics.volatility / 100) * 0.5,
    orbitalDistance: 3.2,
    speed: 0.15,
    metrics: {
      annReturn: `${goldMetrics.annualizedReturn.toFixed(1)}%`,
      volatility: `${goldMetrics.volatility.toFixed(1)}%`,
      sharpe: goldMetrics.sharpeRatio.toFixed(2),
      maxDd: `-${goldMetrics.maxDrawdown.toFixed(1)}%`,
      description: 'Capital preservation anchor • Low systemic correlation',
    },
  },
  BTC: {
    asset: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: '#F7931A',
    radius: 0.8 + (btcMetrics.volatility / 100) * 0.5,
    orbitalDistance: 4.8,
    speed: 0.35,
    metrics: {
      annReturn: `${btcMetrics.annualizedReturn.toFixed(1)}%`,
      volatility: `${btcMetrics.volatility.toFixed(1)}%`,
      sharpe: btcMetrics.sharpeRatio.toFixed(2),
      maxDd: `-${btcMetrics.maxDrawdown.toFixed(1)}%`,
      description: 'Digital asymmetry • High volatility regime driver',
    },
  },
  NVDA: {
    asset: 'NVDA',
    name: 'NVIDIA',
    symbol: 'NVDA',
    color: '#76B900',
    radius: 0.8 + (nvdaMetrics.volatility / 100) * 0.5,
    orbitalDistance: 4.0,
    speed: 0.25,
    metrics: {
      annReturn: `${nvdaMetrics.annualizedReturn.toFixed(1)}%`,
      volatility: `${nvdaMetrics.volatility.toFixed(1)}%`,
      sharpe: nvdaMetrics.sharpeRatio.toFixed(2),
      maxDd: `-${nvdaMetrics.maxDrawdown.toFixed(1)}%`,
      description: 'Compute infrastructure • Growth momentum vector',
    },
  },
};

function OrbitalPath({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.02, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

function OrbitingAsset({
  spec,
  isSelected,
  onClick,
  onHover,
}: {
  spec: AssetNodeSpec;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const sphereRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime * spec.speed;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * spec.orbitalDistance;
      groupRef.current.position.z = Math.sin(t) * spec.orbitalDistance;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.4;
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
      }}
    >
      {/* Node Sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[spec.radius, 32, 32]} />
        <meshStandardMaterial
          color={spec.color}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Pulsing ring on select */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spec.radius * 1.3, spec.radius * 1.36, 64]} />
          <meshBasicMaterial color="#B40023" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      <Html position={[0, -spec.radius - 0.45, 0]} center pointerEvents="none">
        <div className="text-[11px] font-mono font-bold text-graphite bg-white/95 px-2 py-0.5 rounded border border-border shadow-xs select-none whitespace-nowrap">
          {spec.symbol}
        </div>
      </Html>
    </group>
  );
}

export function MarketUniverse3D({ className = '' }: { className?: string }) {
  const [selectedAsset, setSelectedAsset] = useState<Asset>('BTC');
  const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);

  const activeSpec = ASSET_SPECS[hoveredAsset || selectedAsset];

  const fallback2D = (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-cream border border-border rounded-xl">
      <div className="text-center max-w-sm space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-crimson">
          SYNCHRONIZED ASSET GEOMETRY
        </div>
        <p className="text-xs text-taupe font-mono">
          Gold (XAU) · Bitcoin (BTC) · NVIDIA (NVDA)
        </p>
        <div className="flex gap-2 justify-center pt-2">
          {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((a) => (
            <button
              key={a}
              onClick={() => setSelectedAsset(a)}
              className={`px-3 py-1.5 rounded font-mono text-xs border transition-all cursor-pointer ${
                selectedAsset === a
                  ? 'bg-graphite text-white border-graphite shadow-xs'
                  : 'bg-white text-graphite border-border hover:border-graphite'
              }`}
            >
              {ASSET_SPECS[a].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full relative select-none h-[500px] overflow-hidden ${className}`}>
      <WebGLErrorBoundary fallback={fallback2D}>
        <Canvas
          camera={{ position: [0, 4.5, 9], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 8, 5]} intensity={1.1} color="#FCF0D6" />
          <directionalLight position={[-6, -3, 3]} intensity={0.3} color="#FFFFFF" />
          <pointLight position={[0, 0, 0]} intensity={0.5} color="#B40023" />

          {/* Central Gravity Well Marker */}
          <mesh>
            <sphereGeometry args={[0.5, 24, 24]} />
            <meshStandardMaterial color="#151515" roughness={0.3} metalness={0.9} />
          </mesh>
          <Html position={[0, -0.8, 0]} center pointerEvents="none">
            <div className="text-[9px] font-mono font-bold text-taupe bg-white/80 px-1.5 py-0.5 rounded border border-border select-none whitespace-nowrap">
              SYSTEM AXIS
            </div>
          </Html>

          {/* Orbital Paths */}
          <OrbitalPath radius={ASSET_SPECS.GOLD.orbitalDistance} color="#C9A84C" />
          <OrbitalPath radius={ASSET_SPECS.NVDA.orbitalDistance} color="#76B900" />
          <OrbitalPath radius={ASSET_SPECS.BTC.orbitalDistance} color="#F7931A" />

          {/* Orbiting Assets */}
          {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((a) => (
            <OrbitingAsset
              key={a}
              spec={ASSET_SPECS[a]}
              isSelected={selectedAsset === a}
              onClick={() => setSelectedAsset(a)}
              onHover={(hov) => setHoveredAsset(hov ? a : null)}
            />
          ))}

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.1}
            minPolarAngle={Math.PI / 4}
            autoRotate
            autoRotateSpeed={0.3}
          />
        </Suspense>
      </Canvas>
      </WebGLErrorBoundary>

      {/* HUD Telemetry Overlay */}
      <div className="absolute top-4 left-4 max-w-sm bg-white/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-elevated">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeSpec.color }} />
            <span className="font-mono text-xs font-bold uppercase text-graphite">
              {activeSpec.name} ({activeSpec.symbol})
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase text-crimson font-bold">
            5-YEAR REGIME DATA
          </span>
        </div>

        <p className="text-xs text-taupe mb-3 leading-relaxed">
          {activeSpec.metrics.description}
        </p>

        <div className="grid grid-cols-3 gap-2 font-mono">
          <div className="bg-cream-100 p-2 rounded border border-border/60">
            <span className="text-[9px] uppercase text-taupe block">VOLATILITY</span>
            <span className="text-xs font-bold text-graphite">{activeSpec.metrics.volatility}</span>
          </div>
          <div className="bg-cream-100 p-2 rounded border border-border/60">
            <span className="text-[9px] uppercase text-taupe block">SHARPE</span>
            <span className="text-xs font-bold text-graphite">{activeSpec.metrics.sharpe}</span>
          </div>
          <div className="bg-cream-100 p-2 rounded border border-border/60">
            <span className="text-[9px] uppercase text-taupe block">MAX DRAWDOWN</span>
            <span className="text-xs font-bold text-crimson">{activeSpec.metrics.maxDd}</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-taupe">
          <span>PAIRWISE CORRELATIONS:</span>
          <span className="text-graphite font-semibold">
            {activeSpec.asset === 'BTC' ? `NVDA: ${corrMatrix.BTC.NVDA.toFixed(2)} · GOLD: ${corrMatrix.BTC.GOLD.toFixed(2)}` :
             activeSpec.asset === 'GOLD' ? `BTC: ${corrMatrix.GOLD.BTC.toFixed(2)} · NVDA: ${corrMatrix.GOLD.NVDA.toFixed(2)}` :
             `BTC: ${corrMatrix.NVDA.BTC.toFixed(2)} · GOLD: ${corrMatrix.NVDA.GOLD.toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
