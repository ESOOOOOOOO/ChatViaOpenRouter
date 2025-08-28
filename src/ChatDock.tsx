import React, { useEffect, useRef, useState } from 'react';
import { UploadFile } from 'antd';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import 'highlight.js/styles/srcery.css';
import './ChatDock.css';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatSender from './components/ChatSender';
import BotModal from './components/BotModal';
import { Message as MsgDto } from './DTOs/Message.dto';
import { ModelDto } from './DTOs/OpenRouterResponse.dto';
import { ChatCompletion } from './DTOs/ChatCompletion.dto';
import { Conversation } from './DTOs/Conversation.dto';
import { rankModelsByCreated } from './utils/ranker';
import { useSenderDragDrop } from './hooks/useSenderDragDrop';
import SettingModel from './components/SettingModel';
import { ShortcutMission } from './DTOs/shortcutMission.dto';
import { Shortcut } from './DTOs/Shortcuts.dto';
import { SystemLanguageDto } from './DTOs/systemLanguage.dto';
import { onCopy } from './utils/clipboard';
import { findIdxByCreateTime, sortByLastUpdateDesc } from './utils/conversation';
import { SUPPORTED_IMAGE_MIME, SUPPORTED_PDF_MIME, SUPPORTED_AUDIO_MIME, SUPPORTED_TEXTABLE_EXT, guessAudioFormat } from './constants/mime';
import { defaultLanguage } from './constants/defaultLanguage';

const ChatDock: React.FC = () => {
  const [messages, setMessages] = useState<MsgDto[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [botModalOpen, setBotModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelList, setModelList] = useState<ModelDto[] | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelDto | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [expanded, setExpanded] = useState(false);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [currentConversationID, setCurrentConversationID] = useState(0);
  const [goOnline, setGoOnline] = useState<boolean>(false);
  const [pined, setPined] = useState<boolean>(false);
  const [senderHeaderOpen, setSenderHeaderOpen] = useState(false);
  const [settingModelOpen, setSettingModelOpen] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [token, setToken] = useState('');
  const [supportedFeature, setSupportedFeature] = useState<string[]>([]);
  const [supportedOutputFeature, setSupportedOutputFeature] = useState<string[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [userInfo, setUserInfo] = useState<{ name: string; language: SystemLanguageDto; avatar: string }>(defaultLanguage);

  const idCounter = useRef(0);
  const assistantMessageId = useRef<number | null>(null);
  const senderRef = useRef<any>(null);
  const bubbleListRef = useRef<HTMLDivElement>(null);
  const senderDropRef = useRef<HTMLDivElement | null>(null);

  const { isDraggingOverSender, files, setFiles } = useSenderDragDrop(senderDropRef, { headerOpen: senderHeaderOpen, onExternalDragEnter: () => setSenderHeaderOpen(true) });

  const messagesRef = useRef<MsgDto[]>([]);
  const currentConversationIDRef = useRef<number>(0);
  const storeRef = useRef<Store | null>(null);
  const loadingRef = useRef<boolean>(false);
  const chatTitleRef = useRef<string>('New Chat');

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { currentConversationIDRef.current = currentConversationID; }, [currentConversationID]);
  useEffect(() => { storeRef.current = store; }, [store]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { chatTitleRef.current = chatTitle; }, [chatTitle]);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const streamUnlistenRef = useRef<UnlistenFn | null>(null);
  const streamImageUnlistenRef = useRef<UnlistenFn | null>(null);
  const titleUnlistenRef = useRef<UnlistenFn | null>(null);
  const shownUnlistenRef = useRef<UnlistenFn | null>(null);
  const shortcutMissionUnlistenRef = useRef<UnlistenFn | null>(null);
  const shortcutsUpdatedUnlistenRef = useRef<UnlistenFn | null>(null);

  const listenersInitedRef = useRef(false);
  const shortcutsRef = useRef<Shortcut[]>([]);
  useEffect(() => { shortcutsRef.current = shortcuts; }, [shortcuts]);

  const handleSubmitRef = useRef<(mission?: ShortcutMission) => boolean>(() => false);
  const shortcutBusyRef = useRef(false);
  const isHeaderDraggingRef = useRef(false);

  // 图片增量缓冲 + 幂等标志
  const imageBufferRef = useRef<string>(''); 
  const imageDoneOnceRef = useRef<boolean>(false); // 👈 新增：同一轮只处理一次 DONE

  const persistConversations = async (incoming?: Conversation[]) => {
    const s = storeRef.current;
    if (!s) return;
    const list = sortByLastUpdateDesc(incoming ?? conversations);
    setConversations(list);
    await s.set('conversations', list);
    await s.save();
  };

  const kickIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (loadingRef.current) {
        setLoading(false);
        assistantMessageId.current = null;
      }
    }, 60000);
  };

  useEffect(() => {
    if (listenersInitedRef.current) return;
    listenersInitedRef.current = true;
    (async () => {
      // ========= 文本流 =========
      const unStream = await listen('stream-response', async (event) => {
        const payload = event.payload as string | { chunk?: string };
        const chunk = typeof payload === 'string' ? payload : payload?.chunk ?? '';
        kickIdleTimer();

        if (chunk === '[DONE]') {
          if (assistantMessageId.current !== null) {
            setLoading(false);
            assistantMessageId.current = null;

            const s = storeRef.current;
            if (!s) return;
            let storedConversations: Conversation[] = (await s.get('conversations')) ?? [];
            const latestMessages = messagesRef.current;

            if (latestMessages[latestMessages.length - 1]?.content[0].text === '') {
              latestMessages[latestMessages.length - 1].content[0].text = userInfo.language.modelOrFuctionUnavilable;
              if ( latestMessages.length <= 2) setChatTitle(userInfo.language.requestFailed);
            } else {
              const now = Date.now();
              let idx = findIdxByCreateTime(storedConversations, currentConversationIDRef.current);
              if (idx === -1) {
                const newCreateTime = currentConversationIDRef.current || now;
                if (!currentConversationIDRef.current) setCurrentConversationID(newCreateTime);
                const newConversation: Conversation = { title: chatTitleRef.current || 'New Chat', createTime: newCreateTime, lastUpdateTime: now, messages: latestMessages };
                storedConversations = [newConversation, ...storedConversations];
              } else {
                storedConversations[idx] = { ...storedConversations[idx], messages: latestMessages, lastUpdateTime: now };
              }
            }
            await persistConversations(storedConversations);
          }
          return;
        }

        if (assistantMessageId.current !== null && chunk) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId.current
                ? { ...msg, content: [{ type: 'text', text: (msg.content[0] as any).text + chunk }] as any }
                : msg
            )
          );
        }
      });

      // ========= 图片流（幂等 + 去重）=========
      const unStreamImage = await listen('stream-image', async (event) => {
        const payload = event.payload as { done?: boolean; part?: string; data_url?: string } | string;
        if (typeof payload === 'string') return;

        if (payload?.done === false && typeof payload?.part === 'string' && payload.part.length > 0) {
          imageBufferRef.current += payload.part;
          return;
        }

        if (payload?.done === true) {
          // 幂等保护：DONE 只处理一次
          if (imageDoneOnceRef.current) return;
          imageDoneOnceRef.current = true;

          const finalUrl = (payload.data_url && payload.data_url.startsWith('data:'))
            ? payload.data_url
            : imageBufferRef.current;

          imageBufferRef.current = ''; // 清空缓冲

          if (!finalUrl || !finalUrl.startsWith('data:')) return;

          // 工具：将图片安全地追加到目标 assistant 消息（去重）
          const appendImageDedup = (list: MsgDto[]): MsgDto[] => {
            const targetId =
              assistantMessageId.current !== null
                ? assistantMessageId.current
                : [...list].reverse().find((m) => m.role === 'assistant')?.id ?? null;
            if (targetId === null) return list;

            return list.map((msg) => {
              if (msg.id !== targetId) return msg;

              const exists = (msg.content || []).some(
                (p: any) => p?.type === 'image_url' && p?.image_url?.url === finalUrl
              );
              if (exists) return msg; // 已存在同 URL，跳过

              const nextContent = [...msg.content, { type: 'image_url', image_url: { url: finalUrl } }] as any;
              return { ...msg, content: nextContent };
            });
          };

          // 1) 更新状态并在同一时刻持久化“最新版本”，避免再对旧副本做二次 append
          setMessages((prev) => {
            const updated = appendImageDedup(prev);

            // 同步持久化（使用 updated，而不是 messagesRef.current）
            (async () => {
              const s = storeRef.current;
              if (!s) return;
              let storedConversations: Conversation[] = (await s.get('conversations')) ?? [];
              const now = Date.now();
              let idx = findIdxByCreateTime(storedConversations, currentConversationIDRef.current);
              if (idx === -1) {
                const createTime = currentConversationIDRef.current || now;
                const conv: Conversation = { title: chatTitleRef.current || 'New Chat', createTime, lastUpdateTime: now, messages: updated };
                storedConversations = [conv, ...storedConversations];
              } else {
                storedConversations[idx] = { ...storedConversations[idx], messages: updated, lastUpdateTime: now };
              }
              await persistConversations(storedConversations);
            })();

            return updated;
          });
        }
      });

      const unTitle = await listen('update_chat_title', async (event: any) => {
        const response = event.payload as ChatCompletion;
        const newTitle = response?.choices?.[0]?.message?.content?.trim();
        if (!newTitle) return;
        const s = storeRef.current;
        if (!s) return;
        let storedConversations: Conversation[] = (await s.get('conversations')) ?? [];
        const idx = findIdxByCreateTime(storedConversations, currentConversationIDRef.current);
        if (idx !== -1) {
          storedConversations[idx] = { ...storedConversations[idx], title: newTitle };
          await persistConversations(storedConversations);
          if (chatTitleRef.current === 'New Chat') setChatTitle(newTitle);
        }
      });

      streamUnlistenRef.current = unStream;
      streamImageUnlistenRef.current = unStreamImage;
      titleUnlistenRef.current = unTitle;
    })();

    return () => {
      if (streamUnlistenRef.current) {
        streamUnlistenRef.current();
        streamUnlistenRef.current = null;
      }
      if (streamImageUnlistenRef.current) {
        streamImageUnlistenRef.current();
        streamImageUnlistenRef.current = null;
      }
      if (titleUnlistenRef.current) {
        titleUnlistenRef.current();
        titleUnlistenRef.current = null;
      }
    };
  }, []);

  const pinedRef = useRef(pined);
  useEffect(() => { pinedRef.current = pined; }, [pined]);

  useEffect(() => {
    let un: UnlistenFn | undefined;
    (async () => {
      un = await listen('should-hide-chat-window', async () => {
        if (!pinedRef.current && !isHeaderDraggingRef.current) {
          await invoke('hide_chat_window');
        }
      });
    })();
    return () => { if (un) un(); };
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const un = await listen('chat-window-shown', () => {
        if (!canceled) senderRef.current?.focus();
      });
      shownUnlistenRef.current = un;
    })();
    return () => {
      canceled = true;
      if (shownUnlistenRef.current) {
        shownUnlistenRef.current();
        shownUnlistenRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const un = await listen('shortcut_mission', async (event) => {
        if (shortcutBusyRef.current) return;
        shortcutBusyRef.current = true;
        try {
          let response = event.payload as ShortcutMission;
          handleSubmitRef.current(response);
        } finally {
          setTimeout(() => { shortcutBusyRef.current = false; }, 200);
        }
      });
      shortcutMissionUnlistenRef.current = un;
    })();
    return () => {
      if (shortcutMissionUnlistenRef.current) {
        shortcutMissionUnlistenRef.current();
        shortcutMissionUnlistenRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      const un = await listen('shortcuts_updated', (event: any) => {
        const next = (event?.payload?.shortcuts ?? []) as Shortcut[];
        setShortcuts(next);
        shortcutsRef.current = next;
      });
      shortcutsUpdatedUnlistenRef.current = un;
    })();
    return () => {
      if (shortcutsUpdatedUnlistenRef.current) {
        shortcutsUpdatedUnlistenRef.current();
        shortcutsUpdatedUnlistenRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const setup = async () => {
      const storeInstance = await Store.load('store.json');

      // await storeInstance.clear()
      setStore(storeInstance);

      storeRef.current = storeInstance;

      const savedConvs: Conversation[] = (await storeInstance.get('conversations')) ?? [];
      setConversations(sortByLastUpdateDesc(savedConvs));

      let apiKey = await storeInstance.get('api_key');
      if (apiKey != undefined && apiKey != null && apiKey != '') {
        setToken(apiKey as string);
        setApiKeyReady(true);
      }

      const models = await fetchOpenRouterModels();
      console.log('Fetched models:', models);
      setModelList(models);

      let model = await storeInstance.get<ModelDto>('current_model');
      if (!model) {
        await storeInstance.set('current_model', models[0]);
        await storeInstance.save();
        model = models[0];
      }
      console.log('Current model:', model);
      setCurrentModel(model);

      let currentShortcut = (await storeInstance.get('shortcuts')) as Shortcut[];
      if (!currentShortcut) {
        let defaultShortcut: Shortcut[] = [
          { name: '翻译为中文', prompt: '将下面内容翻译为中文:' },
          { name: '用中文概括', prompt: '用中文概括以下内容:' },
        ];
        setShortcuts(defaultShortcut);
        await storeInstance.set('shortcuts', defaultShortcut);
        await storeInstance.save();
      } else {
        setShortcuts(currentShortcut);
      }

      let userInfo = (await storeInstance.get('user_info')) as { name: string; language: SystemLanguageDto; avatar: string };
      if (userInfo) {
        setUserInfo(userInfo);
      }

      const now = Date.now();
      setCurrentConversationID(now);
      currentConversationIDRef.current = now;
    };
    setup();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setLoading(false);
      assistantMessageId.current = null;
    };
  }, []);

  useEffect(() => {
    if (!modelList || !currentModel) return;
    const m = modelList.find((x) => x.id === currentModel.id);
    const allowedInput = m?.architecture?.input_modalities && m.architecture.input_modalities.length > 0 ? m.architecture.input_modalities : ['text'];
    const allowedOutput = m?.architecture?.output_modalities && m.architecture.output_modalities.length > 0 ? m.architecture.output_modalities : ['text'];
    setSupportedFeature(allowedInput.map((v) => String(v)));
    setSupportedOutputFeature(allowedOutput.map((v) => String(v)));
  }, [modelList, currentModel]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      if (bubbleListRef.current) {
        bubbleListRef.current.scrollTop = bubbleListRef.current.scrollHeight;
      }
    });
  }, [messages]);

  const handleDeleteConversation = async (conversationTime: number) => {
    if (!store) return;
    try {
      let storedConversations: Conversation[] = (await store.get('conversations')) ?? [];
      const updatedConversations = storedConversations.filter((conv) => conv.createTime !== conversationTime);

      if (chatTitle !== 'Failed to fetch valid response' && messages.length <= 3) {
        await persistConversations(updatedConversations);
      }

      if (currentConversationID === conversationTime) {
        setMessages([]);
        setChatTitle('New Chat');
        const now = Date.now();
        setCurrentConversationID(now);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversationID(conversation.createTime);
    setMessages(conversation.messages || []);
    setChatTitle(conversation.title);
    setLoading(false);
    assistantMessageId.current = null;
    // 进入旧会话时，避免误用上一次的图片流状态
    imageBufferRef.current = '';
    imageDoneOnceRef.current = false;
    senderRef.current?.focus();
  };

  async function fetchOpenRouterModels(): Promise<ModelDto[]> {
    try {
      const response: string = await invoke('get_open_router_models');
      const result = JSON.parse(response);
      if (result.success) return rankModelsByCreated(result.data.data);
      console.error('Failed to fetch data:', result.error);
      throw new Error(result.error);
    } catch (error) {
      console.error('Error invoking Tauri command:', error);
      throw error;
    }
  }

  const handleClearMessages = () => {
    setChatTitle('New Chat');
    const now = Date.now();
    setCurrentConversationID(now);
    setMessages([]);
    setLoading(false);
    assistantMessageId.current = null;
    setFiles([]);
    imageBufferRef.current = '';
    imageDoneOnceRef.current = false;
  };

  // 组装用户消息（保持你原有逻辑）
  const buildUserContentWithAttachments = (mission?: any) => {
    type FileItemLike = UploadFile & {
      encodedMeta?: (
        | { kind: 'image'; payload: { type: 'image_url'; image_url: { url: string } } }
        | { kind: 'pdf'; payload: { type: 'file'; file: { filename: string; file_data: string } } }
        | { kind: 'audio'; payload: { type: 'input_audio'; input_audio: { data: string; format: string } } }
        | { kind: 'textable'; payload: { type: 'text'; text: string } }
      )
    };

    const parts: any[] = [];
    const userText = mission ? String(mission.content ?? '') : inputValue.trim();
    if (userText) parts.push({ type: 'text', text: userText });

    for (const f of (files as FileItemLike[])) {
      if (f.status !== 'done' || !f.encodedMeta) continue;
      const payload: any = (f.encodedMeta as any).payload;

      if (payload?.type === 'text') {
        const filename = f.name ?? 'document.txt';
        const bytes =
          typeof payload.text === 'string'
            ? new Blob([payload.text]).size
            : (f.size ?? 0);

        parts.push({
          type: 'text',
          text: payload.text,
          meta: { kind: 'textable', filename, bytes },
        });
        continue;
      }
      parts.push(payload);
    }
    return parts;
  };

  const handleSubmit = (mission?: any): boolean => {
    if (loadingRef.current) return false;
    if (!mission && inputValue.trim() === '' && (files?.length ?? 0) === 0) return false;

    if (mission) {
      setChatTitle('Shortcut Mission');
      const now = Date.now();
      setCurrentConversationID(now);
      setMessages([]);
      setFiles([]);
    }

    // 重置图片状态（非常重要）
    imageBufferRef.current = '';
    imageDoneOnceRef.current = false;

    setLoading(true);
    kickIdleTimer();

    const userContent = mission ? buildUserContentWithAttachments(mission) : buildUserContentWithAttachments();
    const userMessage: MsgDto = { id: idCounter.current++, content: userContent, role: 'user' };
    const newAssistantMessageId = idCounter.current++;
    const assistantMessage: MsgDto = { id: newAssistantMessageId, content: [{ type: 'text', text: '' }], role: 'assistant' };
    assistantMessageId.current = newAssistantMessageId;

    const newMessages = [...messagesRef.current, userMessage, assistantMessage];
    setMessages(newMessages);
    setInputValue('');
    setFiles([]);

    (async () => {
      try {
        const s = storeRef.current;
        if (s) {
          let storedConversations: Conversation[] = (await s.get('conversations')) ?? [];
          const now = Date.now();
          let idx = findIdxByCreateTime(storedConversations, currentConversationIDRef.current);
          if (idx === -1) {
            const createTime = currentConversationIDRef.current || now;
            if (!currentConversationIDRef.current) setCurrentConversationID(createTime);
            const newConv: Conversation = { title: chatTitleRef.current || 'New Chat', createTime, lastUpdateTime: now, messages: newMessages };
            storedConversations = [newConv, ...storedConversations];
          } else {
            storedConversations[idx] = { ...storedConversations[idx], messages: newMessages, lastUpdateTime: now, title: storedConversations[idx].title || chatTitleRef.current || 'New Chat' };
          }
        }
      } catch (err) {
        console.error('Pre-persist conversations error:', err);
      }

      const history: any[] = [{ role: 'system', content: systemPrompt }];
      for (const msg of newMessages.slice(0, -1)) {
        if (msg.role === 'user' && msg.id === userMessage.id) {
          history.push({ role: 'user', content: userContent });
        } else {
          history.push({ role: msg.role, content: msg.content });
        }
      }
      const body = { messages: history, stream: true } as const;

      try {
        if (goOnline) {
          await invoke('proxy_stream', { body, model: currentModel!.id + ':online', token });
        } else {
          await invoke('proxy_stream', { body, model: currentModel!.id, token });
        }
      } catch (error: any) {
        console.error('Tauri command error:', error);
        setLoading(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newAssistantMessageId
              ? { ...msg, content: [{ type: 'text', text: 'Error fetching response' }] }
              : msg
          )
        );
      }
    })();

    return true;
  };

  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  const changeCurrentModel = async (model: ModelDto) => {
    if (!store) return;
    setCurrentModel(model);
    await store.set('current_model', model);
    await store.save();
  };

  const onToggleExpand = async () => {
    try {
      if (expanded) await invoke('compress_chat_window');
      else await invoke('expand_chat_window');
      setExpanded(!expanded);
    } catch (e) {
      console.error('toggle expand error', e);
    }
  };

  return (
    <div>
      <div className="chat-dock-container">
        <ChatHeader
          chatTitle={chatTitle}
          currentModel={currentModel}
          pined={pined}
          expanded={expanded}
          onTogglePin={() => { setPined((prev) => !prev); }}
          onOpenBotModel={async () => { setBotModalOpen(true); }}
          onOpenSettingModel={async () => { setSettingModelOpen(true); }}
          onToggleExpand={onToggleExpand}
          supportedFeature={supportedFeature}
          supportedOutputFeature={supportedOutputFeature}
          apiKeyReady={apiKeyReady}
          language={userInfo.language}
          onDraggingChange={(dragging) => { isHeaderDraggingRef.current = dragging; }}
        />
        <MessageList messages={messages} onCopy={onCopy} listRef={bubbleListRef} />
        <ChatSender
          expanded={expanded}
          senderRef={senderRef}
          senderDropRef={senderDropRef}
          isDraggingOverSender={isDraggingOverSender}
          files={files}
          setFiles={setFiles}
          inputValue={inputValue}
          setInputValue={setInputValue}
          loading={loading}
          onSubmit={handleSubmit}
          onClear={handleClearMessages}
          goOnline={goOnline}
          setGoOnline={setGoOnline}
          conversations={conversations}
          onDeleteConversation={handleDeleteConversation}
          onSelectConversation={handleSelectConversation}
          headerOpen={senderHeaderOpen}
          setHeaderOpen={setSenderHeaderOpen}
          pined={pined}
          setPined={setPined}
          supportedMimes={{ image: Array.from(SUPPORTED_IMAGE_MIME), pdf: Array.from(SUPPORTED_PDF_MIME), audio: Array.from(SUPPORTED_AUDIO_MIME), textableExts: Array.from(SUPPORTED_TEXTABLE_EXT) }}
          guessAudioFormat={guessAudioFormat}
          isActive={apiKeyReady}
          supportedFeature={supportedFeature}
          language={userInfo.language}
        />
      </div>
      <BotModal
        expanded={expanded}
        open={botModalOpen}
        onCancel={() => setBotModalOpen(false)}
        currentModel={currentModel}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        modelList={modelList}
        onModelChange={changeCurrentModel}
        setSupportedFeature={(features: string[]) => { setSupportedFeature(features); }}
        setSupportedOutputFeature={(features: string[]) => { setSupportedOutputFeature(features); }}
        language={userInfo.language}
      />
      <SettingModel
        open={settingModelOpen}
        onCancel={() => { setSettingModelOpen(false); }}
        setApiKeyReady={() => { setApiKeyReady(true); }}
        setToken={(tk: string) => { setToken(tk); }}
        userInfo={userInfo}
        setUserInfo={setUserInfo}
      />
    </div>
  );
};

export default ChatDock;
