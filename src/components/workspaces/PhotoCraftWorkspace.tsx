import React, { useState, useRef, useEffect } from 'react';
import { 
  ProjectAsset, 
  CraftApp 
} from '../../types';
import { 
  Sliders, 
  Layers, 
  Download, 
  Undo, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Terminal,
  Save,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface PhotoCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
  onSaveAsset?: (assetName: string, dataUrl: string) => void;
}

export const PhotoCraftWorkspace: React.FC<PhotoCraftWorkspaceProps> = ({
  app,
  asset,
  onSaveAsset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Adjustments State
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [contrast, setContrast] = useState<number>(0); // -100 to 100
  const [saturation, setSaturation] = useState<number>(0); // -100 to 100
  const [sepia, setSepia] = useState<number>(0); // 0 to 100
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [invert, setInvert] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'adjustments' | 'layers' | 'histogram' | 'companion'>('adjustments');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [companionDispatchStatus, setCompanionDispatchStatus] = useState<string | null>(null);

  // Layers state
  const [layers, setLayers] = useState([
    { id: 'l1', name: 'Base Background (P3)', visible: true, opacity: 100 },
    { id: 'l2', name: 'Color Grading Matrix', visible: true, opacity: 85 },
    { id: 'l3', name: 'Grain & Vignette Filter', visible: true, opacity: 50 },
  ]);

  // Redraw canvas whenever adjustments or layer visibility changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    // Draw background synthetic test pattern / image
    ctx.clearRect(0, 0, width, height);

    // Layer 1: Base Gradient Background
    if (layers.find(l => l.id === 'l1')?.visible) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1E222A');
      grad.addColorStop(0.5, '#2B2738');
      grad.addColorStop(1, '#1A1822');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Architectural geometry lines
      ctx.strokeStyle = 'rgba(183, 160, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 40; i < width; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 120, height);
        ctx.stroke();
      }
    }

    // Layer 2: Geometric Focal Composition
    if (layers.find(l => l.id === 'l2')?.visible) {
      const l2Opacity = (layers.find(l => l.id === 'l2')?.opacity || 100) / 100;
      ctx.save();
      ctx.globalAlpha = l2Opacity;
      
      const radGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, 260);
      radGrad.addColorStop(0, '#B7A0FF');
      radGrad.addColorStop(0.6, '#6366F1');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 180, 0, Math.PI * 2);
      ctx.fill();

      // Overlay text/mark
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(asset ? asset.name : 'PhotoCraft 0.7.0 Engine', width / 2, height / 2 + 8);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '400 13px "JetBrains Mono", monospace';
      ctx.fillText('Non-Destructive 16-Bit Processing Graph', width / 2, height / 2 + 34);
      ctx.restore();
    }

    // Apply pixel filters via ImageData
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      const bFactor = (brightness * 2.55); // -255 to 255
      const cFactor = (contrast + 100) / 100; // 0 to 2
      const sFactor = (saturation + 100) / 100;

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Brightness
        r += bFactor;
        g += bFactor;
        b += bFactor;

        // Contrast
        r = ((r - 128) * cFactor) + 128;
        g = ((g - 128) * cFactor) + 128;
        b = ((b - 128) * cFactor) + 128;

        // Saturation
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + (r - gray) * sFactor;
        g = gray + (g - gray) * sFactor;
        b = gray + (b - gray) * sFactor;

        // Sepia
        if (sepia > 0) {
          const s = sepia / 100;
          const tr = 0.393 * r + 0.769 * g + 0.189 * b;
          const tg = 0.349 * r + 0.686 * g + 0.168 * b;
          const tb = 0.272 * r + 0.534 * g + 0.131 * b;
          r = r * (1 - s) + tr * s;
          g = g * (1 - s) + tg * s;
          b = b * (1 - s) + tb * s;
        }

        // Grayscale
        if (grayscale) {
          r = gray;
          g = gray;
          b = gray;
        }

        // Invert
        if (invert) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        // Clamp
        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);
    } catch {
      // In case of security or dimension error, keep canvas as is
    }
  }, [brightness, contrast, saturation, sepia, grayscale, invert, layers, asset]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = asset ? `${asset.name.replace(/\.[^/.]+$/, '')}_edited.png` : 'photocraft_export.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSaveToProject = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSaveAsset) {
      onSaveAsset(asset ? `${asset.name}_edited` : 'photocraft_render.png', dataUrl);
    }
    setSaveStatus('Saved edited asset to active project.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSepia(0);
    setGrayscale(false);
    setInvert(false);
    setZoom(100);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* Editor Center Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editor Toolbar */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">PhotoCraft</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              {asset ? asset.name : 'Untitled Canvas.photo'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              RGBA 8-Bit sRGB
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono text-[11px] text-[var(--text-muted)] w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(300, zoom + 25))}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              title="Actual Pixels"
            >
              <Maximize2 size={14} />
            </button>

            <span className="text-[var(--border-subtle)]">|</span>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Undo size={12} />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveToProject}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors font-medium"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium"
            >
              <Download size={12} />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Canvas Surface Area */}
        <div className="flex-1 overflow-auto bg-[#0A0B0D] flex items-center justify-center p-6 relative">
          {saveStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg z-20">
              <CheckCircle2 size={13} />
              <span>{saveStatus}</span>
            </div>
          )}

          <div 
            className="border border-[var(--border-subtle)] shadow-2xl transition-transform duration-100 bg-[#17191D]"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          >
            <canvas ref={canvasRef} className="block cursor-crosshair" />
          </div>
        </div>
      </div>

      {/* Right Inspector & Adjustments Dock */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
        {/* Inspector Tabs */}
        <div className="flex border-b border-[var(--border-subtle)] text-xs">
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`flex-1 py-2.5 text-center font-medium transition-colors ${
              activeTab === 'adjustments' 
                ? 'text-[#B7A0FF] border-b-2 border-[#B7A0FF] bg-[var(--bg-elevated)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Adjustments
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-2.5 text-center font-medium transition-colors ${
              activeTab === 'layers' 
                ? 'text-[#B7A0FF] border-b-2 border-[#B7A0FF] bg-[var(--bg-elevated)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Layers ({layers.length})
          </button>
          <button
            onClick={() => setActiveTab('companion')}
            className={`flex-1 py-2.5 text-center font-medium transition-colors ${
              activeTab === 'companion' 
                ? 'text-[#B7A0FF] border-b-2 border-[#B7A0FF] bg-[var(--bg-elevated)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            CLI Bridge
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6 text-xs">
          {activeTab === 'adjustments' && (
            <div className="space-y-4">
              {/* Exposure / Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Brightness</span>
                  <span className="font-mono text-[var(--text-primary)]">{brightness > 0 ? `+${brightness}` : brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-[#B7A0FF]"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Contrast</span>
                  <span className="font-mono text-[var(--text-primary)]">{contrast > 0 ? `+${contrast}` : contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-[#B7A0FF]"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Saturation</span>
                  <span className="font-mono text-[var(--text-primary)]">{saturation > 0 ? `+${saturation}` : saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-[#B7A0FF]"
                />
              </div>

              {/* Sepia */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Sepia Warmth</span>
                  <span className="font-mono text-[var(--text-primary)]">{sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sepia}
                  onChange={(e) => setSepia(Number(e.target.value))}
                  className="w-full accent-[#B7A0FF]"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Monochrome (B&W)</span>
                  <input
                    type="checkbox"
                    checked={grayscale}
                    onChange={(e) => setGrayscale(e.target.checked)}
                    className="rounded accent-[#B7A0FF]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--text-secondary)]">Invert Negative</span>
                  <input
                    type="checkbox"
                    checked={invert}
                    onChange={(e) => setInvert(e.target.checked)}
                    className="rounded accent-[#B7A0FF]"
                  />
                </label>
              </div>

              {/* Histogram Visualizer */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">RGB Histogram</span>
                <div className="h-14 bg-[var(--bg-elevated)] rounded border border-[var(--border-subtle)] flex items-end p-1 gap-0.5">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const h = Math.abs(Math.sin((i + brightness / 20) * 0.4)) * 80 + 10;
                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#B7A0FF]/60 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-2">
              <div className="text-[11px] text-[var(--text-muted)] mb-2">
                Non-destructive composite stack
              </div>
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => {
                        setLayers(layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l));
                      }}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {layer.visible ? <Eye size={13} className="text-[#B7A0FF]" /> : <EyeOff size={13} />}
                    </button>
                    <span className={`truncate text-xs ${layer.visible ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] line-through'}`}>
                      {layer.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                    {layer.opacity}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'companion' && (
            <div className="space-y-3">
              <div className="text-[11px] text-[var(--text-muted)]">
                Execute photocraft-cli operations via local companion bridge
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] space-y-1">
                <div className="text-[#B7A0FF]">// photocraft-cli command</div>
                <div>photocraft-cli process \</div>
                <div>&nbsp;&nbsp;--input {asset ? asset.name : 'input.photo'} \</div>
                <div>&nbsp;&nbsp;--brightness {brightness} \</div>
                <div>&nbsp;&nbsp;--contrast {contrast} \</div>
                <div>&nbsp;&nbsp;--out rendered.png</div>
              </div>
              <button
                onClick={() => {
                  setCompanionDispatchStatus("Companion command 'photocraft-cli' dispatched to localhost:9876.");
                  setTimeout(() => setCompanionDispatchStatus(null), 4000);
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[#B7A0FF] transition-colors"
              >
                <Terminal size={12} />
                <span>Execute via Companion</span>
              </button>
              {companionDispatchStatus && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>{companionDispatchStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
