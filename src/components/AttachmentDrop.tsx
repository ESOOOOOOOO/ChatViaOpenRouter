import React from 'react';
import { Attachments } from '@ant-design/x';
import { Button } from 'antd';
import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons';
import { emit } from '@tauri-apps/api/event';
import {
  isTextableByNameOrMime,
  readAsText,
  readAsDataURL,
  readAsArrayBuffer,
  arrayBufferToBase64,
} from './../utils/files';

import {
  SUPPORTED_IMAGE_MIME,
  SUPPORTED_PDF_MIME,
  SUPPORTED_AUDIO_MIME,
  SUPPORTED_OFFICE_EXT,
  guessAudioFormat,
} from './../constants/mime';

// ✅ Office 解析依赖（与 ChatSender 对齐）
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// 动态引入 pptx 解析器（可用则解析，不可用则降级）
let parsePptxFn: ((data: ArrayBuffer | Uint8Array) => Promise<any>) | null = null;
(async () => {
  try {
    const mod: any = await import('pptx-parser');
    parsePptxFn = (mod.parsePptx || mod.default || mod.parse) ?? null;
  } catch {
    parsePptxFn = null;
  }
})();

interface AttachmentDropProps {
  onBeforeHandle?: () => Promise<void> | void; // 处理前（例如展示聊天窗）
}

// ====== 辅助：扩展名与 Office 解析 ======
const getFileExt = (name?: string) => {
  const lower = (name || '').toLowerCase();
  const i = lower.lastIndexOf('.');
  return i >= 0 ? lower.slice(i) : '';
};

const extractTextFromDocx = async (ab: ArrayBuffer): Promise<string> => {
  const { value } = await mammoth.extractRawText({ arrayBuffer: ab });
  return value || '';
};

const extractTextFromXlsx = async (ab: ArrayBuffer, filename: string): Promise<string> => {
  const wb = XLSX.read(ab, { type: 'array' });
  const lines: string[] = [];
  lines.push(`### FILE: ${filename}`);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const tsv = XLSX.utils.sheet_to_csv(ws, { FS: '\t', RS: '\n', strip: false, blankrows: true });
    lines.push(`\n## Sheet: ${sheetName}\n`);
    lines.push(tsv.trim());
  }
  return lines.join('\n');
};

const extractTextFromPptx = async (ab: ArrayBuffer, filename: string): Promise<string> => {
  if (!parsePptxFn) {
    return `/* PPTX parser unavailable. Filename: ${filename}. Install/verify 'pptx-parser' and restart. */`;
  }
  try {
    const u8 = new Uint8Array(ab);
    const deck: any = await parsePptxFn(u8);
    const slides = deck?.slides || deck?.slideList || deck || [];
    const lines: string[] = [];
    lines.push(`### FILE: ${filename}`);
    slides.forEach((s: any, idx: number) => {
      lines.push(`\n## Slide ${idx + 1}\n`);
      const bucket: string[] = [];
      if (Array.isArray(s?.texts)) bucket.push(...s.texts.filter(Boolean));
      if (Array.isArray(s?.content)) {
        for (const c of s.content) {
          if (typeof c === 'string') bucket.push(c);
          else if (c?.text) bucket.push(c.text);
          else if (Array.isArray(c?.runs)) bucket.push(c.runs.map((r: any) => r?.text || '').join(''));
        }
      }
      if (Array.isArray(s?.shapes)) {
        for (const shape of s.shapes) {
          if (shape?.text) bucket.push(shape.text);
          if (Array.isArray(shape?.paragraphs)) {
            for (const p of shape.paragraphs) {
              if (typeof p === 'string') bucket.push(p);
              else if (Array.isArray(p?.runs)) bucket.push(p.runs.map((r: any) => r?.text || '').join(''));
            }
          }
        }
      }
      if (s?.notes?.text) bucket.push(`(Notes) ${s.notes.text}`);
      const text = bucket.join('\n').trim();
      lines.push(text || '(No visible text on this slide)');
    });
    return lines.join('\n');
  } catch (e) {
    return `/* Failed to parse PPTX content. Filename: ${filename}. Error: ${(e as Error)?.message || e} */`;
  }
};

const AttachmentDrop: React.FC<AttachmentDropProps> = ({ onBeforeHandle }) => {
  return (
    <Attachments
      beforeUpload={() => false}
      onChange={async ({ file }) => {
        try {
          await onBeforeHandle?.();

          const raw: Blob | undefined = (file as any)?.originFileObj || (file as any);
          const mime = (file?.type || (raw as any)?.type || '').toLowerCase();
          const ext = getFileExt(file?.name);

          let encodedMeta: any | null = null;

          if (SUPPORTED_IMAGE_MIME.has(mime)) {
            // 图片 -> image_url
            const dataUrl = await readAsDataURL(raw!);
            encodedMeta = {
              kind: 'image',
              payload: { type: 'image_url', image_url: { url: dataUrl } },
            };

          } else if (SUPPORTED_PDF_MIME.has(mime)) {
            // PDF -> file (dataUrl)
            const dataUrl = await readAsDataURL(raw!);
            encodedMeta = {
              kind: 'pdf',
              payload: {
                type: 'file',
                file: { filename: file?.name || 'document.pdf', file_data: dataUrl },
              },
            };

          } else if (SUPPORTED_AUDIO_MIME.has(mime)) {
            // 音频 -> input_audio(base64)
            const ab = await readAsArrayBuffer(raw!);
            const b64 = arrayBufferToBase64(ab);
            const format = guessAudioFormat(file?.name || '');
            encodedMeta = {
              kind: 'audio',
              payload: { type: 'input_audio', input_audio: { data: b64, format } },
            };

          } else if (SUPPORTED_OFFICE_EXT.has(ext) || /wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation/i.test(mime)) {
            // ✅ Office（docx/xlsx/pptx）→ 提取文本，发 textable
            const ab = await readAsArrayBuffer(raw!);
            let textContent = '';
            if (ext === '.docx' || /wordprocessingml\.document/i.test(mime)) {
              textContent = await extractTextFromDocx(ab);
            } else if (ext === '.xlsx' || /spreadsheetml\.sheet/i.test(mime)) {
              textContent = await extractTextFromXlsx(ab, file?.name || 'workbook.xlsx');
            } else if (ext === '.pptx' || /presentationml\.presentation/i.test(mime)) {
              textContent = await extractTextFromPptx(ab, file?.name || 'slides.pptx');
            }

            const header = `${file?.name || 'office-file'}`;
            const body = (textContent || '').trim();
            encodedMeta = {
              kind: 'textable',
              payload: { type: 'text', text: `${header}\n${body}` },
            };

          } else if (isTextableByNameOrMime(file?.name, mime)) {
            // 其他文本/代码/配置
            const textContent = await readAsText(raw!);
            encodedMeta = {
              kind: 'textable',
              payload: {
                type: 'text',
                text: `${file?.name || 'file'}\n${textContent}`,
              },
            };
          } else {
            // 不支持则静默返回
            return;
          }

          await emit('attach-from-main', {
            name: file?.name || 'file',
            type: mime,
            encodedMeta,
          });
        } catch (e) {
          console.error('forward file to chat error:', e);
        }
      }}
      getDropContainer={() => document.body}
      placeholder={{ icon: <CloudUploadOutlined /> }}
    >
      <Button type="text" icon={<LinkOutlined />} />
    </Attachments>
  );
};

export default AttachmentDrop;
