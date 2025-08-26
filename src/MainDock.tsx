import React, { useRef } from 'react';
import { emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Menu } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition } from '@tauri-apps/api/dpi';
import { readText } from '@tauri-apps/plugin-clipboard-manager';

import { ICON_SIZE, WEBVIEW_SIZE } from './constants/ui';
import { SHORTCUTS_FIELD, Shortcut, normalizeShortcuts } from './constants/shortcuts';

import { Store } from '@tauri-apps/plugin-store';
import DockIcon from './components/DockIcon';
import AttachmentDrop from './components/AttachmentDrop';
import { useTransparentBackground } from './hooks/useTransparentBackground';
import { useInitTauriStore } from './hooks/useInitTauriStore';

const MainDock: React.FC = () => {
  useTransparentBackground();
  const storeRef = useInitTauriStore();
  const bgPanelRef = useRef<HTMLDivElement | null>(null);

  const handleShowChat = async () => {
    try { await invoke('show_chat_window'); } catch (error) { console.error('Failed to show chat window:', error); }
  };

  const handleQuit = async () => { await invoke('exit'); };

  // 右键菜单：动态读取 shortcuts
  const handleRightClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    let items: any[] = [];
    try {
      const s = storeRef.current || await Store.load('store.json');
      if (!storeRef.current) storeRef.current = s;

      const raw = await s.get(SHORTCUTS_FIELD);
      const list = normalizeShortcuts(raw);

      items = list.map((sc: Shortcut, idx: number) => ({
        id: `sc_${idx}`,
        text: sc.name || `Shortcut ${idx + 1}`,
        async action() {
          const content = await readText();
          if (content !== '') {
            await handleShowChat();
            await emit('shortcut_mission', { type: sc.name, content: sc.prompt + content });
          }
        },
      }));
    } catch (err) {
      console.error('read shortcuts for menu failed:', err);
    }

    items.push({ id: 'exit', text: 'Exit', async action() { await handleQuit(); } });

    const menu = await Menu.new({ items });
    const pos = new LogicalPosition(e.clientX, e.clientY);
    await menu.popup(pos, getCurrentWindow());
  };

  const handleDragWindow = async (e?: React.MouseEvent | React.TouchEvent) => {
    try {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      await getCurrentWindow().startDragging();
    } catch (err) {
      console.error('startDragging failed:', err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, width: WEBVIEW_SIZE, height: WEBVIEW_SIZE, pointerEvents: 'none', background: 'transparent' }}>
      <AttachmentDrop onBeforeHandle={handleShowChat} />

      {/* 背景面板 */}
      <div
        ref={bgPanelRef}
        style={{
          position: 'fixed', top: 0, height: WEBVIEW_SIZE - 2, width: WEBVIEW_SIZE - 2,
          transform: 'scaleX(1)', transformOrigin: 'left center', transition: 'transform .4s ease',
          background: 'radial-gradient(circle at 20% 20%, #dcb890, transparent 60%),\n' +
                     'radial-gradient(circle at 80% 30%, #7a9ca8, transparent 65%),\n' +
                     'radial-gradient(circle at 40% 80%, #a3907a, transparent 60%),\n' +
                     '#ffffff77',
          borderRadius: 18, overflow: 'hidden', pointerEvents: 'auto', border: '1px solid rgba(72,72,72,0.1)'
        }}
      >
        <div style={{ width: WEBVIEW_SIZE, height: WEBVIEW_SIZE, background: '#ffffffee', backdropFilter: 'blur(1px)' }} />
      </div>

      {/* 右侧图标容器 */}
      <div
        style={{
          position: 'fixed', left: WEBVIEW_SIZE / 2, top: '50%', transform: 'translate(-50%, -50%)',
          width: WEBVIEW_SIZE, height: WEBVIEW_SIZE, display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: 'transparent', borderRadius: 12, gap: 8, pointerEvents: 'auto', opacity: 1, transition: 'opacity .3s ease',
        }}
        onMouseMove={handleDragWindow}
      >
        <div style={{ width: ICON_SIZE, height: ICON_SIZE, position: 'relative', background: 'transparent', pointerEvents: 'auto' }}>
          <DockIcon size={ICON_SIZE} onClick={() => handleShowChat()} onContextMenu={handleRightClick} />
        </div>
      </div>
    </div>
  );
};

export default MainDock;