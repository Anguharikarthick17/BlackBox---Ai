import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PRICE_DATA, Asset } from '../../core/data';
import { computeMetrics } from '../../core/metrics';

export type CoreNodeId = Asset | 'MARKET' | 'STRATEGY' | 'RISK' | 'REGIME' | 'EVIDENCE' | 'CORE';

interface CoreNodeData {
  id: CoreNodeId;
  label: string;
  category: 'ASSET' | 'SYSTEM' | 'CORE';
  color: string;
  metalness: number;
  roughness: number;
  position: [number, number, number];
  size: number;
  labelOffset?: [number, number, number];
  metrics?: {
    annualizedReturn?: string;
    volatility?: string;
    sharpeRatio?: string;
    maxDrawdown?: string;
    description: string;
  };
  connections: CoreNodeId[];
}

// Compute real quantitative metrics from PRICE_DATA
const goldMetrics = computeMetrics(PRICE_DATA.GOLD);
const btcMetrics = computeMetrics(PRICE_DATA.BTC);
const nvdaMetrics = computeMetrics(PRICE_DATA.NVDA);

// Balanced depth-stratified spatial distribution around physical BX Core
export const NODES: Record<CoreNodeId, CoreNodeData> = {
  CORE: {
    id: 'CORE',
    label: 'CORE',
    category: 'CORE',
    color: '#B40023',
    metalness: 0.88,
    roughness: 0.2,
    position: [0, 0, 0],
    size: 0.52,
    metrics: {
      description: 'Physical Quantitative Engine & Lineage Core',
    },
    connections: ['MARKET', 'STRATEGY', 'RISK', 'REGIME', 'EVIDENCE', 'GOLD', 'BTC', 'NVDA'],
  },
  MARKET: {
    id: 'MARKET',
    label: 'MARKET',
    category: 'SYSTEM',
    color: '#151515',
    metalness: 0.6,
    roughness: 0.4,
    position: [0, 2.7, 0],
    size: 0.28,
    labelOffset: [0, 0.42, 0],
    metrics: {
      description: 'Cross-Asset Correlation Matrix & Drift Dynamics',
    },
    connections: ['CORE', 'GOLD', 'BTC'],
  },
  GOLD: {
    id: 'GOLD',
    label: 'GOLD',
    category: 'ASSET',
    color: '#C9A84C',
    metalness: 0.8,
    roughness: 0.28,
    position: [-2.7, 0.9, 0.3],
    size: 0.34,
    labelOffset: [-0.30, 0.44, 0],
    metrics: {
      annualizedReturn: `${goldMetrics.annualizedReturn.toFixed(1)}%`,
      volatility: `${goldMetrics.volatility.toFixed(1)}%`,
      sharpeRatio: goldMetrics.sharpeRatio.toFixed(2),
      maxDrawdown: `-${goldMetrics.maxDrawdown.toFixed(1)}%`,
      description: 'Macro Safe-Haven • Low Volatility Anchor',
    },
    connections: ['CORE', 'MARKET', 'REGIME', 'RISK'],
  },
  BTC: {
    id: 'BTC',
    label: 'BTC',
    category: 'ASSET',
    color: '#F7931A',
    metalness: 0.7,
    roughness: 0.32,
    position: [2.7, 0.9, 0.5],
    size: 0.38,
    labelOffset: [0.30, 0.44, 0],
    metrics: {
      annualizedReturn: `${btcMetrics.annualizedReturn.toFixed(1)}%`,
      volatility: `${btcMetrics.volatility.toFixed(1)}%`,
      sharpeRatio: btcMetrics.sharpeRatio.toFixed(2),
      maxDrawdown: `-${btcMetrics.maxDrawdown.toFixed(1)}%`,
      description: 'High Beta • Non-Linear Regime Sensitive',
    },
    connections: ['CORE', 'MARKET', 'STRATEGY', 'EVIDENCE'],
  },
  NVDA: {
    id: 'NVDA',
    label: 'NVIDIA',
    category: 'ASSET',
    color: '#76B900',
    metalness: 0.65,
    roughness: 0.35,
    position: [0, -3.2, -0.2],
    size: 0.34,
    labelOffset: [0, -0.46, 0],
    metrics: {
      annualizedReturn: `${nvdaMetrics.annualizedReturn.toFixed(1)}%`,
      volatility: `${nvdaMetrics.volatility.toFixed(1)}%`,
      sharpeRatio: nvdaMetrics.sharpeRatio.toFixed(2),
      maxDrawdown: `-${nvdaMetrics.maxDrawdown.toFixed(1)}%`,
      description: 'High Momentum Growth • Idiosyncratic Alpha',
    },
    connections: ['CORE', 'RISK', 'STRATEGY'],
  },
  STRATEGY: {
    id: 'STRATEGY',
    label: 'STRATEGY',
    category: 'SYSTEM',
    color: '#B40023',
    metalness: 0.75,
    roughness: 0.3,
    position: [1.7, -2.0, 0.1],
    size: 0.26,
    labelOffset: [0.36, -0.38, 0],
    metrics: {
      description: '4 Algorithmic Engines: SMA, EMA, Momentum, Mean Reversion',
    },
    connections: ['CORE', 'BTC', 'NVDA', 'EVIDENCE'],
  },
  RISK: {
    id: 'RISK',
    label: 'RISK',
    category: 'SYSTEM',
    color: '#151515',
    metalness: 0.7,
    roughness: 0.35,
    position: [-1.7, -2.4, 0.4],
    size: 0.26,
    labelOffset: [-0.36, -0.38, 0],
    metrics: {
      description: 'Gaussian & Historical VaR, CVaR, Monte Carlo 10,000 Paths',
    },
    connections: ['CORE', 'GOLD', 'REGIME', 'NVDA'],
  },
  REGIME: {
    id: 'REGIME',
    label: 'REGIME',
    category: 'SYSTEM',
    color: '#5C0012',
    metalness: 0.7,
    roughness: 0.35,
    position: [-2.4, -1.3, 0.2],
    size: 0.28,
    labelOffset: [-0.42, 0.04, 0],
    metrics: {
      description: 'Macro States: Bull, Bear, High Volatility, Stagnant',
    },
    connections: ['CORE', 'GOLD', 'RISK'],
  },
  EVIDENCE: {
    id: 'EVIDENCE',
    label: 'EVIDENCE',
    category: 'SYSTEM',
    color: '#FCF0D6',
    metalness: 0.35,
    roughness: 0.4,
    position: [2.4, -0.7, -0.3],
    size: 0.28,
    labelOffset: [0.42, 0.04, 0],
    metrics: {
      description: 'Cryptographic SHA-256 Fingerprints & Immutable Lineage',
    },
    connections: ['CORE', 'BTC', 'STRATEGY'],
  },
};

// Orbital Rings scaled around universe center
function OrbitalRings() {
  const ringRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.02;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.06 + 0.22;
    }
  });

  return (
    <group ref={ringRef}>
      {/* Primary Equatorial Ring (approx 3.7 units radius) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.7, 3.72, 128]} />
        <meshBasicMaterial color="#151515" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>

      {/* Secondary Tilted Ring (approx 4.9 units radius) */}
      <mesh rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <ringGeometry args={[4.9, 4.92, 128]} />
        <meshBasicMaterial color="#746E67" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Crimson Inner Resonance Ring (approx 2.1 units radius) */}
      <mesh rotation={[Math.PI / 4, -Math.PI / 5, 0]}>
        <ringGeometry args={[2.1, 2.115, 96]} />
        <meshBasicMaterial color="#B40023" transparent opacity={0.10} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Background Distant Data Field providing spatial depth parallax
function BackgroundDataField() {
  const points = useMemo(() => {
    return [
      [-3.2, 1.8, -3.0],
      [3.4, 2.0, -3.5],
      [-2.8, -1.9, -3.2],
      [3.0, -1.8, -3.8],
      [-4.0, 0.2, -4.0],
      [4.1, 0.4, -4.2],
      [-1.5, 2.4, -2.8],
      [1.6, 2.3, -3.1],
      [-1.4, -2.3, -3.3],
      [1.5, -2.2, -3.0],
      [0.0, 2.6, -3.5],
      [0.0, -2.5, -3.5],
    ] as [number, number, number][];
  }, []);

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={`bg-pt-${i}`} position={p}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#746E67" transparent opacity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

// Interactive Central Core (Scaled Down ~40% for Editorial Balance)
function CentralCoreMesh({
  isSelected,
  onClick,
}: {
  isSelected: boolean;
  onClick: () => void;
}) {
  const icosaRef = useRef<THREE.Mesh>(null!);
  const octaRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (icosaRef.current) {
      icosaRef.current.rotation.y = t * 0.18;
      icosaRef.current.rotation.x = Math.sin(t * 0.15) * 0.1;
    }
    if (octaRef.current) {
      octaRef.current.rotation.y = -t * 0.22;
      octaRef.current.rotation.z = Math.cos(t * 0.15) * 0.1;
    }
  });

  return (
    <group onClick={onClick}>
      {/* Outer Crimson Metallic Cage - Scaled to 0.82 */}
      <mesh ref={icosaRef}>
        <icosahedronGeometry args={[0.82, 1]} />
        <meshStandardMaterial
          color="#B40023"
          metalness={0.9}
          roughness={0.18}
          wireframe
          transparent
          opacity={isSelected ? 0.7 : 0.38}
        />
      </mesh>

      {/* Inner Dense Core - Scaled to 0.54 */}
      <mesh ref={octaRef}>
        <octahedronGeometry args={[0.54, 0]} />
        <meshStandardMaterial
          color="#870019"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>

      {/* Minimal Technical Center Label */}
      <Html center pointerEvents="none">
        <div className="text-[8.5px] font-mono font-bold tracking-widest text-cream bg-crimson/90 px-1.5 py-0.5 rounded shadow-none select-none">
          BX
        </div>
      </Html>
    </group>
  );
}

// Connection Spline between nodes (Restrained Technical Hierarchical Lines)
function ConnectionLine({
  start,
  end,
  active,
}: {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
}) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  return (
    <Line
      points={points}
      color={active ? '#B40023' : '#746E67'}
      lineWidth={active ? 1.5 : 1}
      transparent
      opacity={active ? 0.42 : 0.12}
    />
  );
}

// Peripheral Node with Float & Billboards
function PeripheralNodeMesh({
  node,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  node: CoreNodeData;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.25}>
      <group
        position={node.position}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
        }}
      >
        {/* Node Body */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[node.size, 32, 32]} />
          <meshStandardMaterial
            color={node.color}
            metalness={node.metalness}
            roughness={node.roughness}
          />
        </mesh>

        {/* Subtle Crimson Wireframe Indicator on Selection or Hover */}
        {(isSelected || isHovered || node.id === 'BTC') && (
          <mesh>
            <sphereGeometry args={[node.size * 1.25, 20, 20]} />
            <meshBasicMaterial
              color="#B40023"
              wireframe
              transparent
              opacity={isSelected ? 0.6 : (isHovered ? 0.35 : 0.16)}
            />
          </mesh>
        )}

        {/* Minimal Technical Label (Scientific, hairline, compact) */}
        <Html
          position={node.labelOffset || [0, -node.size - 0.28, 0]}
          center
          pointerEvents="none"
        >
          <div
            className={`font-mono tracking-widest font-semibold px-1.5 py-0.5 rounded border transition-all duration-200 select-none ${
              isSelected
                ? 'bg-crimson text-cream border-crimson shadow-sm scale-105 text-[8.5px]'
                : isHovered
                ? 'bg-graphite text-cream border-graphite scale-105 text-[8.5px]'
                : node.category === 'ASSET'
                ? 'bg-cream/80 backdrop-blur-xs text-graphite/85 border-graphite/20 text-[8px]'
                : 'bg-cream/60 backdrop-blur-xs text-taupe/80 border-border/70 text-[7.5px]'
            }`}
          >
            {node.label}
          </div>
        </Html>
      </group>
    </Float>
  );
}

interface BlackboxCore3DProps {
  selectedNodeId?: CoreNodeId;
  onSelectNode?: (id: CoreNodeId) => void;
  className?: string;
  height?: string | number;
}

export function BlackboxCore3D({
  selectedNodeId,
  onSelectNode,
  className = '',
  height = '100%',
}: BlackboxCore3DProps) {
  // Default hero state: Clean spatial universe with NO large card until clicked
  const [activeId, setActiveId] = useState<CoreNodeId | null>(selectedNodeId || null);
  const [hoveredId, setHoveredId] = useState<CoreNodeId | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  const activeNode = activeId ? NODES[activeId] : null;
  const hoveredNode = hoveredId ? NODES[hoveredId] : null;
  const displayNode = activeNode || hoveredNode;

  const handleSelect = (id: CoreNodeId) => {
    setActiveId(prev => prev === id ? null : id);
    if (onSelectNode) onSelectNode(id);
  };

  if (hasWebGLError) {
    return (
      <div
        className={`w-full flex flex-col items-center justify-center p-8 bg-cream border border-border rounded-xl relative ${className}`}
        style={{ minHeight: typeof height === 'number' ? height : 480 }}
      >
        <div className="max-w-md text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-crimson flex items-center justify-center text-cream font-bold text-xl mb-3">
            BX
          </div>
          <h3 className="font-display font-bold uppercase text-2xl text-graphite mb-1">
            BLACKBOX 3D CORE
          </h3>
          <p className="text-xs text-taupe font-mono mb-4">
            Institutional topological research graph connecting assets, strategies, and empirical risk models.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.values(NODES).map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelect(n.id)}
                className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                  activeId === n.id
                    ? 'bg-crimson text-cream border-crimson'
                    : 'bg-white text-graphite border-border hover:border-graphite'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full relative select-none overflow-hidden ${className}`}
      style={{ minHeight: typeof height === 'number' ? height : 480 }}
      onClick={() => {
        if (activeId) setActiveId(null);
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10.8], fov: 39 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onError={() => setHasWebGLError(true)}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[6, 8, 6]} intensity={1.2} color="#FCF0D6" />
          <directionalLight position={[-6, -4, 4]} intensity={0.4} color="#FFFFFF" />
          <pointLight position={[0, 0, 4]} intensity={0.5} color="#B40023" />

          {/* Centered 3D Universe Group: Scaled consistently (0.84) with origin at [0, 0, 0] */}
          <group position={[0, 0, 0]} scale={0.84}>
            {/* Distant Micro Background Data Field for Parallax Depth */}
            <BackgroundDataField />

            {/* Coordinate Orbital Rings */}
            <OrbitalRings />

            {/* Connection Lines to Core */}
            {Object.values(NODES).map((n) => {
              if (n.id === 'CORE') return null;
              const isConnectedToActive =
                activeId === 'CORE' ||
                activeId === n.id ||
                (activeId ? n.connections.includes(activeId) : false);

              return (
                <ConnectionLine
                  key={`line-core-${n.id}`}
                  start={[0, 0, 0]}
                  end={n.position}
                  active={isConnectedToActive}
                />
              );
            })}

            {/* Circular/Orbital Inter-node Perimeter Relationships */}
            <ConnectionLine
              start={NODES.MARKET.position}
              end={NODES.GOLD.position}
              active={activeId === 'MARKET' || activeId === 'GOLD'}
            />
            <ConnectionLine
              start={NODES.MARKET.position}
              end={NODES.BTC.position}
              active={activeId === 'MARKET' || activeId === 'BTC'}
            />
            <ConnectionLine
              start={NODES.GOLD.position}
              end={NODES.REGIME.position}
              active={activeId === 'GOLD' || activeId === 'REGIME'}
            />
            <ConnectionLine
              start={NODES.REGIME.position}
              end={NODES.RISK.position}
              active={activeId === 'REGIME' || activeId === 'RISK'}
            />
            <ConnectionLine
              start={NODES.RISK.position}
              end={NODES.NVDA.position}
              active={activeId === 'RISK' || activeId === 'NVDA'}
            />
            <ConnectionLine
              start={NODES.NVDA.position}
              end={NODES.STRATEGY.position}
              active={activeId === 'NVDA' || activeId === 'STRATEGY'}
            />
            <ConnectionLine
              start={NODES.STRATEGY.position}
              end={NODES.EVIDENCE.position}
              active={activeId === 'STRATEGY' || activeId === 'EVIDENCE'}
            />
            <ConnectionLine
              start={NODES.EVIDENCE.position}
              end={NODES.BTC.position}
              active={activeId === 'EVIDENCE' || activeId === 'BTC'}
            />
            <ConnectionLine
              start={NODES.RISK.position}
              end={NODES.STRATEGY.position}
              active={activeId === 'RISK' || activeId === 'STRATEGY'}
            />
            <ConnectionLine
              start={NODES.STRATEGY.position}
              end={NODES.BTC.position}
              active={activeId === 'STRATEGY' || activeId === 'BTC'}
            />

            {/* Central Physical BX Core */}
            <CentralCoreMesh
              isSelected={activeId === 'CORE'}
              onClick={() => handleSelect('CORE')}
            />

            {/* All Peripheral Nodes */}
            {Object.values(NODES).map((node) => {
              if (node.id === 'CORE') return null;
              return (
                <PeripheralNodeMesh
                  key={node.id}
                  node={node}
                  isSelected={activeId === node.id}
                  isHovered={hoveredId === node.id}
                  onClick={() => handleSelect(node.id)}
                  onPointerOver={() => setHoveredId(node.id)}
                  onPointerOut={() => setHoveredId(null)}
                />
              );
            })}
          </group>

          <OrbitControls
            target={[0, 0, 0]}
            enableZoom={true}
            minDistance={7}
            maxDistance={15}
            enablePan={false}
            autoRotate={false}
            dampingFactor={0.06}
            enableDamping
          />
        </Suspense>
      </Canvas>

      {/* Contextual Focus Panel (Appears smoothly ONLY when a node is clicked) */}
      {activeNode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 right-6 max-w-[260px] bg-white/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg transition-all duration-300 pointer-events-auto z-20"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/70">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activeNode.color }}
              />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-graphite truncate">
                {activeNode.label} · {activeNode.id}
              </span>
            </div>
            <button
              onClick={() => setActiveId(null)}
              className="text-taupe hover:text-crimson font-mono text-xs px-1 hover:bg-cream-100 rounded"
              aria-label="Close inspector"
            >
              ×
            </button>
          </div>

          <p className="text-[10px] text-taupe font-sans leading-snug mb-2">
            {activeNode.metrics?.description}
          </p>

          {activeNode.metrics?.volatility && (
            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-border/60 font-mono text-center">
              <div className="bg-cream-100/80 p-1 rounded border border-border/40">
                <span className="text-[7.5px] uppercase tracking-wider text-taupe block">VOL</span>
                <span className="text-[10px] font-bold text-graphite">{activeNode.metrics.volatility}</span>
              </div>
              <div className="bg-cream-100/80 p-1 rounded border border-border/40">
                <span className="text-[7.5px] uppercase tracking-wider text-taupe block">SHARPE</span>
                <span className="text-[10px] font-bold text-graphite">{activeNode.metrics.sharpeRatio}</span>
              </div>
              <div className="bg-cream-100/80 p-1 rounded border border-border/40">
                <span className="text-[7.5px] uppercase tracking-wider text-taupe block">MAX DD</span>
                <span className="text-[10px] font-bold text-crimson">{activeNode.metrics.maxDrawdown}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
