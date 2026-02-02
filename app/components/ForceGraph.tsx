'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MAIN_STEPS, STEP_CONNECTIONS } from '../data/upgradeFramework';

// Dynamic import for Next.js SSR compatibility
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-[#666]">Loading graph...</div>
    </div>
  ),
});

interface ForceGraphProps {
  selectedMainStep: string;
  selectedSubStep: string;
  expandedSteps: string[];
  onMainStepClick: (stepId: string) => void;
  onSubStepClick: (mainStepId: string, subStepId: string) => void;
  completedSteps: Set<string>;
  resetViewTrigger?: number; // Increment to trigger view reset
  zoomInTrigger?: number; // Increment to zoom in
  zoomOutTrigger?: number; // Increment to zoom out
}

interface GraphNode {
  id: string;
  type: 'main' | 'sub' | 'center';
  mainStepId?: string;
  name: string;
  color: string;
  icon: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  // For sub-nodes to track their parent
  _parentId?: string;
  [key: string]: any; // Allow additional d3 properties
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
  isMainConnection?: boolean;
}

// Icon symbols for canvas rendering (using unicode)
const ICON_SYMBOLS: Record<string, string> = {
  scan: '⊙',
  target: '◎',
  compass: '✦',
  scale: '⚖',
  rocket: '▲',
  flag: '⚑',
  'check-square': '☑',
  'help-circle': '?',
  inbox: '☰',
  workflow: '⟳',
};

const SUB_STEP_ICONS: Record<string, string> = {
  goal: 'flag',
  definition: 'check-square',
  questions: 'help-circle',
  inputs: 'inbox',
  output: 'workflow',
};

export default function ForceGraph({
  selectedMainStep,
  selectedSubStep,
  expandedSteps,
  onMainStepClick,
  onSubStepClick,
  resetViewTrigger,
  zoomInTrigger,
  zoomOutTrigger,
}: ForceGraphProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);

  // Track when d3-force module is loaded - CRITICAL for avoiding race condition
  const [d3ForceReady, setD3ForceReady] = useState(false);
  const d3ForceRef = useRef<any>(null);

  // Track when simulation has settled - hide graph until ready
  const [simulationReady, setSimulationReady] = useState(false);

  // Update dimensions on resize - use ResizeObserver to detect container size changes (e.g., panel toggle)
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    // ResizeObserver detects container size changes (panel open/close, window resize)
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate graph data based on expanded state
  // IMPORTANT: Uses graph coordinates centered at (0,0), NOT canvas pixel coordinates
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const mainRadius = 250; // Distance from center in graph units

    // Add center node at graph origin (0,0)
    nodes.push({
      id: 'center',
      type: 'center',
      name: 'UPGRADE',
      color: '#FF5C00',
      icon: 'rocket',
      fx: 0,  // Graph origin X
      fy: 0,  // Graph origin Y
    });

    // Add main step nodes in radial layout around (0,0)
    MAIN_STEPS.forEach((step) => {
      const angle = ((step.order - 1) / 5) * 2 * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * mainRadius;
      const y = Math.sin(angle) * mainRadius;

      nodes.push({
        id: step.id,
        type: 'main',
        name: step.shortName,
        color: step.color,
        icon: step.icon,
        x: x,
        y: y,
        fx: x, // PIN main nodes - they already have correct positions
        fy: y,
      });

      // Link to center
      links.push({
        source: 'center',
        target: step.id,
      });

      // Add sub-step nodes if expanded
      if (expandedSteps.includes(step.id)) {
        const subRadius = 130; // Distance from parent main node - larger for spacing
        step.subSteps.forEach((subStep, subIndex) => {
          // Position sub-nodes in a wider arc around the main node
          const subAngle = angle + ((subIndex - 2) / 2.5) * Math.PI * 0.5;
          const subX = x + Math.cos(subAngle) * subRadius;
          const subY = y + Math.sin(subAngle) * subRadius;

          nodes.push({
            id: subStep.id,
            type: 'sub',
            mainStepId: step.id,
            _parentId: step.id,
            name: subStep.title,
            color: step.color,
            icon: SUB_STEP_ICONS[subStep.type] || 'flag',
            x: subX,
            y: subY,
            fx: undefined,
            fy: undefined,
          });

          // Link sub-step to main step
          links.push({
            source: step.id,
            target: subStep.id,
          });
        });
      }
    });

    // Add connection labels between main steps
    STEP_CONNECTIONS.forEach((conn) => {
      links.push({
        source: conn.from,
        target: conn.to,
        label: conn.label,
        isMainConnection: true,
      });
    });

    return { nodes, links };
  }, [expandedSteps]); // Removed dimensions dependency - graph coords are independent

  // Load d3-force module FIRST - must complete before rendering graph
  useEffect(() => {
    import('d3-force').then((module) => {
      d3ForceRef.current = module;
      setD3ForceReady(true); // NOW we can render the graph safely
    });
  }, []);

  // Track if forces have been configured for this graph data
  const forcesConfiguredRef = useRef(false);
  // Track if this is the very first render (for initial centering only)
  const isInitialRenderRef = useRef(true);

  // Configure forces - called via onEngineStop callback when simulation is ready
  // IMPORTANT: All forces use graph coordinates centered at (0,0)
  const configureForces = useCallback((centerOnOrigin: boolean = false) => {
    if (!fgRef.current || !d3ForceRef.current) return;

    const fg = fgRef.current;
    const d3Force = d3ForceRef.current;

    // DISABLE center force - we don't want it pulling nodes together
    fg.d3Force('center', null);

    // Configure charge (repulsion) - MUCH stronger to push nodes apart
    fg.d3Force('charge', d3Force.forceManyBody().strength((node: any) => {
      if (node.type === 'center') return -1500; // Strong repulsion from center
      if (node.type === 'main') return -800;    // Main nodes repel each other
      return -300; // Sub nodes repel
    }));

    // Configure link distances - LARGER to give space
    fg.d3Force('link')?.distance((link: any) => {
      const source = typeof link.source === 'object' ? link.source : { type: 'unknown' };
      const target = typeof link.target === 'object' ? link.target : { type: 'unknown' };

      if (source.type === 'center' || target.type === 'center') {
        return 250; // center to main - larger distance
      }
      if (source.type === 'main' && target.type === 'sub') {
        return 120; // main to sub - give more space
      }
      return 300; // main to main connections
    }).strength((link: any) => {
      const source = typeof link.source === 'object' ? link.source : { type: 'unknown' };
      if (source.type === 'center') return 0.8; // Pull main nodes toward center
      return 0.3; // Weaker for other links
    });

    // Add collision detection with LARGE radii to prevent overlapping
    fg.d3Force('collision', d3Force.forceCollide()
      .radius((node: any) => {
        if (node.type === 'center') return 80;  // Center node - BIG collision radius
        if (node.type === 'main') return 90;    // Main nodes - BIG collision radius
        return 55; // Sub nodes - decent collision radius
      })
      .strength(1)      // Full strength collision
      .iterations(3)    // Multiple iterations for better resolution
    );

    // Add radial force to keep main nodes at consistent distance from center (0,0)
    fg.d3Force('radial', d3Force.forceRadial(
      (node: any) => {
        if (node.type === 'center') return 0;
        if (node.type === 'main') return 250; // Main nodes at this radius from (0,0)
        return 0; // Sub nodes not affected
      },
      0,  // Center X = graph origin
      0   // Center Y = graph origin
    ).strength((node: any) => {
      if (node.type === 'main') return 0.5; // Moderate radial pull
      return 0;
    }));

    // Mark as configured
    forcesConfiguredRef.current = true;

    // Reheat simulation with high alpha for proper settling
    fg.d3ReheatSimulation();

    // Only center on origin for initial render, NOT when user clicks nodes
    if (centerOnOrigin) {
      setTimeout(() => {
        fg.centerAt(0, 0, 500);
        fg.zoom(1, 500);
      }, 100);
    }
  }, []);

  // Handle engine stop - fires when simulation settles
  const handleEngineStop = useCallback(() => {
    if (!forcesConfiguredRef.current && d3ForceRef.current) {
      // Initial render - configure forces and center on origin
      configureForces(true);
      isInitialRenderRef.current = false;
    } else {
      // Simulation has settled - now safe to show the graph
      setSimulationReady(true);
    }
  }, [configureForces]);

  // Reconfigure forces when graph data changes (e.g., expand/collapse)
  useEffect(() => {
    if (d3ForceReady && fgRef.current && !isInitialRenderRef.current) {
      // Reset the configured flag when graph data changes
      forcesConfiguredRef.current = false;
      // Configure forces but DON'T center - preserve user's viewport position
      configureForces(false);
    }
  }, [graphData, d3ForceReady, configureForces]);

  // Custom node rendering on canvas
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const isSelected = selectedMainStep === node.id || selectedSubStep === node.id;
    const isCenter = node.type === 'center';
    const isMain = node.type === 'main';

    const radius = isCenter ? 40 : isMain ? 35 : 20;
    const x = node.x || 0;
    const y = node.y || 0;

    // Draw outer glow for selected nodes
    if (isSelected && !isCenter) {
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2);
      gradient.addColorStop(0, node.color + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius * 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw outer ring for main nodes
    if (isMain) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? node.color + '80' : '#33333380';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw main circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    if (isCenter) {
      ctx.fillStyle = '#1a1a1d';
    } else if (isSelected) {
      ctx.fillStyle = node.color + '33';
    } else {
      ctx.fillStyle = '#1a1a1d';
    }
    ctx.fill();

    ctx.strokeStyle = isSelected ? node.color : '#444';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();

    // Draw icon symbol
    const iconSymbol = ICON_SYMBOLS[node.icon] || '●';
    const fontSize = isCenter ? 24 : isMain ? 20 : 14;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? node.color : isCenter ? '#FF5C00' : '#666';
    ctx.fillText(iconSymbol, x, y);

    // Draw label below node
    const labelFontSize = isCenter ? 12 : isMain ? 11 : 9;
    ctx.font = `${isSelected ? 600 : 400} ${labelFontSize}px Inter, sans-serif`;
    ctx.fillStyle = isSelected ? node.color : '#888';
    ctx.fillText(node.name, x, y + radius + 14);

  }, [selectedMainStep, selectedSubStep]);

  // Custom link rendering
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const source = link.source;
    const target = link.target;

    // Check for undefined/null, NOT falsy (0 is a valid coordinate!)
    if (source.x == null || source.y == null || target.x == null || target.y == null) return;

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);

    if (link.isMainConnection) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1.5;
    } else if (source.type === 'center') {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
    } else if (source.type === 'main') {
      ctx.setLineDash([]);
      ctx.strokeStyle = (source.color || '#444') + '66';
      ctx.lineWidth = 2;
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw label for main connections
    if (link.label) {
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666';
      ctx.fillText(link.label, midX, midY - 8);
    }
  }, []);

  // Track previous main step to detect main step changes
  const prevMainStepRef = useRef(selectedMainStep);

  // Center on selected node when selection changes (e.g., from panel navigation)
  useEffect(() => {
    if (!simulationReady || !fgRef.current) return;

    const mainStepChanged = prevMainStepRef.current !== selectedMainStep;
    prevMainStepRef.current = selectedMainStep;

    // Longer delay when main step changes (graph needs to render new sub-nodes)
    const delay = mainStepChanged ? 400 : 150;

    const timer = setTimeout(() => {
      if (!fgRef.current) return;

      // Use graphData prop DIRECTLY (not ref method which fails)
      const targetId = selectedSubStep || selectedMainStep;
      const node = graphData.nodes.find((n: GraphNode) => n.id === targetId);

      if (node && node.x !== undefined && node.y !== undefined) {
        fgRef.current.centerAt(node.x, node.y, 600);
        fgRef.current.zoom(node.type === 'sub' ? 1.3 : 1.2, 600);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [selectedMainStep, selectedSubStep, graphData, simulationReady]);

  // Handle reset view trigger - recenter, reset zoom, rearrange nodes with smooth animation
  useEffect(() => {
    if (resetViewTrigger && resetViewTrigger > 0 && fgRef.current) {
      const mainRadius = 250;
      const subRadius = 130;
      const duration = 600; // ms
      const startTime = Date.now();

      // Calculate target positions for all nodes
      const targets = new Map<string, { x: number; y: number }>();
      const starts = new Map<string, { x: number; y: number }>();

      graphData.nodes.forEach((node: GraphNode) => {
        // Store starting positions
        starts.set(node.id, { x: node.x || 0, y: node.y || 0 });

        if (node.type === 'center') {
          targets.set(node.id, { x: 0, y: 0 });
        } else if (node.type === 'main') {
          const step = MAIN_STEPS.find(s => s.id === node.id);
          if (step) {
            const angle = ((step.order - 1) / 5) * 2 * Math.PI - Math.PI / 2;
            targets.set(node.id, {
              x: Math.cos(angle) * mainRadius,
              y: Math.sin(angle) * mainRadius
            });
          }
        } else if (node.type === 'sub' && node.mainStepId) {
          const parentStep = MAIN_STEPS.find(s => s.id === node.mainStepId);
          if (parentStep) {
            const parentAngle = ((parentStep.order - 1) / 5) * 2 * Math.PI - Math.PI / 2;
            const parentX = Math.cos(parentAngle) * mainRadius;
            const parentY = Math.sin(parentAngle) * mainRadius;
            const subIndex = parentStep.subSteps.findIndex(s => s.id === node.id);
            if (subIndex !== -1) {
              const subAngle = parentAngle + ((subIndex - 2) / 2.5) * Math.PI * 0.5;
              targets.set(node.id, {
                x: parentX + Math.cos(subAngle) * subRadius,
                y: parentY + Math.sin(subAngle) * subRadius
              });
            }
          }
        }
      });

      // Unpin nodes during animation
      graphData.nodes.forEach((node: GraphNode) => {
        node.fx = undefined;
        node.fy = undefined;
      });

      // Animate node positions
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);

        graphData.nodes.forEach((node: GraphNode) => {
          const start = starts.get(node.id);
          const target = targets.get(node.id);
          if (start && target) {
            node.x = start.x + (target.x - start.x) * eased;
            node.y = start.y + (target.y - start.y) * eased;
          }
        });

        // Force graph to re-render
        if (fgRef.current) {
          fgRef.current.d3ReheatSimulation();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete - pin nodes at final positions
          graphData.nodes.forEach((node: GraphNode) => {
            const target = targets.get(node.id);
            if (target) {
              node.x = target.x;
              node.y = target.y;
              if (node.type === 'main' || node.type === 'center') {
                node.fx = target.x;
                node.fy = target.y;
              }
            }
          });
        }
      };

      // Start animation
      requestAnimationFrame(animate);

      // Animate viewport in parallel
      fgRef.current.centerAt(0, 0, duration);
      fgRef.current.zoom(1, duration);
    }
  }, [resetViewTrigger, graphData]);

  // Handle zoom in trigger
  useEffect(() => {
    if (zoomInTrigger && zoomInTrigger > 0 && fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.3, 300); // Zoom in by 30%
    }
  }, [zoomInTrigger]);

  // Handle zoom out trigger
  useEffect(() => {
    if (zoomOutTrigger && zoomOutTrigger > 0 && fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.3, 300); // Zoom out by 30%
    }
  }, [zoomOutTrigger]);

  // Handle node click - center viewport on clicked node with animation
  const handleNodeClick = useCallback((node: any) => {
    // Animate viewport to center on the clicked node
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 600); // 600ms animation

      // Zoom in slightly when selecting a node
      if (node.type === 'main') {
        fgRef.current.zoom(1.2, 600);
      } else if (node.type === 'sub') {
        fgRef.current.zoom(1.3, 600);
      } else if (node.type === 'center') {
        // Reset zoom when clicking center
        fgRef.current.zoom(1, 600);
      }
    }

    // Trigger the appropriate callback
    if (node.type === 'main') {
      onMainStepClick(node.id);
    } else if (node.type === 'sub' && node.mainStepId) {
      onSubStepClick(node.mainStepId, node.id);
    }
  }, [onMainStepClick, onSubStepClick]);

  // Handle node drag - move children with parent
  const handleNodeDrag = useCallback((node: any) => {
    if (node.type === 'main') {
      // Calculate delta from last position
      if (lastDragPos.current) {
        const deltaX = node.x - lastDragPos.current.x;
        const deltaY = node.y - lastDragPos.current.y;

        // Find all children of this node and move them too (use graphData prop)
        graphData.nodes.forEach((n: GraphNode) => {
          if (n._parentId === node.id || n.mainStepId === node.id) {
            n.x = (n.x || 0) + deltaX;
            n.y = (n.y || 0) + deltaY;
            n.fx = n.x;
            n.fy = n.y;
          }
        });
      }

      // Store current position for next delta calculation
      lastDragPos.current = { x: node.x, y: node.y };
    }

    // Fix dragged node position
    node.fx = node.x;
    node.fy = node.y;
  }, [graphData]);

  // Handle drag end
  const handleNodeDragEnd = useCallback((node: any) => {
    lastDragPos.current = null;

    // Release fixed position for force simulation (except center)
    if (node.type !== 'center') {
      node.fx = undefined;
      node.fy = undefined;
    }

    // Release children positions too (use graphData prop)
    graphData.nodes.forEach((n: GraphNode) => {
      if (n._parentId === node.id || n.mainStepId === node.id) {
        n.fx = undefined;
        n.fy = undefined;
      }
    });
  }, [graphData]);

  // Pointer area for better hover detection
  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const radius = node.type === 'center' ? 40 : node.type === 'main' ? 35 : 20;
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, radius + 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // Link particles
  const linkDirectionalParticles = useCallback((link: any) => {
    if (link.isMainConnection) return 0;
    if (link.source?.type === 'center' || link.source === 'center') return 2;
    return 1;
  }, []);

  const linkDirectionalParticleColor = useCallback((link: any) => {
    if (link.source?.type === 'center') return '#FF5C00';
    return link.source?.color || '#666';
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Loading overlay - shown until simulation settles */}
      {!simulationReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0b]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
            <div className="text-[#666]">Loading graph...</div>
          </div>
        </div>
      )}

      {/* Graph - renders in background while loading, visible once ready */}
      {d3ForceReady && (
        <div style={{ opacity: simulationReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeId="id"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkCanvasObject={linkCanvasObject}
            linkDirectionalParticles={linkDirectionalParticles}
            linkDirectionalParticleWidth={3}
            linkDirectionalParticleColor={linkDirectionalParticleColor}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onEngineStop={handleEngineStop}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            cooldownTime={3000}
            warmupTicks={0}  // CRITICAL: No warmup with default forces!
            backgroundColor="#0a0a0b"
          />
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute bottom-20 left-4 text-xs text-[#555] pointer-events-none">
        <p>Drag canvas to pan • Drag nodes to move • Scroll to zoom</p>
      </div>
    </div>
  );
}
