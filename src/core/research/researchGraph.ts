/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Evidence Graph (DAG) Engine & Topology Verification
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import {
  EvidenceGraph,
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  ResearchHypothesis,
  ExperimentNode,
  EvidenceRecord,
  ContradictionRecord,
  SecondaryTestRecord,
  ResearchSynthesis,
} from './researchTypes';

export function createEmptyGraph(): EvidenceGraph {
  return {
    nodes: [],
    edges: [],
  };
}

export function addGraphNode(
  graph: EvidenceGraph,
  node: GraphNode
): EvidenceGraph {
  if (graph.nodes.some(n => n.id === node.id)) {
    return graph;
  }
  return {
    ...graph,
    nodes: [...graph.nodes, node],
  };
}

export function addGraphEdge(
  graph: EvidenceGraph,
  edge: GraphEdge
): EvidenceGraph {
  if (graph.edges.some(e => e.id === edge.id)) {
    return graph;
  }
  const hasSource = graph.nodes.some(n => n.id === edge.source);
  const hasTarget = graph.nodes.some(n => n.id === edge.target);
  if (!hasSource || !hasTarget) {
    return graph; // Avoid dangling edges
  }
  return {
    ...graph,
    edges: [...graph.edges, edge],
  };
}

/**
 * Validates acyclicity of the evidence graph.
 * Uses Kahn's algorithm (topological sort via in-degrees).
 * Returns true if acyclic, throws error if cycles detected.
 */
export function validateGraphAcyclicity(graph: EvidenceGraph): boolean {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const node of graph.nodes) {
    inDegree[node.id] = 0;
    adj[node.id] = [];
  }

  for (const edge of graph.edges) {
    if (inDegree[edge.target] !== undefined) {
      inDegree[edge.target]++;
    } else {
      inDegree[edge.target] = 1;
    }
    if (!adj[edge.source]) {
      adj[edge.source] = [];
    }
    adj[edge.source].push(edge.target);
  }

  const queue: string[] = [];
  for (const nodeId of Object.keys(inDegree)) {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    visitedCount++;

    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  const totalNodes = Object.keys(inDegree).length;
  if (visitedCount < totalNodes) {
    throw new Error('EVIDENCE_GRAPH_CYCLICITY_ERROR: A cycle was detected in the evidence graph.');
  }

  return true;
}

/**
 * Assembles a complete evidence graph from session artifacts.
 */
export function buildEvidenceGraph(params: {
  question: string;
  hypotheses: ResearchHypothesis[];
  experiments: ExperimentNode[];
  evidence: EvidenceRecord[];
  contradictions: ContradictionRecord[];
  secondaryTests: SecondaryTestRecord[];
  synthesis?: ResearchSynthesis;
}): EvidenceGraph {
  let graph = createEmptyGraph();

  // 1. Question Node
  const questionId = 'NODE-Q';
  graph = addGraphNode(graph, {
    id: questionId,
    type: 'QUESTION',
    label: 'Research Inquiry',
    data: { question: params.question },
  });

  // 2. Hypothesis Nodes & Edges
  for (const hyp of params.hypotheses) {
    const hNodeId = `NODE-${hyp.hypothesisId}`;
    graph = addGraphNode(graph, {
      id: hNodeId,
      type: 'HYPOTHESIS',
      label: `${hyp.hypothesisId}: ${hyp.statement.slice(0, 40)}...`,
      data: { ...hyp },
    });
    graph = addGraphEdge(graph, {
      id: `EDGE-Q-${hyp.hypothesisId}`,
      source: questionId,
      target: hNodeId,
      type: 'DERIVED_FROM',
    });
  }

  // 3. Experiment Nodes & Edges
  for (const exp of params.experiments) {
    const expNodeId = `NODE-${exp.experimentId}`;
    graph = addGraphNode(graph, {
      id: expNodeId,
      type: 'EXPERIMENT',
      label: `${exp.experimentId}: ${exp.toolName}`,
      data: { ...exp },
    });

    // Link dependencies between experiments
    for (const depId of exp.dependencies) {
      graph = addGraphEdge(graph, {
        id: `EDGE-EXP-DEP-${depId}-${exp.experimentId}`,
        source: `NODE-${depId}`,
        target: expNodeId,
        type: 'DEPENDS_ON',
      });
    }
  }

  // Link hypotheses to their experiments
  for (const hyp of params.hypotheses) {
    for (const tId of hyp.testIds) {
      if (params.experiments.some(e => e.experimentId === tId)) {
        graph = addGraphEdge(graph, {
          id: `EDGE-TEST-${hyp.hypothesisId}-${tId}`,
          source: `NODE-${hyp.hypothesisId}`,
          target: `NODE-${tId}`,
          type: 'TESTS',
        });
      }
    }
  }

  // 4. Evidence Nodes & Edges
  for (const ev of params.evidence) {
    const evNodeId = `NODE-${ev.evidenceId}`;
    graph = addGraphNode(graph, {
      id: evNodeId,
      type: 'EVIDENCE',
      label: `${ev.evidenceId}: ${ev.toolName}`,
      data: { ...ev },
    });
    const expNodeId = `NODE-${ev.experimentId}`;
    if (!graph.nodes.some(n => n.id === expNodeId)) {
      graph = addGraphNode(graph, {
        id: expNodeId,
        type: 'EXPERIMENT',
        label: `${ev.experimentId}: ${ev.toolName}`,
        data: { experimentId: ev.experimentId, toolName: ev.toolName },
      });
    }

    // Link from Experiment to Evidence
    graph = addGraphEdge(graph, {
      id: `EDGE-EXP-EV-${ev.experimentId}-${ev.evidenceId}`,
      source: expNodeId,
      target: evNodeId,
      type: 'DERIVED_FROM',
    });
  }

  // 5. Contradiction Nodes & Edges
  for (const c of params.contradictions) {
    const cNodeId = `NODE-${c.contradictionId}`;
    graph = addGraphNode(graph, {
      id: cNodeId,
      type: 'CONTRADICTION',
      label: `${c.contradictionId}: Tension on ${c.hypothesisId}`,
      data: { ...c },
    });

    for (const disEvId of c.disconfirmingEvidenceIds) {
      if (params.evidence.some(e => e.evidenceId === disEvId)) {
        graph = addGraphEdge(graph, {
          id: `EDGE-CONTRADICT-${disEvId}-${c.contradictionId}`,
          source: `NODE-${disEvId}`,
          target: cNodeId,
          type: 'CONTRADICTS',
        });
      }
    }
  }

  // 6. Secondary Test Nodes & Edges
  for (const st of params.secondaryTests) {
    const stNodeId = `NODE-${st.testId}`;
    graph = addGraphNode(graph, {
      id: stNodeId,
      type: 'SECONDARY_TEST',
      label: `${st.testId}: Sweep ${st.parameterName}`,
      data: { ...st },
    });

    if (st.contradictionId && params.contradictions.some(c => c.contradictionId === st.contradictionId)) {
      graph = addGraphEdge(graph, {
        id: `EDGE-REFINES-${st.contradictionId}-${st.testId}`,
        source: `NODE-${st.contradictionId}`,
        target: stNodeId,
        type: 'REFINES',
      });
    }

    for (const evId of st.evidenceIds) {
      if (params.evidence.some(e => e.evidenceId === evId)) {
        graph = addGraphEdge(graph, {
          id: `EDGE-SEC-EV-${st.testId}-${evId}`,
          source: stNodeId,
          target: `NODE-${evId}`,
          type: 'DERIVED_FROM',
        });
      }
    }
  }

  // 7. Synthesis Node
  if (params.synthesis) {
    const synNodeId = 'NODE-SYNTHESIS';
    graph = addGraphNode(graph, {
      id: synNodeId,
      type: 'SYNTHESIS',
      label: 'Research Synthesis',
      data: { ...params.synthesis },
    });

    // Link evidence to synthesis
    for (const ev of params.evidence) {
      graph = addGraphEdge(graph, {
        id: `EDGE-SYNTH-${ev.evidenceId}`,
        source: `NODE-${ev.evidenceId}`,
        target: synNodeId,
        type: 'SUPPORTS',
      });
    }

    // Link contradictions to synthesis
    for (const c of params.contradictions) {
      graph = addGraphEdge(graph, {
        id: `EDGE-SYNTH-${c.contradictionId}`,
        source: `NODE-${c.contradictionId}`,
        target: synNodeId,
        type: 'CONTRADICTS',
      });
    }
  }

  return graph;
}
