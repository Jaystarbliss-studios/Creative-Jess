import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const binary = option('--binary');
const supportsRoots = process.argv.includes('--scoped-roots');
const acceptance = option('--acceptance');
const scopedRootsConfigured = supportsRoots || ['photocraft', 'vectorcraft'].includes(acceptance);
if (!binary || !path.isAbsolute(binary)) {
  console.error('Usage: node scripts/smoke-mcp.mjs --binary <absolute-path> [--scoped-roots]');
  process.exit(2);
}
const temp = await mkdtemp(path.join(os.tmpdir(), 'craft-mcp-smoke-'));
const args = ['mcp'];
if (scopedRootsConfigured) args.push('--automation-read-root', temp, '--automation-write-root', temp);
if (acceptance === 'pdfcraft') args.push('--root', temp);
if (acceptance === 'lightcraft') args.push('--library', temp);
const child = spawn(binary, args, { shell: false, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
let stdout = '';
let stderr = '';
let buffer = '';
let nextId = 1;
const pending = new Map();
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  if (Buffer.byteLength(buffer, 'utf8') > 2 * 1024 * 1024) {
    failAll(new Error('MCP stdout exceeded 2 MB without a complete response.'));
    child.kill();
    return;
  }
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    stdout += line + '\n';
    let message;
    try { message = JSON.parse(line); } catch { continue; }
    if (typeof message.id !== 'number') continue;
    const waiter = pending.get(message.id);
    if (!waiter) continue;
    pending.delete(message.id);
    clearTimeout(waiter.timer);
    if (message.error) waiter.reject(new Error(message.error.message || 'MCP request failed.'));
    else waiter.resolve(message.result || {});
  }
});
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-8000); });
child.on('error', (error) => failAll(error));
child.on('exit', (code, signal) => failAll(new Error('MCP CLI exited before smoke test completed (code ' + code + ', signal ' + signal + ').\n' + stderr)));
function failAll(error) {
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(error); }
  pending.clear();
}
function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Timed out waiting for ' + method + '.\n' + stderr)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n', (error) => {
      if (!error) return;
      const waiter = pending.get(id);
      if (waiter) { pending.delete(id); clearTimeout(waiter.timer); reject(error); }
    });
  });
}
try {
  const init = await request('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'craft-workspace-ci-smoke', version: '1.0.0' },
  });
  if (!init.serverInfo || !init.capabilities) throw new Error('MCP initialize response omitted serverInfo/capabilities.');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const catalog = await request('tools/list', {});
  if (!Array.isArray(catalog.tools) || catalog.tools.length === 0) throw new Error('MCP tools/list returned no tools.');
  let readOnlyToolCall = 'skipped: no zero-argument read-only tool was advertised';
  const safeTool = catalog.tools.find((tool) => tool && typeof tool.name === 'string' && tool.annotations?.readOnlyHint === true && (!Array.isArray(tool.inputSchema?.required) || tool.inputSchema.required.length === 0));
  if (safeTool) {
    const call = await request('tools/call', { name: safeTool.name, arguments: {} });
    if (call.isError === true) throw new Error('Read-only MCP tool call failed: ' + safeTool.name);
    readOnlyToolCall = safeTool.name;
  }
  let acceptanceResult = null;
  if (acceptance) {
    const callTool = async (name, args) => {
      if (!catalog.tools.some((tool) => tool && tool.name === name)) throw new Error('Acceptance scenario requires MCP tool ' + name + '.');
      const result = await request('tools/call', { name, arguments: args });
      if (result.isError === true) throw new Error('Acceptance tool call failed: ' + name + ' ' + JSON.stringify(result.content || []));
      return (result.content || []).map((item) => typeof item.text === 'string' ? item.text : '').join('\\n');
    };
    if (acceptance === 'wordcraft') {
      const marker = 'Creative Jess WordCraft acceptance ' + Date.now();
      await callTool('new_document', { template: 'blank' });
      await callTool('type_text', { text: marker });
      const readBack = await callTool('get_text', {});
      if (!readBack.includes(marker)) throw new Error('WordCraft acceptance failed: typed text was not returned by get_text.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.md');
      await callTool('save_document', { path: outputPath });
      const savedText = await readFile(outputPath, 'utf8');
      if (!savedText.includes(marker)) throw new Error('WordCraft acceptance failed: saved Markdown does not contain the typed text.');
      acceptanceResult = { scenario: 'wordcraft-create-type-read-save-markdown', verified: true, outputFormat: 'md', outputInsideTemporaryDirectory: true };
    } else if (acceptance === 'gridcraft') {
      const marker = 'CreativeJessGridAcceptance' + Date.now();
      await callTool('new_workbook', {});
      await callTool('write_range', { range: 'A1', values: [[marker]] });
      const readBack = await callTool('get_cell', { cell: 'A1' });
      if (!readBack.includes(marker)) throw new Error('GridCraft acceptance failed: cell A1 did not return the written marker.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.csv');
      await callTool('save_workbook', { path: outputPath });
      const savedText = await readFile(outputPath, 'utf8');
      if (!savedText.includes(marker)) throw new Error('GridCraft acceptance failed: saved CSV does not contain the cell marker.');
      acceptanceResult = { scenario: 'gridcraft-create-write-read-save-csv', verified: true, outputFormat: 'csv', outputInsideTemporaryDirectory: true };
    } else if (acceptance === 'photocraft') {
      const outputName = 'creative-jess-acceptance.png';
      await callTool('doc_new', { width: 128, height: 96, mode: 'rgb', depth: 8, background: 'white', name: 'Creative Jess CI acceptance' });
      const inspection = await callTool('doc_inspect', {});
      if (!inspection || inspection.includes('"document":null')) throw new Error('PhotoCraft acceptance failed: no active document was created.');
      await callTool('doc_export', { path: outputName });
      const savedBytes = await readFile(path.join(temp, outputName));
      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      if (savedBytes.length < 64 || !pngSignature.every((byte, index) => savedBytes[index] === byte)) {
        throw new Error('PhotoCraft acceptance failed: exported PNG signature or file size is invalid.');
      }
      acceptanceResult = { scenario: 'photocraft-create-inspect-export-png', verified: true, outputFormat: 'png', outputInsideTemporaryDirectory: true, outputBytes: savedBytes.length };
    } else if (acceptance === 'pdfcraft') {
      const stream = 'BT /F1 12 Tf 30 150 Td (CreativeJessPdfAcceptance) Tj ET\n';
      const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        '5 0 obj\n<< /Length ' + Buffer.byteLength(stream, 'utf8') + ' >>\nstream\n' + stream + 'endstream\nendobj\n',
      ];
      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      for (const object of objects) { offsets.push(Buffer.byteLength(pdf, 'utf8')); pdf += object; }
      const xrefOffset = Buffer.byteLength(pdf, 'utf8');
      pdf += 'xref\n0 6\n0000000000 65535 f \n' + offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n').join('');
      pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
      await writeFile(path.join(temp, 'acceptance-input.pdf'), pdf, 'utf8');
      const opened = await callTool('doc_open', { path: 'acceptance-input.pdf' });
      const docMatch = opened.match(/"doc"\s*:\s*(\d+)/);
      if (!docMatch) throw new Error('PDFCraft acceptance failed: doc_open did not return a document id: ' + opened.slice(0, 500));
      const docId = Number(docMatch[1]);
      await callTool('page_rotate', { doc: docId, degrees: 90 });
      await callTool('doc_save', { doc: docId, path: 'acceptance-output.pdf', full: true });
      const savedPdf = await readFile(path.join(temp, 'acceptance-output.pdf'));
      if (savedPdf.length < 100 || savedPdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new Error('PDFCraft acceptance failed: saved PDF header or file size is invalid.');
      }
      acceptanceResult = { scenario: 'pdfcraft-open-rotate-save-pdf', verified: true, outputFormat: 'pdf', outputInsideTemporaryDirectory: true, outputBytes: savedPdf.length };
    } else if (acceptance === 'vectorcraft') {
      const outputName = 'creative-jess-acceptance.svg';
      const outputPath = path.join(temp, outputName);
      await callTool('run_command', { command: 'file.new', params: { width: 320, height: 240 } });
      await callTool('draw_shape', { shape: 'rectangle', x: 24, y: 28, width: 120, height: 72, fill: '#ff0000', stroke: 'none' });
      const inspection = await callTool('inspect_document', { depth: 1, childLimit: 20 });
      if (!inspection || !inspection.toLowerCase().includes('rectangle')) throw new Error('VectorCraft acceptance failed: document inspection did not show the created rectangle.');
      await callTool('export', { path: outputPath, format: 'svg' });
      const savedSvg = await readFile(outputPath, 'utf8');
      if (!savedSvg.includes('<svg') || savedSvg.length < 100) throw new Error('VectorCraft acceptance failed: exported SVG is missing or malformed.');
      acceptanceResult = { scenario: 'vectorcraft-create-draw-inspect-export-svg', verified: true, outputFormat: 'svg', outputInsideTemporaryDirectory: true, outputCharacters: savedSvg.length };
    } else if (acceptance === 'deckcraft') {
      const marker = 'Creative Jess DeckCraft acceptance ' + Date.now();
      await callTool('new_presentation', {});
      await callTool('add_text_box', { x: 40, y: 90, w: 600, h: 100, text: marker });
      const slide = await callTool('inspect_slide', { index: 0 });
      if (!slide.includes(marker)) throw new Error('DeckCraft acceptance failed: slide inspection did not return the inserted text.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.pptx');
      await callTool('export', { path: outputPath, format: 'pptx' });
      const savedBytes = await readFile(outputPath);
      if (savedBytes.length < 100 || savedBytes[0] !== 0x50 || savedBytes[1] !== 0x4b) {
        throw new Error('DeckCraft acceptance failed: exported PPTX is missing or does not have a ZIP/PPTX signature.');
      }
      acceptanceResult = { scenario: 'deckcraft-create-add-text-inspect-export-pptx', verified: true, outputFormat: 'pptx', outputInsideTemporaryDirectory: true, outputBytes: savedBytes.length };
    } else if (acceptance === 'designcraft') {
      const marker = 'CreativeJessDesignAcceptance' + Date.now();
      await callTool('new_document', { width: 612, height: 792, pages: 1, title: 'Creative Jess acceptance' });
      await callTool('execute', { command: 'frame.create', params: { rect: [36, 36, 576, 180], content: 'text', text: marker } });
      const inspection = await callTool('inspect_document', {});
      if (!inspection.includes(marker)) throw new Error('DesignCraft acceptance failed: document inspection did not include the inserted text.');
      const nativePath = path.join(temp, 'creative-jess-acceptance.designcraft');
      await callTool('save_document', { path: nativePath });
      const nativeBytes = await readFile(nativePath);
      if (nativeBytes.length < 100) throw new Error('DesignCraft acceptance failed: native document was not saved.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.png');
      await callTool('export_png', { path: outputPath, page: 0, scale: 1 });
      const savedBytes = await readFile(outputPath);
      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      if (savedBytes.length < 64 || !pngSignature.every((byte, index) => savedBytes[index] === byte)) throw new Error('DesignCraft acceptance failed: exported PNG signature or file size is invalid.');
      acceptanceResult = { scenario: 'designcraft-create-text-inspect-save-export-png', verified: true, nativeBytes: nativeBytes.length, outputFormat: 'png', outputInsideTemporaryDirectory: true, outputBytes: savedBytes.length };
    } else if (acceptance === 'lightcraft') {
      const inputPath = path.join(temp, 'creative-jess-source.bmp');
      const bmp = Buffer.alloc(70);
      bmp.write('BM', 0, 'ascii');
      bmp.writeUInt32LE(70, 2);
      bmp.writeUInt32LE(54, 10);
      bmp.writeUInt32LE(40, 14);
      bmp.writeInt32LE(2, 18);
      bmp.writeInt32LE(2, 22);
      bmp.writeUInt16LE(1, 26);
      bmp.writeUInt16LE(24, 28);
      bmp.writeUInt32LE(16, 34);
      bmp.writeUInt32LE(2835, 38);
      bmp.writeUInt32LE(2835, 42);
      bmp.set([0, 0, 255, 0, 255, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0], 54);
      await writeFile(inputPath, bmp);
      await callTool('import', { paths: [inputPath], mode: 'add' });
      const library = await callTool('query_photos', { limit: 20 });
      if (!library.toLowerCase().includes('creative-jess-source.bmp')) throw new Error('LightCraft acceptance failed: imported BMP was not found in the photo catalog.');
      await callTool('set_develop', { values: { 'light.exposure': 0.7 } });
      const outputPath = path.join(temp, 'creative-jess-acceptance.png');
      await callTool('export', { path: outputPath });
      const savedBytes = await readFile(outputPath);
      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      if (savedBytes.length < 64 || !pngSignature.every((byte, index) => savedBytes[index] === byte)) throw new Error('LightCraft acceptance failed: exported PNG signature or file size is invalid.');
      acceptanceResult = { scenario: 'lightcraft-import-develop-export-png', verified: true, outputFormat: 'png', outputInsideTemporaryDirectory: true, outputBytes: savedBytes.length };
    } else if (acceptance === 'effectcraft') {
      const marker = 'CreativeJessEffectAcceptance' + Date.now();
      await callTool('open_project', { new: true });
      await callTool('execute_command', { command: 'comp.new', params: { name: 'Acceptance Comp', width: 320, height: 240, frameRate: 24, duration: 2 } });
      await callTool('execute_command', { command: 'layer.newText', params: { text: marker, size: 36, fill: '#ffffff' } });
      const project = await callTool('get_project', {});
      const composition = await callTool('get_comp', { comp: 'Acceptance Comp' });
      if (!project.includes('Acceptance Comp') || !composition.includes(marker)) throw new Error('EffectCraft acceptance failed: project/composition inspection did not include the composition and text layer.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.ecproj');
      await callTool('save_project', { path: outputPath });
      const savedText = await readFile(outputPath, 'utf8');
      if (savedText.length < 100) throw new Error('EffectCraft acceptance failed: saved project is missing or unexpectedly small.');
      acceptanceResult = { scenario: 'effectcraft-create-comp-add-text-inspect-save-project', verified: true, outputFormat: 'ecproj', outputInsideTemporaryDirectory: true, outputCharacters: savedText.length };
    } else if (acceptance === 'soundcraft') {
      const marker = 'CreativeJessSoundAcceptance' + Date.now();
      await callTool('new_session', { name: marker, sample_rate: 48000, template: 'blank' });
      const inspection = await callTool('inspect_session', { detail: 'summary' });
      if (!inspection.includes(marker)) throw new Error('SoundCraft acceptance failed: new session name was not returned by inspect_session.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.scraft');
      await callTool('save_session', { path: outputPath });
      const savedBytes = await readFile(outputPath);
      if (savedBytes.length < 16) throw new Error('SoundCraft acceptance failed: saved session is missing or unexpectedly small.');
      acceptanceResult = { scenario: 'soundcraft-create-inspect-save-session', verified: true, outputFormat: 'scraft', outputInsideTemporaryDirectory: true, outputBytes: savedBytes.length };
    } else if (acceptance === 'cadcraft') {
      await callTool('new_drawing', { metric: true });
      await callTool('execute', { command: 'circle', params: { center: [0, 0], radius: 5 } });
      const inspection = await callTool('inspect_drawing', { entities: true, limit: 50 });
      if (!inspection.toLowerCase().includes('circle')) throw new Error('CADCraft acceptance failed: created circle was not found in drawing inspection.');
      const outputPath = path.join(temp, 'creative-jess-acceptance.dxf');
      await callTool('save', { path: outputPath });
      const savedText = await readFile(outputPath, 'utf8');
      if (savedText.length < 100 || !savedText.includes('SECTION')) throw new Error('CADCraft acceptance failed: exported DXF is missing expected structure.');
      acceptanceResult = { scenario: 'cadcraft-create-circle-inspect-save-dxf', verified: true, outputFormat: 'dxf', outputInsideTemporaryDirectory: true, outputCharacters: savedText.length };
    } else {
      throw new Error('Unsupported acceptance scenario: ' + acceptance);
    }
  }
  console.log(JSON.stringify({ ok: true, serverInfo: init.serverInfo, protocolVersion: init.protocolVersion, toolCount: catalog.tools.length, firstTools: catalog.tools.slice(0, 8).map((tool) => tool.name), readOnlyToolCall, scopedRootFlagsPassed: scopedRootsConfigured, acceptance: acceptanceResult }));
  child.stdin.end();
  child.kill();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error), stdout: stdout.slice(-3000), stderr }));
  child.kill();
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => setTimeout(resolve, 100));
  await rm(temp, { recursive: true, force: true });
}
