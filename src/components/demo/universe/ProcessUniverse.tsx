/**
 * BLACKBOX X — 3D PROCESS UNIVERSE ROOT COMPONENT
 * Primary Jury Experience: 3D Spatial Computation Universe with HUD & Fallback
 * 
 * NO FAKE NUMBERS · BOUND DIRECTLY TO REAL DEMO ORCHESTRATOR OUTPUTS
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { Suspense, Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { DemoState } from '../../../core/demo/demoTypes';
import { DemoOrchestrator } from '../../../core/demo/demoOrchestrator';
import { mapDemoStageToUniverseStage } from './universeStages';
import { ProcessUniverseScene } from './ProcessUniverseScene';
import { ProcessUniverseHUD } from './ProcessUniverseHUD';
import { DataFlowPipeline } from '../DataFlowPipeline';

interface ProcessUniverseProps {
  demoState: DemoState;
  orchestrator: DemoOrchestrator;
  onOpenDataInspector: () => void;
  onClose: () => void;
  onEnterResearch?: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Resilient WebGL Error Boundary to prevent crashes in constrained headless or software-rendering environments
class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ProcessUniverse] WebGL rendering encountered an error, falling back to 2D pipeline:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const ProcessUniverse: React.FC<ProcessUniverseProps> = ({
  demoState,
  orchestrator,
  onOpenDataInspector,
  onClose,
  onEnterResearch,
}) => {
  const [isWebGLAvailable, setIsWebGLAvailable] = useState<boolean>(true);

  // Check WebGL availability on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setIsWebGLAvailable(false);
      }
    } catch {
      setIsWebGLAvailable(false);
    }
  }, []);

  const activeStageId = mapDemoStageToUniverseStage(demoState.currentStage);

  // Graceful fallback to System 2D pipeline if WebGL is unavailable
  const fallback2D = (
    <div className="relative w-full h-full p-4 bg-[#F9F7F2] overflow-auto">
      <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 p-3 font-mono text-xs text-amber-900">
        <span>WebGL hardware acceleration disabled or unsupported. Displaying 2D System Data Flow Pipeline.</span>
        <button
          type="button"
          onClick={() => orchestrator.setViewMode('RESEARCH_VIEW')}
          className="px-2 py-1 bg-amber-900 text-cream uppercase font-bold"
        >
          Switch to Research View
        </button>
      </div>
      <DataFlowPipeline
        demoState={demoState}
        onOpenDataInspector={onOpenDataInspector}
      />
    </div>
  );

  if (!isWebGLAvailable) {
    return fallback2D;
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#0B0B0C] overflow-hidden select-none">
      <WebGLErrorBoundary fallback={fallback2D}>
        {/* The 3D Canvas */}
        <Canvas
          camera={{ position: [-12, 6, 16], fov: 42, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <ProcessUniverseScene
              demoState={demoState}
              orchestrator={orchestrator}
              activeStageId={activeStageId}
            />
          </Suspense>
        </Canvas>

        {/* Floating Heads-Up Display (HUD) */}
        <ProcessUniverseHUD
          demoState={demoState}
          orchestrator={orchestrator}
          onOpenDataInspector={onOpenDataInspector}
          onClose={onClose}
          onEnterResearch={onEnterResearch}
        />
      </WebGLErrorBoundary>
    </div>
  );
};
