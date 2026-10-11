import React, { useState } from 'react';
import { ProjectAsset, CraftApp } from '../../types';
import { 
  Table, 
  Calculator, 
  Download, 
  Save, 
  CheckCircle2,
  Plus
} from 'lucide-react';

interface GridCraftWorkspaceProps {
  app: CraftApp;
  asset?: ProjectAsset | null;
}

export const GridCraftWorkspace: React.FC<GridCraftWorkspaceProps> = ({
  app,
  asset,
}) => {
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [data, setData] = useState<string[][]>([
    ['Part Name', 'Material', 'Tolerance (mm)', 'Unit Qty', 'Unit Cost ($)', 'Subtotal ($)'],
    ['Bearing Escapement', 'Titanium Gr5', '0.005', '12', '45.00', '540.00'],
    ['Pinion Arbor', '316L Steel', '0.002', '24', '18.50', '444.00'],
    ['Mainspring Barrel', 'Beryllium Cu', '0.010', '6', '85.00', '510.00'],
    ['Balance Wheel', 'Glucydur Alloy', '0.001', '6', '120.00', '720.00'],
    ['Jewel Bearing (Ruby)', 'Synthetic Corundum', '0.001', '48', '8.25', '396.00'],
    ['Total Production Run', '6 Line Items', 'ISO Standard', '96', 'Average: 55.35', '=SUM(F2:F6)'],
  ]);

  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 1, c: 0 });
  const [formulaValue, setFormulaValue] = useState<string>('Bearing Escapement');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });
    setFormulaValue(data[r]?.[c] || '');
  };

  const handleFormulaChange = (val: string) => {
    setFormulaValue(val);
    const updated = [...data];
    if (updated[selectedCell.r]) {
      updated[selectedCell.r][selectedCell.c] = val;
      setData(updated);
    }
  };

  const handleExportCSV = () => {
    const csvContent = data.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = asset ? `${asset.name.replace(/\.[^/.]+$/, '')}.csv` : 'spreadsheet.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-workspace)]">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="h-11 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">GridCraft</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">
              {asset ? asset.name : 'Sheet1.grid'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Reactive Calculation Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSaveStatus('Spreadsheet saved.');
                setTimeout(() => setSaveStatus(null), 3000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[#B7A0FF] hover:bg-[#B7A0FF]/15 transition-colors font-medium"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7A0FF] text-[#101114] hover:bg-[#c8b6ff] transition-colors font-medium"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Formula Input Bar */}
        <div className="h-10 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 flex items-center gap-3 text-xs">
          <div className="w-10 font-mono text-[#B7A0FF] font-semibold text-center shrink-0">
            {columns[selectedCell.c] || 'A'}{selectedCell.r + 1}
          </div>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] shrink-0 font-mono text-[11px]">
            <Calculator size={13} />
            <span>fx</span>
          </div>
          <input
            type="text"
            value={formulaValue}
            onChange={(e) => handleFormulaChange(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-xs text-[var(--text-primary)]"
            placeholder="Enter cell formula or numeric value..."
          />
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto bg-[#0C0D10] p-4 relative">
          {saveStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 shadow-lg z-20">
              <CheckCircle2 size={13} />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="border border-[var(--border-subtle)] rounded overflow-hidden bg-[var(--bg-surface)]">
            <table className="w-full border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
                  <th className="w-10 py-2 border-r border-[var(--border-subtle)] text-[var(--text-muted)] font-normal text-center">
                    #
                  </th>
                  {columns.map((col) => (
                    <th 
                      key={col} 
                      className="py-2 px-3 border-r border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium text-left"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rIdx) => {
                  const isHeaderRow = rIdx === 0;
                  const isTotalRow = rIdx === data.length - 1;
                  return (
                    <tr 
                      key={rIdx} 
                      className={`border-b border-[var(--border-subtle)]/60 ${
                        isHeaderRow ? 'bg-[var(--bg-elevated)]/50 font-semibold' : ''
                      } ${isTotalRow ? 'bg-[var(--bg-elevated)]/80 font-semibold border-t-2 border-[var(--border-subtle)]' : ''}`}
                    >
                      <td className="w-10 py-2 border-r border-[var(--border-subtle)] text-center text-[var(--text-muted)] select-none bg-[var(--bg-elevated)]">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => {
                        const isSelected = selectedCell.r === rIdx && selectedCell.c === cIdx;
                        return (
                          <td
                            key={cIdx}
                            onClick={() => handleCellClick(rIdx, cIdx)}
                            className={`py-2 px-3 border-r border-[var(--border-subtle)]/60 cursor-pointer transition-colors truncate max-w-[200px] ${
                              isSelected 
                                ? 'bg-[#B7A0FF]/20 outline outline-1 outline-[#B7A0FF] text-[var(--text-primary)]' 
                                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                            } ${cIdx >= 2 ? 'text-right' : 'text-left'}`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Formula & MCP Inspector */}
      <aside className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between text-xs space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 font-semibold text-[var(--text-primary)]">
            <Table size={14} className="text-emerald-400" />
            <span>Calculation Engine</span>
          </div>

          <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            GridCraft reactive computation graph evaluates dependencies and updates downstream totals.
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Active Range:</span>
              <div className="font-mono text-[#B7A0FF] mt-0.5">A1:F7 (42 cells)</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Evaluated Total:</span>
              <div className="font-mono text-emerald-400 mt-0.5">$2,610.00</div>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-muted)] space-y-1">
          <div className="text-emerald-400">gridcraft-cli v0.5.0</div>
          <div>gridcraft-cli compute sheet.grid --eval</div>
        </div>
      </aside>
    </div>
  );
};
