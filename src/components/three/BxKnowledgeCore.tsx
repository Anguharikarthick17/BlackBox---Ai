import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ASSET_COLORS, Asset } from '../../core/data';

export type NodeId = Asset | 'MARKET' | 'STRATEGY' | 'RISK' | 'REGIME' | 'EVIDENCE';

interface NodeData {
  id: NodeId;
  label: string;
  sublabel: string;
  color: string;
  position: [number, number, number];
  size: number;
  isAsset?: boolean;
}

const NODES: NodeData[] = [
  // Asset nodes
  { id: 'GOLD', label: 'GOLD (XAU)', sublabel: 'Low Vol · Safe Haven', color: ASSET_COLORS.GOLD, position: [-3.2, 1.2, 0.4], size: 0.75, isAsset: true },
  { id: 'BTC', label: 'BITCOIN', sublabel: 'High Beta · Regime Driver', color: ASSET_COLORS.BTC, position: [3.2, 1.2, 0.2], size: 0.85, isAsset: true },
  { id: 'NVDA', label: 'NVIDIA', sublabel: 'Momentum · Alpha Vector', color: ASSET_COLORS.NVDA, position: [0.2, -2.8, 0.6], size: 0.8, isAsset: true },

  // System capability nodes
  { id: 'MARKET', label: 'MARKET CONTEXT', sublabel: 'Correlation & Drift', color: '#6B6560', position: [0, 3.2, -0.4], size: 0.6 },
  { id: 'STRATEGY', label: 'STRATEGY LAB', sublabel: '4 Deterministic Engines', color: '#B40023', position: [-2.6, -1.8, -0.2], size: 0.65 },
  { id: 'RISK', label: 'STRESS & RISK', sublabel: 'CVaR & Monte Carlo', color: '#700015', position: [2.6, -1.8, -0.2], size: 0.65 },
  { id: 'REGIME', label: 'REGIMES', sublabel: 'Bull / Bear / Volatile', color: '#4A4540', position: [-2.8, 0, -1.2], size: 0.55 },
  { id: 'EVIDENCE', label: 'EVIDENCE GRAPH', sublabel: 'Immutable Audit Trail', color: '#B40023', position: [2.8, 0, -1.2], size: 0.6 },
];

function CentralCore({ isHovered, onClick }: { isHovered: boolean; onClick?: () => void }) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const outerRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.35;
      coreRef.current.rotation.x = Math.sin(t * 0.25) * 0.2;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -t * 0.2;
      outerRef.current.rotation.z = Math.cos(t * 0.15) * 0.2;
    }
  });

  return (
    <group onClick={onClick}>
      {/* Outer Crimson Wireframe Cage */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial
          color="#B40023"
          wireframe
          transparent
          opacity={isHovered ? 0.6 : 0.35}
        />
      </mesh>

      {/* Solid Inner Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#B40023"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Core BX Label */}
      <Html center pointerEvents="none">
        <div className="text-xs font-mono font-bold tracking-widest text-cream bg-crimson px-2 py-0.5 rounded border border-crimson-dark shadow-sm select-none whitespace-nowrap">
          BX CORE
        </div>
      </Html>
    </group>
  );
}

function SpokeLine({
  start,
  end,
  active,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
  color: string;
}) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);

  return (
    <Line
      points={points}
      color={active ? '#B40023' : color}
      lineWidth={active ? 2.5 : 1}
      transparent
      opacity={active ? 0.8 : 0.25}
    />
  );
}

function NodeMesh({
  node,
  isSelected,
  onClick,
}: {
  node: NodeData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
      <group position={node.position} onClick={onClick}>
        {/* Node Sphere */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[node.size, 32, 32]} />
          <meshStandardMaterial
            color={node.color}
            roughness={0.25}
            metalness={0.7}
          />
        </mesh>

        {/* Selected halo */}
        {isSelected && (
          <mesh>
            <sphereGeometry args={[node.size * 1.35, 16, 16]} />
            <meshBasicMaterial color="#B40023" wireframe transparent opacity={0.5} />
          </mesh>
        )}

        {/* Billboard Text */}
        {/* HTML Label */}
        <Html position={[0, -node.size - 0.45, 0]} center pointerEvents="none">
          <div className="flex flex-col items-center select-none pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-graphite bg-white/95 px-1.5 py-0.5 rounded border border-border shadow-xs whitespace-nowrap">
              {node.label}
            </span>
            <span className="text-[8px] font-mono text-taupe mt-0.5 whitespace-nowrap">
              {node.sublabel}
            </span>
          </div>
        </Html>
      </group>
    </Float>
  );
}

interface BxKnowledgeCoreProps {
  selectedNode?: NodeId;
  onSelectNode?: (nodeId: NodeId) => void;
  className?: string;
  height?: string | number;
}

export function BxKnowledgeCore({
  selectedNode = 'GOLD',
  onSelectNode,
  className = '',
  height = 500,
}: BxKnowledgeCoreProps) {
  const [activeNode, setActiveNode] = useState<NodeId>(selectedNode);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  const handleNodeClick = (id: NodeId) => {
    setActiveNode(id);
    if (onSelectNode) onSelectNode(id);
  };

  const selectedNodeData = useMemo(() => NODES.find((n) => n.id === activeNode), [activeNode]);

  if (hasWebGlError) {
    // Elegant 2D SVG fallback
    return (
      <div
        className={`w-full flex flex-col items-center justify-center p-8 bg-ivory-100 rounded-lg border border-border relative ${className}`}
        style={{ minHeight: height }}
      >
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center text-accent mb-3 font-display font-bold text-xl">
            BX
          </div>
          <h4 className="font-display uppercase text-lg font-bold text-graphite mb-1">
            BX Knowledge Core
          </h4>
          <p className="text-xs text-graphite-400 font-sans mb-4">
            Deterministic multi-asset quantitative graph: Gold · Bitcoin · NVIDIA interconnected with 4 strategy engines and empirical risk models.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {NODES.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNodeClick(n.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded border ${
                  activeNode === n.id
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-graphite border-border'
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
    <div className={`w-full relative select-none ${className}`} style={{ height, minHeight: height }}>
      <Canvas
        camera={{ position: [0, 0, 9.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onError={() => setHasWebGlError(true)}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 6, 6]} intensity={0.9} color="#FFF5EB" />
          <directionalLight position={[-6, -4, 4]} intensity={0.4} color="#E8E4DC" />
          <pointLight position={[0, 0, 4]} intensity={0.5} color="#FFFFFF" />

          {/* Central Hub */}
          <CentralCore isHovered={false} />

          {/* Spoke Lines from Center to all nodes */}
          {NODES.map((node) => (
            <SpokeLine
              key={`spoke-${node.id}`}
              start={[0, 0, 0]}
              end={node.position}
              active={activeNode === node.id}
              color={node.color}
            />
          ))}

          {/* Peripheral Nodes */}
          {NODES.map((node) => (
            <NodeMesh
              key={node.id}
              node={node}
              isSelected={activeNode === node.id}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Floating Active Node Telemetry Card */}
      {selectedNodeData && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-sm border border-border rounded-lg p-3.5 shadow-card transition-all duration-300">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-semibold">
              KNOWLEDGE NODE
            </span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedNodeData.color }} />
          </div>
          <div className="font-display font-bold uppercase text-base text-graphite tracking-tight">
            {selectedNodeData.label}
          </div>
          <div className="text-xs text-graphite-400 font-sans mt-0.5">
            {selectedNodeData.sublabel}
          </div>
          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-graphite-500">
            <span>STATUS</span>
            <span className="text-emerald-700 font-semibold">DETERMINISTIC READY</span>
          </div>
        </div>
      )}
    </div>
  );
}
