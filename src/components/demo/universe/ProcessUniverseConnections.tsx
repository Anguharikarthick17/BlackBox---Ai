/**
 * BLACKBOX X — 3D PROCESS UNIVERSE CONNECTIONS
 * Linear & Topological Vector Lines Between Computational Nodes
 * 
 * NO FAKE NUMBERS · VISUALIZES ACTUAL DEPENDENCY CHAINS
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { UNIVERSE_STAGES, NODE_SPATIAL_POSITIONS } from './universeStages';
import { ProcessUniverseStageId } from '../../../core/demo/demoTypes';

interface ProcessUniverseConnectionsProps {
  currentStageId: ProcessUniverseStageId;
  completedStageIds: Set<ProcessUniverseStageId>;
}

export const ProcessUniverseConnections: React.FC<ProcessUniverseConnectionsProps> = ({
  currentStageId,
  completedStageIds,
}) => {
  // Compute pair-wise pipeline vectors along the sequence
  const segments = useMemo(() => {
    const list: Array<{
      fromId: ProcessUniverseStageId;
      toId: ProcessUniverseStageId;
      points: [number, number, number][];
      status: 'WAITING' | 'ACTIVE' | 'COMPLETE';
    }> = [];

    for (let i = 0; i < UNIVERSE_STAGES.length - 1; i++) {
      const from = UNIVERSE_STAGES[i];
      const to = UNIVERSE_STAGES[i + 1];

      const p1 = NODE_SPATIAL_POSITIONS[from.id];
      const p2 = NODE_SPATIAL_POSITIONS[to.id];

      const isComplete = completedStageIds.has(to.id);
      const isActive = currentStageId === from.id || currentStageId === to.id;

      list.push({
        fromId: from.id,
        toId: to.id,
        points: [p1, p2],
        status: isActive ? 'ACTIVE' : isComplete ? 'COMPLETE' : 'WAITING',
      });
    }

    return list;
  }, [currentStageId, completedStageIds]);

  return (
    <group>
      {segments.map((seg, idx) => {
        const isComplete = seg.status === 'COMPLETE';
        const isActive = seg.status === 'ACTIVE';

        const color = isActive
          ? '#B40023' // Crimson
          : isComplete
          ? '#059669' // Emerald
          : '#333333'; // Muted Graphite

        const lineWidth = isActive ? 2.2 : isComplete ? 1.4 : 0.8;

        return (
          <Line
            key={`${seg.fromId}-${seg.toId}-${idx}`}
            points={seg.points}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={isActive ? 0.95 : isComplete ? 0.7 : 0.25}
          />
        );
      })}
    </group>
  );
};
