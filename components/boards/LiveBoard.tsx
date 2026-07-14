/**
 * LiveBoard — Visual board panel that renders live session state as nodes.
 *
 * Three themes: circuit (green grid), aqueduct (stone/water), chipper (amber grid).
 * Same data, three visual languages.
 *
 * In workspace mode, also shows completed operation nodes (Evaluate → score).
 *
 * SoC: reads from ceremony store and renders. Zero business logic.
 * Nodes: Work Type, Domain, Maker, Stage, Work text excerpt, Operations.
 */
'use client';
import { useEffect, useRef } from 'react';
import { useCeremonyStore } from '@/store/ceremony';

export type BoardTheme = 'circuit' | 'aqueduct' | 'chipper';

interface Props {
  theme: BoardTheme;
}

const THEMES = {
  circuit: {
    bg: '#0a1f0a',
    gridColor: 'rgba(0,255,65,0.04)',
    nodeStroke: 'rgba(0,255,65,0.55)',
    nodeText: 'rgba(0,255,65,0.85)',
    roleText: 'rgba(0,255,65,0.5)',
    edgeColor: 'rgba(0,255,65,0.25)',
    emptyText: 'rgba(0,255,65,0.2)',
    opNodeStroke: 'rgba(79,142,245,0.55)',
    opNodeText: 'rgba(79,142,245,0.85)',
    opRoleText: 'rgba(79,142,245,0.5)',
  },
  aqueduct: {
    bg: '#1a1510',
    gridColor: 'rgba(139,115,85,0.04)',
    nodeStroke: 'rgba(74,144,217,0.5)',
    nodeText: 'rgba(74,144,217,0.9)',
    roleText: 'rgba(200,180,140,0.6)',
    edgeColor: 'rgba(74,144,217,0.2)',
    emptyText: 'rgba(139,115,85,0.3)',
    opNodeStroke: 'rgba(76,175,128,0.55)',
    opNodeText: 'rgba(76,175,128,0.85)',
    opRoleText: 'rgba(76,175,128,0.5)',
  },
  chipper: {
    bg: '#111',
    gridColor: 'rgba(255,140,0,0.025)',
    nodeStroke: 'rgba(255,140,0,0.5)',
    nodeText: 'rgba(255,140,0,0.9)',
    roleText: 'rgba(255,140,0,0.5)',
    edgeColor: 'rgba(255,140,0,0.2)',
    emptyText: 'rgba(255,140,0,0.15)',
    opNodeStroke: 'rgba(79,142,245,0.55)',
    opNodeText: 'rgba(79,142,245,0.85)',
    opRoleText: 'rgba(79,142,245,0.5)',
  },
};

interface Node { id: string; label: string; role: string; x: number; y: number; isOp?: boolean; }

function buildNodes(store: ReturnType<typeof useCeremonyStore.getState>): Node[] {
  const nodes: Node[] = [];
  if (store.workClassification?.workType.value && store.workClassification.workType.value !== 'unknown') {
    nodes.push({ id: 'wt', role: 'Work Type', label: store.workClassification.workType.value.replace(/-/g, ' '), x: 20, y: 20 });
  }
  if (store.judgeIdentity?.domain.value) {
    nodes.push({ id: 'dm', role: 'Domain', label: store.judgeIdentity.domain.value, x: 160, y: 15 });
  }
  if (store.makerDeclaration?.standing.value && store.makerDeclaration.standing.value !== 'unknown') {
    nodes.push({ id: 'mk', role: 'Maker', label: store.makerDeclaration.standing.value.replace(/-/g, ' '), x: 90, y: 110 });
  }
  if (store.makerDeclaration?.freeText && store.makerDeclaration.freeText.length > 10) {
    const txt = store.makerDeclaration.freeText;
    nodes.push({ id: 'tx', role: 'Work', label: txt.slice(0, 24) + (txt.length > 24 ? '…' : ''), x: 20, y: 180 });
  }

  // Operation result nodes — show completed readings
  if (store.woodchipperReading) {
    nodes.push({
      id: 'eval',
      role: 'Reading',
      label: `${store.woodchipperReading.workStage} — ${store.woodchipperReading.categorization}`,
      x: 160,
      y: 200,
      isOp: true,
    });
  }

  // Stage node — only when not in workspace mode (avoids clutter)
  const stageMap: Record<string, string> = {
    'I': 'Maker declared', 'II': 'Work classified', 'III': 'Judge identified',
    'IV': 'Frame agreed', 'V': 'Case rested', 'VI': 'Threshold crossed',
    'VII': 'Under assessment', 'VIII': 'Score rendered', 'IX': 'Recording', 'X': 'On the boards', 'XI': 'Portfolio',
  };
  const cur = store.currentStage;
  if (stageMap[cur]) {
    nodes.push({ id: 'st', role: 'Stage', label: stageMap[cur], x: 180, y: 120 });
  }
  return nodes;
}

export function LiveBoard({ theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useCeremonyStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill container
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const t = THEMES[theme];
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = t.gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const nodes = buildNodes(store);

    // Scale node positions proportionally to canvas size
    const scaleX = W / 300;
    const scaleY = H / 340;
    const scaledNodes = nodes.map(n => ({
      ...n,
      x: n.x * scaleX,
      y: n.y * scaleY + 20,
    }));

    if (scaledNodes.length === 0) {
      ctx.fillStyle = t.emptyText;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Fill the form to see your work here', W / 2, H / 2);
      return;
    }

    // Draw edges (dashed lines between all nodes)
    ctx.strokeStyle = t.edgeColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    scaledNodes.forEach((a, ai) => {
      scaledNodes.forEach((b, bi) => {
        if (bi <= ai) return;
        ctx.beginPath();
        ctx.moveTo(a.x + 60, a.y + 18);
        ctx.lineTo(b.x + 60, b.y + 18);
        ctx.stroke();
      });
    });
    ctx.setLineDash([]);

    // Draw nodes
    scaledNodes.forEach(node => {
      const nx = node.x;
      const ny = node.y;
      const nw = 120;
      const nh = 38;

      // Pick colors based on whether this is an operation node
      const strokeColor = node.isOp ? t.opNodeStroke : t.nodeStroke;
      const textColor = node.isOp ? t.opNodeText : t.nodeText;
      const roleLabelColor = node.isOp ? t.opRoleText : t.roleText;

      // Box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, nx, ny, nw, nh, 5);

      // Role label
      ctx.fillStyle = roleLabelColor;
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(node.role.toUpperCase(), nx + 8, ny + 13);

      // Value
      ctx.fillStyle = textColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(node.label, nx + 8, ny + 28);
    });

  }, [theme, store.currentStage, store.workClassification, store.makerDeclaration, store.judgeIdentity, store.woodchipperReading]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={300}
      data-testid="live-board-canvas"
      className="w-full h-full"
      style={{ background: THEMES[theme].bg }}
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
