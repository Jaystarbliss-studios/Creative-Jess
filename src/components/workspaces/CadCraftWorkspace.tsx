import React, { useState } from 'react';
import { ProjectAsset, CraftApp } from '../../types';
import { 
  Crosshair, 
  Grid, 
  Ruler, 
  Save, 
  Download, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  CheckCircle2
} from 'lucide-react';

interface CadCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
}

export const CadCraftWorkspace: React.FC<CadCraftWorkspaceProps> = ({
  app,
  asset,
}) => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const layers = [
    { id: 'l1', name: '0_CONSTRUCTION', color: '#64748B', visible: true },
    { id: 'l2', name: 'OUTER_BEARING_HOUSING', color: '#38BDF8', visible: true },
    { id: 'l3', name: 'ESCAPEMENT_TEETH_Z20', color: '#B7A0FF', visible: true },
    { id: 'l4', name: 'DIMENSION_CALLOUTS', color: '#FBBF24', visible: true },
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - 400) / (zoom / 100);
    const rawY = (300 - (e.clientY - rect.top)) / (zoom / 100);
    const x = snapEnabled ? Math.round(rawX / 5) * 5 : Math.round(rawX * 10) / 10;
    const y = snapEnabled ? Math.round(rawY / 5) * 5 : Math.round(rawY * 10) / 10;
    setCoords({ x, y });
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* CAD Center Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">CADCraft</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              {asset ? asset.name : 'Drawing1.cad'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              ISO Standard mm · 1:1 Scale
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
                snapEnabled ? 'bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              }`}
            >
              <Grid size={12} />
              <span>SNAP {snapEnabled ? 'ON (5mm)' : 'OFF'}</span>
            </button>

            <span className="text-[var(--border-subtle)]">|</span>

            <button
              onClick={() => {
                setSaveStatus('CAD drawing saved.');
                setTimeout(() => setSaveStatus(null), 3000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors font-medium"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={() => alert('DXF Release 14 exported.')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium"
            >
              <Download size={12} />
              <span>Export DXF</span>
            </button>
          </div>
        </div>

        {/* Viewport SVG Grid Area */}
        <div className="flex-1 overflow-auto bg-[#08090C] flex items-center justify-center p-6 relative">
          {saveStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg z-20">
              <CheckCircle2 size={13} />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Coordinate Readout HUD */}
          <div className="absolute bottom-4 left-4 font-mono text-[11px] bg-[var(--bg-surface)]/90 backdrop-blur px-3 py-1.5 rounded border border-[var(--border-subtle)] text-[#38BDF8] z-20 flex items-center gap-3">
            <Crosshair size={12} />
            <span>X: {coords.x.toFixed(2)} mm</span>
            <span>Y: {coords.y.toFixed(2)} mm</span>
            <span>Z: 0.00 mm</span>
          </div>

          <div className="border border-[var(--border-subtle)] bg-[#0C0E13] shadow-2xl">
            <svg
              width={800 * (zoom / 100)}
              height={600 * (zoom / 100)}
              viewBox="0 0 800 600"
              onMouseMove={handleMouseMove}
              className="cursor-crosshair select-none block"
            >
              {/* Engineering Grid */}
              <defs>
                <pattern id="cadGridSmall" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                </pattern>
                <pattern id="cadGridLarge" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#cadGridSmall)"/>
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#cadGridLarge)"/>

              {/* Origin Crosshairs */}
              <line x1="0" y1="300" x2="800" y2="300" stroke="rgba(56,189,248,0.3)" strokeWidth="1" strokeDasharray="6 3"/>
              <line x1="400" y1="0" x2="400" y2="600" stroke="rgba(56,189,248,0.3)" strokeWidth="1" strokeDasharray="6 3"/>

              {/* Escapement & Bearing Engineering Schematic */}
              <circle cx="400" cy="300" r="160" fill="none" stroke="#38BDF8" strokeWidth="2"/>
              <circle cx="400" cy="300" r="110" fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="4 2"/>
              <circle cx="400" cy="300" r="40" fill="none" stroke="#38BDF8" strokeWidth="2"/>
              <circle cx="400" cy="300" r="15" fill="#38BDF8" opacity="0.3"/>

              {/* Precision Escapement Teeth Spokes */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 400 + Math.cos(angle) * 40;
                const y1 = 300 + Math.sin(angle) * 40;
                const x2 = 400 + Math.cos(angle) * 160;
                const y2 = 300 + Math.sin(angle) * 160;
                return (
                  <line 
                    key={i} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke="#B7A0FF" 
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Dimension Annotation Line */}
              <line x1="240" y1="110" x2="560" y2="110" stroke="#FBBF24" strokeWidth="1"/>
              <line x1="240" y1="100" x2="240" y2="120" stroke="#FBBF24" strokeWidth="1"/>
              <line x1="560" y1="100" x2="560" y2="120" stroke="#FBBF24" strokeWidth="1"/>
              <text x="400" y="102" fill="#FBBF24" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">
                DIA 320.00 mm ± 0.02
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Layers & Snapping Dock */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <Layers size={14} className="text-[#38BDF8]" />
            <span>CAD Layers (DWG/DXF)</span>
          </div>

          <div className="space-y-1.5">
            {layers.map((l) => (
              <div
                key={l.id}
                className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between font-mono text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[var(--text-primary)] truncate">{l.name}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <div className="text-[#38BDF8]">cadcraft-cli v0.5.0</div>
          <div>cadcraft-cli convert --in part.dxf --out part.svg</div>
        </div>
      </aside>
    </div>
  );
};
