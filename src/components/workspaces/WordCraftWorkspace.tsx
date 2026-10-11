import React, { useState } from 'react';
import { ProjectAsset, CraftApp } from '../../types';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  Save, 
  Download, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface WordCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
}

export const WordCraftWorkspace: React.FC<WordCraftWorkspaceProps> = ({
  app,
  asset,
}) => {
  const [content, setContent] = useState<string>(`# Vanguard Architectural Brand Guidelines

## 1. Core Principles
The Vanguard visual identity is grounded in the tradition of Swiss rationalism and contemporary precision engineering. We prioritize structural honesty, unadorned typography, and generous negative space over superficial decoration.

### Typographic Hierarchy
Primary headlines are typeset in Plus Jakarta Sans SemiBold with tight letter spacing. Technical annotations and tabular specifications strictly use JetBrains Mono tabular-nums.

### Spatial Math
- Minimum container outer margin: 24pt
- Micro baseline grid: 4pt increments
- Maximum measure for body text: 68 characters per line

## 2. Palette Invariants
The foundation consists of 60% deep neutral canvas, 30% structural surfaces, and 10% high-intent lilac accent (#B7A0FF). Never apply color where contrast and typographic weight achieve the communication goal.`);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  const handleExportDocx = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset ? `${asset.name.replace(/\.[^/.]+$/, '')}.md` : 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* Editor Center */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Formatting Toolbar */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">WordCraft</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              {asset ? asset.name : 'Untitled Document.word'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[var(--text-muted)] px-2">
              {wordCount} words · {charCount} chars
            </span>

            <span className="text-[var(--border-subtle)]">|</span>

            <button
              onClick={() => {
                setSaveStatus('Document saved to project.');
                setTimeout(() => setSaveStatus(null), 3000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors font-medium"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={handleExportDocx}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium"
            >
              <Download size={12} />
              <span>Export DOCX / MD</span>
            </button>
          </div>
        </div>

        {/* Writing Surface Area */}
        <div className="flex-1 overflow-auto bg-[#0E0F12] p-8 flex justify-center relative">
          {saveStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg z-20">
              <CheckCircle2 size={13} />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Paper Canvas */}
          <div className="w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded shadow-2xl p-10 min-h-[800px] flex flex-col">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 bg-transparent resize-none outline-none font-sans text-sm text-[var(--text-primary)] leading-relaxed placeholder-[var(--text-muted)]"
              placeholder="Begin writing document..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Right Typographic Specs Dock */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <BookOpen size={14} className="text-[#B7A0FF]" />
            <span>Document Layout Specs</span>
          </div>

          <div className="space-y-2 text-[11px] text-[var(--text-secondary)]">
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>Page Standard</span>
              <span className="font-mono text-[var(--text-primary)]">ISO A4 Portrait</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>Primary Font</span>
              <span className="font-mono text-[var(--text-primary)]">Plus Jakarta Sans</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>Code / Numbers</span>
              <span className="font-mono text-[var(--text-primary)]">JetBrains Mono</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
              <span>Line Height</span>
              <span className="font-mono text-[var(--text-primary)]">1.65 (Relaxed)</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <div className="text-[#B7A0FF]">wordcraft-cli v0.5.0</div>
          <div>wordcraft-cli compile --in brief.word --out brief.docx</div>
        </div>
      </aside>
    </div>
  );
};
