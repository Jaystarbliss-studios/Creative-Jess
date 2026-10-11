import React, { useState, useRef } from 'react';
import { ProjectAsset, CraftApp } from '../../types';
import { 
  Square, 
  Circle, 
  Minus, 
  PenTool, 
  MousePointer, 
  Download, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  CheckCircle2,
  Trash2,
  Layers
} from 'lucide-react';

interface VectorCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
  onSaveAsset?: (assetName: string, svgContent: string) => void;
}

interface VectorElement {
  id: string;
  type: 'rect' | 'circle' | 'line' | 'path';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export const VectorCraftWorkspace: React.FC<VectorCraftWorkspaceProps> = ({
  app,
  asset,
  onSaveAsset,
}) => {
  const [tool, setTool] = useState<'select' | 'rect' | 'circle' | 'line'>('select');
  const [fillColor, setFillColor] = useState<string>('#B7A0FF');
  const [strokeColor, setStrokeColor] = useState<string>('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [zoom, setZoom] = useState<number>(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Initial geometric elements representing an architectural monogram
  const [elements, setElements] = useState<VectorElement[]>([
    { id: 'v1', type: 'rect', x: 200, y: 150, width: 400, height: 300, fill: '#1E222A', stroke: '#30343C', strokeWidth: 1.5 },
    { id: 'v2', type: 'circle', x: 400, y: 300, radius: 120, fill: 'transparent', stroke: '#B7A0FF', strokeWidth: 3 },
    { id: 'v3', type: 'line', x: 250, y: 300, x2: 550, y2: 300, fill: 'none', stroke: '#6366F1', strokeWidth: 2 },
    { id: 'v4', type: 'line', x: 400, y: 150, x2: 400, y2: 450, fill: 'none', stroke: '#6366F1', strokeWidth: 2 },
    { id: 'v5', type: 'circle', x: 400, y: 300, radius: 45, fill: '#B7A0FF', stroke: '#FFFFFF', strokeWidth: 2 },
  ]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / (zoom / 100));
    const y = Math.round((e.clientY - rect.top) / (zoom / 100));

    const newEl: VectorElement = {
      id: `el-${Date.now()}`,
      type: tool,
      x,
      y,
      fill: tool === 'line' ? 'none' : fillColor,
      stroke: strokeColor,
      strokeWidth,
      ...(tool === 'rect' ? { width: 100, height: 75 } : {}),
      ...(tool === 'circle' ? { radius: 50 } : {}),
      ...(tool === 'line' ? { x2: x + 120, y2: y + 40 } : {}),
    };

    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleExportSVG = () => {
    const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#101114"/>
  ${elements.map(el => {
    if (el.type === 'rect') return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
    if (el.type === 'circle') return `<circle cx="${el.x}" cy="${el.y}" r="${el.radius}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
    if (el.type === 'line') return `<line x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`;
    return '';
  }).join('\n  ')}
</svg>`.trim();

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = asset ? `${asset.name.replace(/\.[^/.]+$/, '')}.svg` : 'vectorcraft_drawing.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToProject = () => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">${elements.length} elements</svg>`;
    if (onSaveAsset) {
      onSaveAsset(asset ? asset.name : 'monogram.vec', svgString);
    }
    setSaveStatus('Vector document saved to active project.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* Editor Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">VectorCraft</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              {asset ? asset.name : 'Vector Canvas.vec'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              Bézier Math · Resolution Independent
            </span>
          </div>

          {/* Tool Selector */}
          <div className="flex items-center gap-1 p-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setTool('select')}
              className={`p-1 rounded ${tool === 'select' ? 'bg-[#B7A0FF] text-[#101114]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Select / Move Tool"
            >
              <MousePointer size={14} />
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`p-1 rounded ${tool === 'rect' ? 'bg-[#B7A0FF] text-[#101114]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Rectangle Tool"
            >
              <Square size={14} />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-1 rounded ${tool === 'circle' ? 'bg-[#B7A0FF] text-[#101114]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Circle / Ellipse Tool"
            >
              <Circle size={14} />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-1 rounded ${tool === 'line' ? 'bg-[#B7A0FF] text-[#101114]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Line Segment Tool"
            >
              <Minus size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedId && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-2 py-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete Selected Shape"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={handleSaveToProject}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors font-medium"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={handleExportSVG}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium"
            >
              <Download size={12} />
              <span>Export SVG</span>
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 overflow-auto bg-[#0C0D10] flex items-center justify-center p-6 relative">
          {saveStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg z-20">
              <CheckCircle2 size={13} />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="border border-[var(--border-subtle)] shadow-2xl bg-[#14161B]">
            <svg
              width={800 * (zoom / 100)}
              height={600 * (zoom / 100)}
              viewBox="0 0 800 600"
              onClick={handleCanvasClick}
              className="cursor-crosshair select-none block"
            >
              {/* Subtle Grid Matrix */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />

              {/* Elements Rendering */}
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                if (el.type === 'rect') {
                  return (
                    <rect
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      fill={el.fill}
                      stroke={isSelected ? '#38BDF8' : el.stroke}
                      strokeWidth={isSelected ? el.strokeWidth + 1.5 : el.strokeWidth}
                      strokeDasharray={isSelected ? '4 2' : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                      className="cursor-pointer"
                    />
                  );
                }
                if (el.type === 'circle') {
                  return (
                    <circle
                      key={el.id}
                      cx={el.x}
                      cy={el.y}
                      r={el.radius}
                      fill={el.fill}
                      stroke={isSelected ? '#38BDF8' : el.stroke}
                      strokeWidth={isSelected ? el.strokeWidth + 1.5 : el.strokeWidth}
                      strokeDasharray={isSelected ? '4 2' : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                      className="cursor-pointer"
                    />
                  );
                }
                if (el.type === 'line') {
                  return (
                    <line
                      key={el.id}
                      x1={el.x}
                      y1={el.y}
                      x2={el.x2}
                      y2={el.y2}
                      stroke={isSelected ? '#38BDF8' : el.stroke}
                      strokeWidth={isSelected ? el.strokeWidth + 1.5 : el.strokeWidth}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                      className="cursor-pointer"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Right Properties Dock */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <Layers size={14} className="text-[#B7A0FF]" />
            <span>Vector Properties</span>
          </div>

          {/* Stroke Width Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">Stroke Width</span>
              <span className="font-mono text-[var(--text-primary)]">{strokeWidth} pt</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full accent-[#B7A0FF]"
            />
          </div>

          {/* Color Palettes */}
          <div className="space-y-2">
            <span className="text-[11px] text-[var(--text-secondary)]">Fill Swatch</span>
            <div className="flex items-center gap-1.5">
              {['#B7A0FF', '#38BDF8', '#4ADE80', '#FBBF24', '#FB7185', '#1E222A', 'transparent'].map((c) => (
                <button
                  key={c}
                  onClick={() => setFillColor(c)}
                  className={`w-6 h-6 rounded border transition-transform ${fillColor === c ? 'scale-110 border-white' : 'border-[var(--border-subtle)]'}`}
                  style={{ backgroundColor: c === 'transparent' ? '#17191D' : c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] text-[var(--text-secondary)]">Stroke Swatch</span>
            <div className="flex items-center gap-1.5">
              {['#FFFFFF', '#B7A0FF', '#6366F1', '#38BDF8', '#101114'].map((c) => (
                <button
                  key={c}
                  onClick={() => setStrokeColor(c)}
                  className={`w-6 h-6 rounded border transition-transform ${strokeColor === c ? 'scale-110 border-white' : 'border-[var(--border-subtle)]'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Element Tree */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Element Hierarchy ({elements.length})
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {elements.map((el, i) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`px-2 py-1.5 rounded flex items-center justify-between cursor-pointer text-[11px] ${
                    selectedId === el.id ? 'bg-[#B7A0FF]/15 text-[#B7A0FF]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="capitalize font-mono">{i + 1}. {el.type}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{el.stroke}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CLI Companion snippet */}
        <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <div className="text-[#B7A0FF]">vectorcraft-cli v0.9.0</div>
          <div>vectorcraft-cli render --input {asset ? asset.name : 'design.vec'} --format svg</div>
        </div>
      </aside>
    </div>
  );
};
