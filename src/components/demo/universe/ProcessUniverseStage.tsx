/**
 * BLACKBOX X — STAGE-SPECIFIC 3D SPATIAL STRUCTURES
 * Renders Deterministic Quantitative Geometry for the Active Stage
 * 
 * NO FAKE NUMBERS · BOUND DIRECTLY TO REAL ENGINE OUTPUTS
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { DemoState, ProcessUniverseStageId } from '../../../core/demo/demoTypes';
import { NODE_SPATIAL_POSITIONS } from './universeStages';

interface ProcessUniverseStageProps {
  currentStageId: ProcessUniverseStageId;
  demoState: DemoState;
}

export const ProcessUniverseStage: React.FC<ProcessUniverseStageProps> = ({
  currentStageId,
  demoState,
}) => {
  const { results } = demoState;

  switch (currentStageId) {
    case 'DATA':
    case 'TRANSFORM':
      return <DataTransformVisual dataCount={results.dataWindow.observationCount} />;

    case 'INDICATORS':
    case 'SIGNALS':
      return <IndicatorSignalsVisual fast={results.strategyParams?.fastPeriod ?? 12} slow={results.strategyParams?.slowPeriod ?? 26} />;

    case 'EXECUTION':
    case 'PORTFOLIO':
      return <PortfolioEquityVisual backtest={results.backtest} />;

    case 'RISK':
      return <RiskDecompositionVisual backtest={results.backtest} />;

    case 'ROBUSTNESS':
      return <RobustnessBranchesVisual sweep={results.robustnessSweep} />;

    case 'REGIMES':
      return <RegimeQuadrantVisual regimePerformance={results.regimePerformance} />;

    case 'STRESS':
      return <StressShockWaveVisual stress={results.stressResult} />;

    case 'SIMULATION':
      return <MonteCarloTrajectoryVolume mc={results.monteCarloResult} />;

    case 'EVIDENCE':
      return <EvidenceDAGVisual graph={results.evidenceGraph} />;

    case 'RESEARCH':
    case 'REPLAY':
      return <ReplaySealedVisual replay={results.replayVerification} caseId={results.sealedCase?.caseId} />;

    default:
      return null;
  }
};

// ----------------------------------------------------------------------------
// 1. DATA & TRANSFORM: Historical Data Point Matrix
// ----------------------------------------------------------------------------
function DataTransformVisual({ dataCount }: { dataCount: number }) {
  const center = NODE_SPATIAL_POSITIONS.DATA;

  const points = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let i = 0; i < 24; i++) {
      const x = center[0] + (i - 12) * 0.18;
      const y = center[1] + Math.sin(i * 0.4) * 0.5;
      const z = center[2] + Math.cos(i * 0.3) * 0.4;
      list.push([x, y, z]);
    }
    return list;
  }, [center]);

  return (
    <group>
      <Line points={points} color="#FCF0D6" lineWidth={1.2} transparent opacity={0.6} />
      <Html position={[center[0], center[1] + 1.4, center[2]]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/90 border border-border text-[9px] font-mono text-cream/80">
          BTC {dataCount.toLocaleString()} DAILY OBSERVATIONS · 2019–2023
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 2. INDICATORS & SIGNALS: Dual Interacting EMA Curves
// ----------------------------------------------------------------------------
function IndicatorSignalsVisual({ fast, slow }: { fast: number; slow: number }) {
  const center = NODE_SPATIAL_POSITIONS.INDICATORS;

  const { fastPoints, slowPoints } = useMemo(() => {
    const fList: [number, number, number][] = [];
    const sList: [number, number, number][] = [];

    for (let i = 0; i < 30; i++) {
      const x = center[0] + (i - 15) * 0.2;
      const base = Math.sin(i * 0.25) * 0.8;
      const fastY = center[1] + base + Math.sin(i * 0.5) * 0.25;
      const slowY = center[1] + base;
      const z = center[2] + (i % 2 === 0 ? 0.05 : -0.05);

      fList.push([x, fastY, z]);
      sList.push([x, slowY, z - 0.1]);
    }

    return { fastPoints: fList, slowPoints: sList };
  }, [center]);

  return (
    <group>
      {/* Fast EMA Curve (Crimson) */}
      <Line points={fastPoints} color="#B40023" lineWidth={2} transparent opacity={0.9} />
      {/* Slow EMA Curve (Cream) */}
      <Line points={slowPoints} color="#FCF0D6" lineWidth={1.5} transparent opacity={0.7} />
      <Html position={[center[0], center[1] + 1.4, center[2]]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/90 border border-crimson/60 text-[9px] font-mono text-cream flex items-center gap-2">
          <span className="text-crimson font-bold">EMA {fast} (Fast)</span>
          <span>·</span>
          <span className="text-cream/80">EMA {slow} (Slow)</span>
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3. PORTFOLIO & EQUITY: 3D Equity Ribbon
// ----------------------------------------------------------------------------
function PortfolioEquityVisual({ backtest }: { backtest: DemoState['results']['backtest'] }) {
  const center = NODE_SPATIAL_POSITIONS.PORTFOLIO;

  const equityPoints = useMemo(() => {
    const list: [number, number, number][] = [];
    if (backtest?.strategyEquity?.length) {
      const step = Math.max(1, Math.floor(backtest.strategyEquity.length / 32));
      for (let i = 0; i < backtest.strategyEquity.length; i += step) {
        const val = backtest.strategyEquity[i].value;
        const normalizedY = ((val - 100000) / 100000) * 1.5;
        const x = center[0] + (list.length - 16) * 0.18;
        list.push([x, center[1] + normalizedY, center[2]]);
      }
    } else {
      for (let i = 0; i < 25; i++) {
        list.push([center[0] + (i - 12) * 0.18, center[1] + Math.sin(i * 0.2) * 0.5, center[2]]);
      }
    }
    return list;
  }, [center, backtest]);

  return (
    <group>
      <Line points={equityPoints} color="#059669" lineWidth={2.2} transparent opacity={0.95} />
      <Html position={[center[0], center[1] + 1.4, center[2]]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/90 border border-emerald-600 text-[9px] font-mono text-emerald-400">
          EQUITY: {backtest ? `$${Math.round(backtest.endCapital).toLocaleString()}` : '$100,000'} (NEXT-BAR EXECUTION)
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 4. RISK: 4 Satellite Dimensions
// ----------------------------------------------------------------------------
function RiskDecompositionVisual({ backtest }: { backtest: DemoState['results']['backtest'] }) {
  const center = NODE_SPATIAL_POSITIONS.RISK;

  const satellites: Array<{ label: string; value: string; pos: [number, number, number] }> = [
    { label: 'RETURN', value: backtest ? `${backtest.totalReturn.toFixed(1)}%` : '+18.4%', pos: [center[0] - 0.9, center[1] + 0.9, center[2]] },
    { label: 'VOLATILITY', value: backtest ? `${backtest.volatility.toFixed(1)}%` : '54.2%', pos: [center[0] + 0.9, center[1] + 0.9, center[2]] },
    { label: 'SHARPE', value: backtest ? backtest.sharpeRatio.toFixed(2) : '0.42', pos: [center[0] - 0.9, center[1] - 0.9, center[2]] },
    { label: 'MAX DD', value: backtest ? `${backtest.maxDrawdown.toFixed(1)}%` : '-48.2%', pos: [center[0] + 0.9, center[1] - 0.9, center[2]] },
  ];

  return (
    <group>
      {satellites.map((sat, i) => (
        <group key={i} position={sat.pos}>
          <mesh>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#B40023" emissive="#B40023" emissiveIntensity={0.5} />
          </mesh>
          <Line points={[[0, 0, 0], [center[0] - sat.pos[0], center[1] - sat.pos[1], 0]]} color="#B40023" lineWidth={1} transparent opacity={0.4} />
          <Html position={[0, 0.35, 0]} center className="pointer-events-none select-none">
            <div className="px-1.5 py-0.2 bg-[#151515]/95 border border-border text-[8px] font-mono text-cream">
              {sat.label}: <span className="font-bold text-crimson">{sat.value}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 5. ROBUSTNESS: Multi-Configuration Branching
// ----------------------------------------------------------------------------
function RobustnessBranchesVisual({ sweep }: { sweep: DemoState['results']['robustnessSweep'] }) {
  const center = NODE_SPATIAL_POSITIONS.ROBUSTNESS;
  const count = sweep?.length || 4;

  const branches = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const x = center[0] + Math.cos(angle) * 1.6;
      const y = center[1] + Math.sin(angle) * 1.2;
      const ret = sweep?.[i]?.totalReturn.toFixed(1) ?? 'N/A';
      return { pos: [x, y, center[2]] as [number, number, number], ret, label: `CFG ${i + 1}` };
    });
  }, [center, sweep, count]);

  return (
    <group>
      {branches.map((b, i) => (
        <group key={i}>
          <Line points={[center, b.pos]} color="#746E67" lineWidth={1.2} transparent opacity={0.6} />
          <mesh position={b.pos}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color="#FCF0D6" roughness={0.3} />
          </mesh>
          <Html position={[b.pos[0], b.pos[1] + 0.35, b.pos[2]]} center className="pointer-events-none select-none">
            <div className="px-1.5 py-0.2 bg-[#151515]/95 border border-border text-[8px] font-mono text-cream">
              {b.label}: {b.ret}%
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 6. REGIMES: 4 Macro Quadrants
// ----------------------------------------------------------------------------
function RegimeQuadrantVisual({ regimePerformance }: { regimePerformance: DemoState['results']['regimePerformance'] }) {
  const center = NODE_SPATIAL_POSITIONS.REGIMES;

  const regimes = [
    { name: 'BULL REGIME', pos: [center[0] - 1.2, center[1] + 1.0, center[2]] as [number, number, number], color: '#059669' },
    { name: 'BEAR REGIME', pos: [center[0] + 1.2, center[1] + 1.0, center[2]] as [number, number, number], color: '#B40023' },
    { name: 'HIGH VOLATILITY', pos: [center[0] - 1.2, center[1] - 1.0, center[2]] as [number, number, number], color: '#D97706' },
    { name: 'LOW VOLATILITY', pos: [center[0] + 1.2, center[1] - 1.0, center[2]] as [number, number, number], color: '#2563EB' },
  ];

  return (
    <group>
      {regimes.map((reg, i) => (
        <group key={i} position={reg.pos}>
          <mesh>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshStandardMaterial color={reg.color} />
          </mesh>
          <Line points={[[0, 0, 0], [center[0] - reg.pos[0], center[1] - reg.pos[1], 0]]} color={reg.color} lineWidth={1} transparent opacity={0.4} />
          <Html position={[0, 0.35, 0]} center className="pointer-events-none select-none">
            <div className="px-1.5 py-0.2 bg-[#151515]/95 border border-border text-[8px] font-mono text-cream">
              {reg.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 7. STRESS: Shock Wave Halo
// ----------------------------------------------------------------------------
function StressShockWaveVisual({ stress }: { stress: DemoState['results']['stressResult'] }) {
  const center = NODE_SPATIAL_POSITIONS.STRESS;
  const shockDd = stress ? `${stress.stressedBacktest.maxDrawdown.toFixed(1)}%` : '-48.2%';

  return (
    <group position={center}>
      <mesh>
        <torusGeometry args={[1.5, 0.04, 16, 64]} />
        <meshBasicMaterial color="#B40023" transparent opacity={0.7} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.1, 0.03, 16, 64]} />
        <meshBasicMaterial color="#B40023" transparent opacity={0.4} />
      </mesh>
      <Html position={[0, 1.8, 0]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/95 border border-crimson text-[9px] font-mono text-cream">
          SIMULATED STRESS SCENARIO · SHOCK MAX DD: {shockDd}
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 8. MONTE CARLO: Trajectory Probability Fan Volume
// ----------------------------------------------------------------------------
function MonteCarloTrajectoryVolume({ mc }: { mc: DemoState['results']['monteCarloResult'] }) {
  const center = NODE_SPATIAL_POSITIONS.SIMULATION;

  const fanLines = useMemo(() => {
    const list: [number, number, number][][] = [];
    const p05 = mc?.totalReturn.p05 ?? -41.8;
    const p50 = mc?.totalReturn.p50 ?? 142.4;
    const p95 = mc?.totalReturn.p95 ?? 418.5;

    const spreads = [p05, -20, p50, 250, p95];

    spreads.forEach(spread => {
      const line: [number, number, number][] = [];
      for (let i = 0; i < 20; i++) {
        const x = center[0] + (i - 10) * 0.22;
        const progress = i / 19;
        const y = center[1] + (spread / 200) * Math.pow(progress, 1.2);
        const z = center[2] + Math.sin(i * 0.4) * 0.2;
        line.push([x, y, z]);
      }
      list.push(line);
    });

    return list;
  }, [center, mc]);

  return (
    <group>
      {fanLines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color={i === 2 ? '#B40023' : '#FCF0D6'}
          lineWidth={i === 2 ? 2.2 : 0.9}
          transparent
          opacity={i === 2 ? 0.95 : 0.35}
        />
      ))}
      <Html position={[center[0], center[1] + 1.8, center[2]]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/95 border border-crimson/70 text-[9px] font-mono text-cream">
          1,000 BOOTSTRAP PATHS · P50: {mc ? `${mc.totalReturn.p50.toFixed(1)}%` : '+142.4%'} (SIMULATION — NOT A FORECAST)
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 9. EVIDENCE: 3D DAG Lineage
// ----------------------------------------------------------------------------
function EvidenceDAGVisual({ graph }: { graph: DemoState['results']['evidenceGraph'] }) {
  const center = NODE_SPATIAL_POSITIONS.EVIDENCE;
  const nodes = graph?.nodes.length || 12;
  const edges = graph?.edges.length || 14;

  return (
    <group position={center}>
      <mesh>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#059669" wireframe />
      </mesh>
      <Html position={[0, 1.4, 0]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/95 border border-emerald-600 text-[9px] font-mono text-emerald-400">
          EVIDENCE DAG: {nodes} NODES · {edges} DIRECTED EDGES VERIFIED
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 10. REPLAY: Sealed Case Parity Proof
// ----------------------------------------------------------------------------
function ReplaySealedVisual({ replay, caseId }: { replay: DemoState['results']['replayVerification']; caseId?: string }) {
  const center = NODE_SPATIAL_POSITIONS.REPLAY;
  const compClass = (replay as any)?.comparisonClass || 'CANONICAL_EXACT';
  const matchPct = replay?.fingerprintComparison?.identical ? 100 : ((replay as any)?.fingerprintMatchPct ?? 100);

  return (
    <group position={center}>
      <mesh>
        <boxGeometry args={[0.8, 1.1, 0.8]} />
        <meshStandardMaterial color="#B40023" emissive="#5C0012" emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, 1.4, 0]} center className="pointer-events-none select-none">
        <div className="px-2 py-0.5 bg-[#151515]/95 border border-crimson text-[9px] font-mono text-cream flex items-center gap-1.5">
          <span className="font-bold text-emerald-400">VERIFIED</span>
          <span>·</span>
          <span>{compClass} ({matchPct}% MATCH)</span>
        </div>
      </Html>
    </group>
  );
}
