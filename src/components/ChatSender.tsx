import React from 'react';
import { Sender, Attachments, type AttachmentsProps } from '@ant-design/x';
import { Button, Divider, Flex, Popover, Switch, theme, GetProp, message, Upload, Badge } from 'antd';
import { CloudUploadOutlined, ClearOutlined, HistoryOutlined, LinkOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import HistoryList from '../components/HistoryList';
import { Conversation } from '../DTOs/Conversation.dto';
import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { SystemLanguageDto } from '../DTOs/systemLanguage.dto';


// ✅ 新增依赖：DOCX/XLSX/PPTX 解析
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
// 对于 pptx-parser，不同版本导出可能不同；这里优先尝试命名导出 parsePptx，失败则尝试 default。
let parsePptxFn: ((data: ArrayBuffer | Uint8Array) => Promise<any>) | null = null;
(async () => {
  try {
    const mod: any = await import('pptx-parser');
    parsePptxFn = (mod.parsePptx || mod.default || mod.parse) ?? null;
  } catch (e) {
    // 延迟加载失败时保留 null，稍后调用时做降级
    parsePptxFn = null;
  }
})();

export interface ChatSenderProps {
  senderRef: React.Ref<any>;
  senderDropRef: React.RefObject<HTMLDivElement>;
  isDraggingOverSender: boolean;
  files: GetProp<AttachmentsProps, 'items'>;
  setFiles: React.Dispatch<React.SetStateAction<GetProp<AttachmentsProps, 'items'>>>;
  inputValue: string;
  setInputValue: (v: string) => void;
  loading: boolean;
  onSubmit: () => boolean;
  onClear: () => void;
  goOnline: boolean;
  setGoOnline: (v: boolean) => void;
  conversations: Conversation[];
  onDeleteConversation: (conversationTime: number) => Promise<void>;
  onSelectConversation: (c: Conversation) => void;
  isActive: boolean
  supportedFeature: string[]
  expanded: boolean
  headerOpen: boolean;
  setHeaderOpen: (v: boolean) => void;
  pined: boolean;
  setPined: (v: boolean) => void;
  language: SystemLanguageDto

  supportedMimes: {
    image: string[];
    pdf: string[];
    audio: string[];
    textableExts: string[];
  };
  guessAudioFormat: (filename: string) => string;
}

type FileItem = UploadFile & {
  encodedMeta?: {
    kind: 'image' | 'pdf' | 'audio' | 'textable';
    payload:
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
      | { type: 'file'; file: { filename: string; file_data: string } }
      | { type: 'input_audio'; input_audio: { data: string; format: string } };
  };
};

const readAsPlainText = async (file: Blob, filePath?: string) => {
  if (filePath) {
    try {
      const content = await readTextFile(filePath);
      return content;
    } catch (e) {
      console.warn('readTextFile failed, fallback to FileReader:', e);
    }
  }
  return await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(String(fr.result));
    fr.readAsText(file);
  });
};

const getFileExt = (name?: string) => {
  const lower = (name || '').toLowerCase();
  const i = lower.lastIndexOf('.');
  return i >= 0 ? lower.slice(i) : '';
};

// ====== 文件编码工具 ======
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const readAsDataURL = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(String(fr.result));
    fr.readAsDataURL(file);
  });

const readAsArrayBuffer = (file: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.readAsArrayBuffer(file);
  });

// ====== Office 解析器 ======
const extractTextFromDocx = async (ab: ArrayBuffer): Promise<string> => {
  // 直接用 mammoth 提取“纯文本”
  const { value } = await mammoth.extractRawText({ arrayBuffer: ab });
  return value || '';
};

const extractTextFromXlsx = async (ab: ArrayBuffer, filename: string): Promise<string> => {
  const wb = XLSX.read(ab, { type: 'array' });
  const lines: string[] = [];
  lines.push(`### FILE: ${filename}`);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    // 使用 TSV（tab 分隔），便于模型阅读；保留空单元格
    const tsv = XLSX.utils.sheet_to_csv(ws, { FS: '\t', RS: '\n', strip: false, blankrows: true });
    lines.push(`\n## Sheet: ${sheetName}\n`);
    lines.push(tsv.trim());
  }
  return lines.join('\n');
};

const extractTextFromPptx = async (ab: ArrayBuffer, filename: string): Promise<string> => {
  if (!parsePptxFn) {
    // 没有成功加载解析器时，降级
    return `/* PPTX parser unavailable. Filename: ${filename}. You may install/verify 'pptx-parser' and restart. */`;
  }
  try {
    const u8 = new Uint8Array(ab);
    const deck: any = await parsePptxFn(u8);
    // 不同库的结构不同：尽量兼容 slides/slideList 等字段
    const slides = deck?.slides || deck?.slideList || deck || [];
    const lines: string[] = [];
    lines.push(`### FILE: ${filename}`);
    slides.forEach((s: any, idx: number) => {
      lines.push(`\n## Slide ${idx + 1}\n`);
      // 常见结构：s.texts / s.content / s.shapes[].text / s.notes?.text
      const bucket: string[] = [];

      if (Array.isArray(s?.texts)) {
        bucket.push(...s.texts.filter(Boolean));
      }
      if (Array.isArray(s?.content)) {
        for (const c of s.content) {
          if (typeof c === 'string') bucket.push(c);
          else if (c?.text) bucket.push(c.text);
          else if (Array.isArray(c?.runs)) {
            bucket.push(c.runs.map((r: any) => r?.text || '').join(''));
          }
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
    console.error('pptx parse error:', e);
    return `/* Failed to parse PPTX content. Filename: ${filename}. Error: ${(e as Error)?.message || e} */`;
  }
};

const ChatSender: React.FC<ChatSenderProps> = ({
  senderRef,
  senderDropRef,
  isDraggingOverSender,
  files,
  setFiles,
  inputValue,
  setInputValue,
  loading,
  onSubmit,
  onClear,
  goOnline,
  setGoOnline,
  conversations,
  onDeleteConversation,
  onSelectConversation,
  isActive,

  headerOpen,
  setHeaderOpen,
  pined,
  setPined,
  expanded,
  supportedMimes,
  guessAudioFormat,
  supportedFeature,
  language
}) => {
  const { token } = theme.useToken();
  const [historyPopoverOpen, setHistoryPopoverOpen] = React.useState(false);

  const dropAreaRef = React.useRef<HTMLDivElement>(null);

  const headerOpenRef = React.useRef(headerOpen);
  const pinedRef = React.useRef(pined);
  React.useEffect(() => { headerOpenRef.current = headerOpen; }, [headerOpen]);
  React.useEffect(() => { pinedRef.current = pined; }, [pined]);

  const pinedBeforeOpenRef = React.useRef<boolean>(pined);
  const didForcePinRef = React.useRef<boolean>(false);

  const restorePin = React.useCallback(() => {
    const next = pinedBeforeOpenRef.current;
    setPined(next);
    emit('setPined', { pined: next });
    didForcePinRef.current = false;
  }, [setPined]);

  const closeHeader = React.useCallback(() => {
    if (!headerOpenRef.current) return;
    setHeaderOpen(false);
    restorePin();
  }, [setHeaderOpen, restorePin]);

  const handleHeaderOpenChange = (open: boolean) => {
    setHeaderOpen(open);
    if (open) {
      pinedBeforeOpenRef.current = pinedRef.current;
    } else {
      restorePin();
    }
  };

  const isSupported = (file: RcFile) => {
    const t = (file.type || '').toLowerCase();
    if (supportedMimes.image.includes(t)) return 'image' as const;
    if (supportedMimes.pdf.includes(t)) return 'pdf' as const;
    if (supportedMimes.audio.includes(t)) return 'audio' as const;

    // textable：扩展名或 text/* MIME
    const extSet = new Set(supportedMimes.textableExts.map(s => s.toLowerCase()));
    const ext = getFileExt(file.name);
    if (extSet.has(ext) || t.startsWith('text/')) return 'textable' as const;

    // ✅ 附加：Office MIME（有些系统拖入时会带 MIME，不靠扩展名也能识别）
    const officeMimes = new Set([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    ]);
    if (officeMimes.has(t)) return 'textable' as const;

    return null;
  };

  const encodeAndAttach = async (rawFile: RcFile, draftItem: FileItem) => {
    const kind = isSupported(rawFile);
    if (!kind) {
      message.error('Unsupported file type');
      return { accepted: false };
    }

    setFiles(prev => prev.map((it: any) => (it.uid === draftItem.uid ? { ...it, status: 'uploading' } : it)));

    try {
      if (kind === 'image') {
        const dataUrl = await readAsDataURL(rawFile);
        const payload = { type: 'image_url', image_url: { url: dataUrl } } as const;
        setFiles(prev => prev.map((it: any) =>
          it.uid === draftItem.uid ? { ...it, status: 'done', encodedMeta: { kind, payload } } : it
        ));
      } else if (kind === 'pdf') {
        const dataUrl = await readAsDataURL(rawFile);
        const payload = { type: 'file', file: { filename: rawFile.name || 'document.pdf', file_data: dataUrl } } as const;
        setFiles(prev => prev.map((it: any) =>
          it.uid === draftItem.uid ? { ...it, status: 'done', encodedMeta: { kind, payload } } : it
        ));
      } else if (kind === 'audio') {
        const ab = await readAsArrayBuffer(rawFile);
        const b64 = arrayBufferToBase64(ab);
        const format = guessAudioFormat(rawFile.name || '');
        const payload = { type: 'input_audio', input_audio: { data: b64, format } } as const;
        setFiles(prev => prev.map((it: any) =>
          it.uid === draftItem.uid ? { ...it, status: 'done', encodedMeta: { kind, payload } } : it
        ));
      } else if (kind === 'textable') {
        // —— 关键：根据扩展名/ MIME 做 Office 解析 —— //
        const ext = getFileExt(rawFile.name);
        const mime = (rawFile.type || '').toLowerCase();
        const isDocx = ext === '.docx' || mime.includes('wordprocessingml.document');
        const isXlsx = ext === '.xlsx' || mime.includes('spreadsheetml.sheet');
        const isPptx = ext === '.pptx' || mime.includes('presentationml.presentation');

        let textContent = '';
        if (isDocx || isXlsx || isPptx) {
          // 对 Office 文件先读 ArrayBuffer
          const ab = await readAsArrayBuffer(rawFile);
          if (isDocx) {
            textContent = await extractTextFromDocx(ab);
            console.log("docx text:", textContent);
          } else if (isXlsx) {
            textContent = await extractTextFromXlsx(ab, rawFile.name || 'workbook.xlsx');
          } else if (isPptx) {
            textContent = await extractTextFromPptx(ab, rawFile.name || 'slides.pptx');
          }
        } else {
          // 普通 textable：按纯文本读取
          const filePath: string | undefined =
            (rawFile as any).path ||
            (rawFile as any).webkitRelativePath ||
            undefined;
          textContent = await readAsPlainText(rawFile, filePath);
        }

        const header = `/*** ${rawFile.name} ***/`;
        const body = (textContent || '').trim();
        const payload = { type: 'text', text: `${header}\n${body}` } as const;

        setFiles(prev => prev.map((it: any) =>
          it.uid === draftItem.uid ? { ...it, status: 'done', encodedMeta: { kind: 'textable', payload } } : it
        ));
      }

      return { accepted: true };
    } catch (err) {
      console.error('encode file error:', err);
      message.error('文件编码失败');
      setFiles(prev => prev.map((it: any) => (it.uid === draftItem.uid ? { ...it, status: 'error' } : it)));
      return { accepted: false };
    }
  };

  const handleBeforeUpload: GetProp<AttachmentsProps, 'beforeUpload'> = async (file) => {
    const f = file as RcFile;
    const support = isSupported(f);
    if (!support) {
      message.error('Unsupported file type');
      return Upload.LIST_IGNORE;
    }

    const draftItem: FileItem = {
      uid: f.uid,
      name: f.name,
      status: 'uploading',
      type: f.type,
      originFileObj: f,
    };

    setFiles((prev: any) => ([...prev, draftItem]));
    encodeAndAttach(f, draftItem);
    return false;
  };

  const headerNode = (
    <Sender.Header
      title="Attachments"
      open={headerOpen}
      onOpenChange={handleHeaderOpenChange}
      className="chat-dock-attachments-header"
    >
      <Flex vertical align="center" gap="small" style={{ marginBlock: token.paddingXXS }}>
        <div ref={dropAreaRef} style={{ width: '100%' }}>
          <Attachments
            beforeUpload={handleBeforeUpload}
            items={files}
            onChange={({ fileList }) => setFiles(fileList)}
            placeholder={(type) =>
              type === 'drop'
                ? { title: 'Drop file here' }
                : { icon: <CloudUploadOutlined />, title: 'Upload files', description: 'Click and choose files to upload' }
            }
            getDropContainer={() => (headerOpen ? dropAreaRef.current! : undefined)}
            style={{ backdropFilter: 'none', background: 'transparent', borderRadius: 12 }}
            styles={{ list: { background: 'transparent' } }}
          />
        </div>
      </Flex>
    </Sender.Header>
  );

  const handleSubmitAndMaybeClose = React.useCallback(() => {
    const ok = onSubmit();
    if (ok && headerOpenRef.current) {
      closeHeader();
    }
  }, [onSubmit, closeHeader]);

  React.useEffect(() => {
    let isActive = true;
    let storedUnlisten: UnlistenFn | null = null;

    const register = async () => {
      const un = await listen('attach-from-main', (event) => {
        const incoming = event?.payload as {
          name?: string;
          type?: string;
          encodedMeta?: FileItem['encodedMeta'];
        };
        if (!incoming || !incoming.encodedMeta) return;

        const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newItem: FileItem = {
          uid,
          name: incoming.name || 'file',
          status: 'done',
          type: incoming.type || '',
          encodedMeta: incoming.encodedMeta,
        };

        setFiles((prev: any) => [...prev, newItem]);

        if (!headerOpenRef.current) {
          pinedBeforeOpenRef.current = pinedRef.current;
          setHeaderOpen(true);

          if (!pinedRef.current) {
            setPined(true);
            emit('setPined', { pined: true });
            didForcePinRef.current = true;
          } else {
            didForcePinRef.current = false;
          }
        }
      });

      if (!isActive) {
        un();
      } else {
        storedUnlisten = un;
      }
    };

    register();

    return () => {
      isActive = false;
      if (storedUnlisten) {
        storedUnlisten();
        storedUnlisten = null;
      }
    };
  }, [setFiles, setHeaderOpen, setPined]);

  return (
    <div
      ref={senderDropRef}
      className={`chat-sender-drop ${isDraggingOverSender ? 'drag-over' : ''}`}
      style={{ position: 'relative' }}
    >
      {isDraggingOverSender && (
        <div
          className="sender-drop-overlay"
          style={{
            position: 'absolute', inset: 0, borderRadius: 12,
            outline: '2px dashed #1677ff', outlineOffset: -6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', fontSize: 12, color: '#1677ff', background: 'rgba(22,119,255,0.06)',
            zIndex: 1,
          }}
        >
          松手添加到附件…
        </div>
      )}

      <div className="chat-input-container" style={{ position: 'relative', zIndex: 2 }}>
        <Sender
          disabled={!isActive}
          ref={senderRef}
          header={headerNode}
          value={inputValue}
          style={{ background: 'rgba(255, 255, 255, 0.55)', borderRadius: 12 }}
          placeholder={isActive ? language.enterToSubmit : language.verifyFirst}
          onSubmit={handleSubmitAndMaybeClose}
          onChange={setInputValue}
          actions={false}
          footer={({ components }) => {
            const { SendButton, LoadingButton } = components;
            return (
              <Flex justify="space-between" align="center">
                <Flex gap="small" align="center">
                  <Popover
                    content={
                      <HistoryList
                        expanded={expanded}
                        conversations={conversations}
                        onDelete={onDeleteConversation}
                        onSelect={onSelectConversation}
                      />
                    }
                    title={language.chatHistory}
                    trigger="click"
                    open={historyPopoverOpen}
                    classNames={{ root: 'history-popover' }}
                    onOpenChange={setHistoryPopoverOpen}
                  >
                    <Button disabled={!isActive} icon={<HistoryOutlined />} type="text" style={{ fontSize: 16, color: token.colorText }} />
                  </Popover>

                  <Badge dot={files.length != 0}>
                    <Button
                      disabled={!isActive || supportedFeature.length <= 1}
                      type="text"
                      icon={<LinkOutlined />}
                      onClick={() => {
                        if (!headerOpenRef.current) {
                          pinedBeforeOpenRef.current = pinedRef.current;
                          setHeaderOpen(true);

                          if (!pinedRef.current) {
                            setPined(true);
                            emit('setPined', { pined: true });
                            didForcePinRef.current = true;
                          } else {
                            didForcePinRef.current = false;
                          }
                        } else {
                          closeHeader();
                        }
                      }}
                      style={{ fontSize: 16, color: token.colorText }}
                    />
                  </Badge>

                  <Switch disabled={!isActive} size="small" checked={goOnline} onChange={setGoOnline} />
                  <p style={{ fontSize: 12, margin: 0 }}>{language.webSearch}</p>
                </Flex>

                <Flex align="center">
                  {loading ? null : (
                    <>
                      <Button disabled={!isActive} className="clear-chat-button" type="text" icon={<ClearOutlined />} onClick={onClear} title="清空聊天记录" />
                      <Divider type="vertical" />
                    </>
                  )}
                  {loading ? <LoadingButton type="default" disabled /> : <SendButton type="primary" disabled={!isActive} />}
                </Flex>
              </Flex>
            );
          }}
        />
      </div>
    </div>
  );
};

export default ChatSender;
