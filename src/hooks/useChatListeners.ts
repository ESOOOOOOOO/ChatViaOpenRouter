import { useEffect, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
/**
* CN: 聊天窗口事件总线 Hook：集中注册/清理 Tauri 事件监听。
* EN: Event-bus hook for chat window: centralizes registration/cleanup of Tauri listeners.
*/
export function useChatListeners(params: {
onStreamChunk: (chunk: string) => void;
onStreamDone: () => void;
onTitleUpdate: (title: string) => void;
onShouldHide: () => Promise<void> | void;
onShown: () => void;
onShortcutMission: (payload: any) => void;
onShortcutsUpdated: (shortcuts: any[]) => void;
}) {
const initedRef = useRef(false);
const unsubsRef = useRef<UnlistenFn[]>([]);


useEffect(() => {
if (initedRef.current) return;
initedRef.current = true;


(async () => {
// stream-response
unsubsRef.current.push(await listen('stream-response', (event) => {
const payload = event.payload as string | { chunk?: string };
const chunk = typeof payload === 'string' ? payload : payload?.chunk ?? '';
if (chunk === '[DONE]') params.onStreamDone(); else params.onStreamChunk(chunk);
}));


// update_chat_title
unsubsRef.current.push(await listen('update_chat_title', (event: any) => {
const newTitle = event?.payload?.choices?.[0]?.message?.content?.trim();
if (newTitle) params.onTitleUpdate(newTitle);
}));


// should-hide-chat-window
unsubsRef.current.push(await listen('should-hide-chat-window', async () => {
await params.onShouldHide();
}));


// chat-window-shown
unsubsRef.current.push(await listen('chat-window-shown', () => {
params.onShown();
}));


// shortcut_mission
unsubsRef.current.push(await listen('shortcut_mission', (event) => {
params.onShortcutMission(event.payload);
}));


// shortcuts_updated
unsubsRef.current.push(await listen('shortcuts_updated', (event: any) => {
params.onShortcutsUpdated(event?.payload?.shortcuts ?? []);
}));
})();


// cleanup
return () => {
for (const un of unsubsRef.current) un();
unsubsRef.current = [];
initedRef.current = false;
};
}, [params]);
}