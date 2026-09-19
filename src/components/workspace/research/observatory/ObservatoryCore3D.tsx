import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Float, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Layers, Activity } from 'lucide-react';

interface NodeSpec {
  id: string;
  label: string;
  position: [number, number, number];
  color: string;
  description: string;
}

const NODES: NodeSpec[] = [
  { id: 'question', label: 'QUESTION', position: [0, 1.4, 0], color: '#1A1917', description: 'Empirical Inquiry' },
  { id: 'strategy', label: 'STRATEGY', position: [-1.8, 0.2, 0.5], color: '#B40023', description: 'Trend Signals' },
  { id: 'evidence', label: 'EVIDENCE', position: [1.8, 0.2, 0.5], color: '#059669', description: 'Verified Direct Data' },
  { id: 'regime', label: 'REGIME', position: [-1.1, -1.2, -0.6], color: '#D97706', description: 'State Conditioning' },
  { id: 'risk', label: 'RISK', position: [1.1, -1.2, -0.6], color: '#DC2626', description: 'Downside Stress' },
];

function Core3DScene({ onSelectNode, activeNodeId }: { onSelectNode: (id: string) => void; activeNodeId: string }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Connector Lines */}
      {NODES.map((node, i) =>
        NODES.slice(i + 1).map((target) => (
          <line key={`${node.id}-${target.id}`}>
            <bufferGeometry
              attach="geometry"
              onUpdate={(self) => {
                const points = [
                  new THREE.Vector3(...node.position),
                  new THREE.Vector3(...target.position),
                ];
                self.setFromPoints(points);
              }}
            />
            <lineBasicMaterial attach="material" color="#D4CEC4" opacity={0.4} transparent linewidth={1} />
          </line>
        ))
      )}

      {/* Domain Nodes */}
      {NODES.map((node) => {
        const isSelected = activeNodeId === node.id;
        return (
          <Float key={node.id} speed={1.2} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={node.position} onClick={() => onSelectNode(node.id)}>
              <Sphere args={[isSelected ? 0.35 : 0.25, 32, 32]}>
                <meshStandardMaterial
                  color={node.color}
                  roughness={0.2}
                  metalness={0.7}
                  emissive={node.color}
                  emissiveIntensity={isSelected ? 0.4 : 0.1}
                />
              </Sphere>
              <Html position={[0, 0.45, 0]} center pointerEvents="none">
                <span className="text-[10px] font-mono font-bold text-graphite bg-white/90 px-1.5 py-0.5 rounded border border-border shadow-xs whitespace-nowrap select-none">
                  {node.label}
                </span>
              </Html>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

export const ObservatoryCore3D: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('evidence');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const activeSpec = NODES.find(n => n.id === activeNode) || NODES[0];

  return (
    <div className="bg-white border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
      {/* 3D Canvas or Accessible 2D Fallback */}
      <div className="w-full md:w-1/2 h-64 bg-ivory-50 rounded-lg border border-border-light relative overflow-hidden flex items-center justify-center">
        {reducedMotion ? (
          <div className="p-4 text-center">
            <Layers className="w-8 h-8 text-accent mx-auto mb-2 opacity-80" />
            <span className="text-xs font-mono font-semibold text-graphite block">
              RESEARCH EVIDENCE CORE (2D MODE)
            </span>
            <span className="text-[11px] text-graphite-400 font-mono mt-1 block">
              Reduced-motion preference respected.
            </span>
          </div>
        ) : (
          <Suspense fallback={<div className="text-xs font-mono text-graphite-400">Initializing Core...</div>}>
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[10, 10, 5]} intensity={1.2} />
              <Core3DScene onSelectNode={setActiveNode} activeNodeId={activeNode} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
          </Suspense>
        )}
      </div>

      {/* Selected Domain Description */}
      <div className="w-full md:w-1/2 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeSpec.color }} />
          <span className="text-sm font-bold text-graphite tracking-wide">
            {activeSpec.label} CORE DOMAIN
          </span>
        </div>

        <p className="text-graphite-600 font-sans text-xs leading-relaxed">
          {activeSpec.description}: Interconnected quantitative relationships linking empirical observations, strategy signals, market regimes, and downside tail risk into an auditable research graph.
        </p>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {NODES.map(n => (
            <button
              key={n.id}
              onClick={() => setActiveNode(n.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                activeNode === n.id
                  ? 'bg-graphite text-white font-semibold'
                  : 'bg-ivory-100 text-graphite-500 hover:bg-ivory-200'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
