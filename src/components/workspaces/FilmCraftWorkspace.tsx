import React, { useState, useEffect } from 'react';
import { ProjectAsset, CraftApp } from '../../types';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Volume2, 
  Sliders, 
  Radio, 
  Save, 
  Download,
  Terminal,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface FilmCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
}

export const FilmCraftWorkspace: React.FC<FilmCraftWorkspaceProps> = ({
  app,
  asset,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(42); // 42 seconds in
  const [mcpStatus, setMcpStatus] = useState<'idle' | 'connected' | 'querying'>('idle');
  const [mcpLogs, setMcpLogs] = useState<string[]>([
    'FilmCraft MCP bridge listening on 127.0.0.1:9876',
    'Registered tool: filmcraft_timeline_inspect',
    'Registered tool: filmcraft_split_clip',
    'Registered tool: filmcraft_add_color_lut',
  ]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Playhead timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((t) => (t >= 300 ? 0 : t + 1));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatSMPTE = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const frames = Math.floor((totalSec * 24) % 24);
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const handleTriggerMCP = () => {
    setMcpStatus('querying');
    setTimeout(() => {
      setMcpStatus('connected');
      setMcpLogs((prev) => [
        ...prev,
        `[MCP CALL] Invoked filmcraft_split_clip at SMPTE ${formatSMPTE(currentTimeSec)}`,
        'Razor slice applied to Track V1 & V2.',
      ]);
    }, 700);
  };

  const handleExportEdl = () => {
    const edlContent = `TITLE: MASTER_SEQUENCE\nFCM: NON-DROP FRAME\n001  AX       V     C        00:00:00:00 00:01:42:00 00:00:00:00 00:01:42:00\n* FROM CLIP NAME: assembly-01.film\n`;
    const blob = new Blob([edlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset ? `${asset.name.replace(/\.[^/.]+$/, '')}.edl` : 'sequence.edl';
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus('CMX 3600 EDL conform exported to downloads.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* Main Timeline & Preview Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Header */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">FilmCraft</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              {asset ? asset.name : 'Master Sequence.film'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MCP Protocol Active
            </span>
          </div>

          {/* SMPTE Timecode Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-xs text-[#B7A0FF]">
              <Clock size={12} />
              <span>{formatSMPTE(currentTimeSec)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">@ 24.00 fps</span>
            </div>

            <button
              onClick={() => {
                setSaveStatus('Timeline sequence saved to project.');
                setTimeout(() => setSaveStatus(null), 3000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors font-medium"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={handleExportEdl}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium"
            >
              <Download size={12} />
              <span>Export EDL</span>
            </button>
          </div>
        </div>

        {/* Video Monitor / Program Viewport */}
        <div className="h-64 shrink-0 bg-[#07080A] border-b border-[var(--border-subtle)] flex items-center justify-center relative p-4">
          {saveStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg z-20">
              <CheckCircle2 size={13} />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Program Screen Aspect Box (2.40:1 Scope) */}
          <div className="h-52 aspect-[2.4/1] bg-[#14161C] border border-[var(--border-subtle)] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Visual Anamorphic Cinematic Simulation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-[#B7A0FF]/30 blur-[1px]" />
            </div>

            <div className="relative z-10 text-center space-y-1">
              <div className="font-mono text-sm tracking-widest text-[#F2F3F5] font-semibold">
                SCENE 04 · TAKE 02
              </div>
              <div className="font-mono text-xs text-[#B7A0FF]">
                SMPTE {formatSMPTE(currentTimeSec)} · ACEScg Color
              </div>
            </div>

            {/* Playhead status badge */}
            <div className="absolute bottom-2 right-3 font-mono text-[10px] text-[var(--text-muted)]">
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </div>
          </div>
        </div>

        {/* Transport Controls Bar */}
        <div className="h-10 shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTimeSec(0)}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Return to start"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[#B7A0FF] hover:text-[#101114] transition-colors flex items-center gap-1.5 font-medium"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => setCurrentTimeSec(Math.min(300, currentTimeSec + 10))}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Jump 10s forward"
            >
              <SkipForward size={14} />
            </button>

            <span className="text-[var(--border-subtle)]">|</span>

            <button
              onClick={handleTriggerMCP}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors"
              title="Split clip at playhead using MCP tool"
            >
              <Scissors size={12} />
              <span>Razor Cut (MCP)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
            <span>Duration: 05:00:00</span>
          </div>
        </div>

        {/* Multi-Track Timeline Canvas */}
        <div className="flex-1 overflow-auto bg-[#0C0D10] p-4 space-y-2">
          {/* Timeline Ruler */}
          <div className="h-6 flex items-end border-b border-[var(--border-subtle)] pb-1 px-2 text-[10px] font-mono text-[var(--text-muted)]">
            <div className="w-24 shrink-0 font-semibold text-[var(--text-secondary)]">TRACK</div>
            <div className="flex-1 flex justify-between">
              <span>00:00</span>
              <span>01:00</span>
              <span>02:00</span>
              <span>03:00</span>
              <span>04:00</span>
              <span>05:00</span>
            </div>
          </div>

          {/* Video Track 2 (Overlay / FX) */}
          <div className="flex items-center gap-2 h-12 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] p-1.5">
            <div className="w-24 shrink-0 text-xs font-mono font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="text-[#B7A0FF]">V2</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">Title FX</span>
            </div>
            <div className="flex-1 h-full bg-[var(--bg-workspace)] rounded relative overflow-hidden flex items-center">
              <div 
                className="h-full bg-indigo-500/30 border border-indigo-500/50 rounded px-2 text-[10px] font-mono text-indigo-300 flex items-center"
                style={{ width: '45%', marginLeft: '10%' }}
              >
                title_card_composite.fx
              </div>
            </div>
          </div>

          {/* Video Track 1 (Primary Footage) */}
          <div className="flex items-center gap-2 h-14 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] p-1.5">
            <div className="w-24 shrink-0 text-xs font-mono font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="text-[#38BDF8]">V1</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">Master</span>
            </div>
            <div className="flex-1 h-full bg-[var(--bg-workspace)] rounded relative overflow-hidden flex items-center gap-1">
              <div 
                className="h-full bg-sky-500/30 border border-sky-500/50 rounded px-2 text-[10px] font-mono text-sky-200 flex items-center"
                style={{ width: '38%' }}
              >
                A001_C002_0842.mov (4K)
              </div>
              <div 
                className="h-full bg-sky-500/30 border border-sky-500/50 rounded px-2 text-[10px] font-mono text-sky-200 flex items-center"
                style={{ width: '52%' }}
              >
                A001_C005_0915.mov (4K)
              </div>
            </div>
          </div>

          {/* Audio Track 1 (Dialog) */}
          <div className="flex items-center gap-2 h-11 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] p-1.5">
            <div className="w-24 shrink-0 text-xs font-mono font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="text-emerald-400">A1</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">Dialog</span>
            </div>
            <div className="flex-1 h-full bg-[var(--bg-workspace)] rounded relative overflow-hidden flex items-center">
              <div 
                className="h-full bg-emerald-500/25 border border-emerald-500/40 rounded px-2 text-[10px] font-mono text-emerald-300 flex items-center"
                style={{ width: '70%' }}
              >
                boom_dialog_sync.wav
              </div>
            </div>
          </div>

          {/* Audio Track 2 (Synthesizer Score) */}
          <div className="flex items-center gap-2 h-11 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] p-1.5">
            <div className="w-24 shrink-0 text-xs font-mono font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="text-emerald-400">A2</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">Score</span>
            </div>
            <div className="flex-1 h-full bg-[var(--bg-workspace)] rounded relative overflow-hidden flex items-center">
              <div 
                className="h-full bg-emerald-500/25 border border-emerald-500/40 rounded px-2 text-[10px] font-mono text-emerald-300 flex items-center"
                style={{ width: '92%' }}
              >
                sub_bass_multitrack.sound (48kHz)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right MCP & Conform Inspector */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-emerald-400" />
              <span>MCP Server Bridge</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Active</span>
          </div>

          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Connected to FilmCraft local Model Context Protocol engine on port 9876. AI models coordinate automated cuts and sequence conﬁguration.
          </div>

          {/* MCP Telemetry Console */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Bridge Log</span>
            <div className="h-44 p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)] overflow-y-auto space-y-1">
              {mcpLogs.map((log, idx) => (
                <div key={idx} className="leading-tight">
                  <span className="text-[#B7A0FF]">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>

          {/* Color Grading Wheels Preview */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-medium text-[var(--text-primary)]">ACES Color Curve</span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-[var(--text-muted)]">
              <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <div>Lift</div>
                <div className="text-[var(--text-primary)] mt-1 font-semibold">0.00</div>
              </div>
              <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <div>Gamma</div>
                <div className="text-[var(--text-primary)] mt-1 font-semibold">1.02</div>
              </div>
              <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <div>Gain</div>
                <div className="text-[var(--text-primary)] mt-1 font-semibold">1.00</div>
              </div>
            </div>
          </div>
        </div>

        {/* CLI Command */}
        <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <div className="text-[#B7A0FF]">filmcraft-cli mcp</div>
          <div>filmcraft-cli mcp --bridge 127.0.0.1:9876</div>
        </div>
      </aside>
    </div>
  );
};
