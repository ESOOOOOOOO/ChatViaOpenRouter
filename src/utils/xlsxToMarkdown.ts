// xlsxToText.ts
// 依赖：npm i xlsx
// 可选类型：npm i -D @types/xlsx
import * as XLSX from 'xlsx';

export type XlsxToTextOptions = {
  maxRowsPerSheet?: number;     // 每个 sheet 最多输出行（含表头）；0/Infinity 表示不截断
  includeComments?: boolean;    // 收集批注
  includeHyperlinks?: boolean;  // 内联超链接 [link: URL]
  includeSheetSummary?: boolean;// 在每个 sheet 前输出尺寸概览
};

const DEFAULT_OPTS: Required<XlsxToTextOptions> = {
  maxRowsPerSheet: 2000,
  includeComments: true,
  includeHyperlinks: true,
  includeSheetSummary: true,
};

/**
 * 核心入口：支持 File / ArrayBuffer / base64 字符串 / data URL
 */
export async function extractXlsxText(
  input: File | ArrayBuffer | string,
  options: XlsxToTextOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTS, ...options };
  const buf = await toArrayBuffer(input);

  const wb = XLSX.read(buf, {
    type: 'array',
    cellStyles: false,
    cellHTML: false,
    cellNF: false,
    cellText: false,
  });

  const chunks: string[] = [];
  chunks.push(`# XLSX 文本提取（SheetJS）
工作表数量：${wb.SheetNames.length}
——`);

  wb.SheetNames.forEach((sheetName, idx) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const ref = ws['!ref'];
    const range = ref ? XLSX.utils.decode_range(ref) : null;
    const rows = range ? range.e.r - range.s.r + 1 : 0;
    const cols = range ? range.e.c - range.s.c + 1 : 0;

    // AOA（二维数组）
    let aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as any[][];
    if (opts.maxRowsPerSheet && Number.isFinite(opts.maxRowsPerSheet) && opts.maxRowsPerSheet > 0) {
      if (aoa.length > opts.maxRowsPerSheet) {
        aoa = aoa.slice(0, opts.maxRowsPerSheet);
      }
    }

    // 收集超链接
    const hyperlinkMap = new Map<string, string>(); // key: "r,c" -> url
    if (opts.includeHyperlinks && ref) {
      const r = XLSX.utils.decode_range(ref);
      for (let R = r.s.r; R <= r.e.r; R++) {
        for (let C = r.s.c; C <= r.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = (ws as any)[addr];
          if (cell?.l?.Target) {
            hyperlinkMap.set(`${R},${C}`, String(cell.l.Target));
          }
        }
      }
    }

    // 生成 TSV
    const tsvRows: string[] = [];
    for (let r = 0; r < aoa.length; r++) {
      const row = aoa[r].map((v: any, c: number) => {
        const text = normalizeCellValue(v);
        const link = hyperlinkMap.get(`${r},${c}`);
        // 防止文本中原有 \t 破坏结构
        return (link ? `${text} [link: ${link}]` : text).replace(/\t/g, '  ');
      });
      tsvRows.push(row.join('\t'));
    }
    const tsv = tsvRows.join('\n');

    // 批注
    const comments: string[] = [];
    if (opts.includeComments && ref) {
      const rr = XLSX.utils.decode_range(ref);
      for (let R = rr.s.r; R <= rr.e.r; R++) {
        for (let C = rr.s.c; C <= rr.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = (ws as any)[addr];
          if (Array.isArray(cell?.c) && cell.c.length) {
            const label = `${sheetName}!${addr}`;
            for (const cmt of cell.c) {
              const who = cmt.a ? ` by ${cmt.a}` : '';
              const txt = String(cmt.t ?? cmt.v ?? '');
              comments.push(`- ${label}${who}: ${sanitizeText(txt)}`);
            }
          }
        }
      }
    }

    chunks.push(
      `## Sheet ${idx + 1}: ${sheetName}`,
      opts.includeSheetSummary ? `范围：${ref ?? 'N/A'}（约 ${rows} 行 × ${cols} 列）` : '',
      '',
      '### 数据（TSV）',
      '```tsv',
      tsv || '(空表)',
      '```',
      comments.length ? '\n### 批注\n' + comments.join('\n') : ''
    );
    chunks.push('——');
  });

  return sanitizeText(chunks.filter(Boolean).join('\n'));
}

/** ------------ 工具函数区 ------------ */

function normalizeCellValue(v: any): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return String(v);
  return sanitizeText(String(v));
}

function sanitizeText(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function isLikelyDataUrl(s: string): boolean {
  return /^data:.*;base64,/.test(s);
}

function isLikelyBase64(s: string): boolean {
  // 简单判断：仅 A-Z a-z 0-9 + / = 字符，且长度为 4 的倍数
  return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s+/g, '').length % 4 === 0;
}

/** 把各种输入统一转 ArrayBuffer（浏览器/Node 都可用） */
async function toArrayBuffer(input: File | ArrayBuffer | string): Promise<ArrayBuffer> {
  if (input instanceof ArrayBuffer) return input;

  // File / Blob（浏览器）
  if (typeof File !== 'undefined' && input instanceof File) {
    return await input.arrayBuffer();
  }

  if (typeof input === 'string') {
    let base64 = input.trim();

    // data URL → base64
    if (isLikelyDataUrl(base64)) {
      base64 = base64.split(',')[1] || '';
    }

    if (!isLikelyBase64(base64)) {
      throw new Error('Provided string is not a valid base64 or data URL');
    }

    const cleaned = base64.replace(/\s+/g, '');

    // 浏览器有 atob，Node 用 Buffer
    if (typeof atob === 'function') {
      const binaryStr = atob(cleaned);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
      return bytes.buffer;
    } else {
      // Node.js 环境
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const buf = Buffer.from(cleaned, 'base64');
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
  }

  throw new Error('Unsupported input type for extractXlsxText');
}
