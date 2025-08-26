import { useEffect, useState, useRef } from 'react';
import type { AttachmentsProps } from '@ant-design/x';
import type { GetProp } from 'antd';

export type FileItems = GetProp<AttachmentsProps, 'items'>;

// 新增：为 Hook 增加可选配置
type DragDropOptions = {
  headerOpen?: boolean;                // Header 是否打开
  onExternalDragEnter?: () => void;    // 外部拖入时的回调（用于自动打开 Header）
};

export function useSenderDragDrop(
  senderDropRef: React.RefObject<HTMLDivElement>,
  options: DragDropOptions = {}
) {
  const { headerOpen = false, onExternalDragEnter } = options;

  const [isDraggingOverSender, setIsDraggingOverSender] = useState(false);
  const [files, setFiles] = useState<FileItems>([]);
  const dragCounterRef = useRef(0);

  // A) 文档级：仅阻止默认，不设置 dropEffect；改为「捕获阶段」
  useEffect(() => {
    const onDocDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDocDrop = (e: DragEvent) => { e.preventDefault(); };

    document.addEventListener('dragover', onDocDragOver, { passive: false, capture: true });
    document.addEventListener('drop', onDocDrop, { passive: false, capture: true });
    return () => {
      document.removeEventListener('dragover', onDocDragOver, true);
      document.removeEventListener('drop', onDocDrop, true);
    };
  }, []);

  // B) 目标容器级
  useEffect(() => {
    const el = senderDropRef.current;
    if (!el) return;

    const hasFiles = (e: DragEvent) =>
      !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      setIsDraggingOverSender(true);

      // 自动打开：只有在包含文件、且 Header 未打开时才触发
      if (!headerOpen && hasFiles(e)) {
        onExternalDragEnter?.();
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        setIsDraggingOverSender(false);
        dragCounterRef.current = 0;
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOverSender(false);

      if (!e.dataTransfer) return;
      const dropped = Array.from(e.dataTransfer.files || []);
      if (!dropped.length) return;

      // 关键：Header 打开时，交给 Attachments 自己处理，避免重复添加
      if (headerOpen) return;

      const mapped = dropped.map((f) => ({
        uid: crypto.randomUUID(),
        originFileObj: f,
        name: f.name,
        status: 'done' as const,
      }));
      setFiles((prev: any) => [...(prev ?? []), ...mapped]);
    };

    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);

    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [senderDropRef, headerOpen, onExternalDragEnter]);

  return { isDraggingOverSender, files, setFiles } as const;
}
