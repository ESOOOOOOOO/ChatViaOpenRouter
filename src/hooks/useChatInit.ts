import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { Conversation } from './../DTOs/Conversation.dto';
import { ModelDto } from './../DTOs/OpenRouterResponse.dto';
import { Shortcut } from './../DTOs/Shortcuts.dto';
import { SystemLanguageDto } from './../DTOs/systemLanguage.dto';
import { rankModelsByCreated } from './../utils/ranker';
import { sortByLastUpdateDesc } from './../utils/Chat';

export interface ChatInitState {
store: Store | null;
conversations: Conversation[];
modelList: ModelDto[] | null;
currentModel: string;
apiKeyReady: boolean;
token: string;
shortcuts: Shortcut[];
userInfo: { name: string; language: SystemLanguageDto; avatar: string };
currentConversationID: number;
}

/**
* CN: 初始化 Store、会话、模型列表、快捷指令、用户信息与会话 ID。
* EN: Initialize store, conversations, model list, shortcuts, user info, and conversation ID.
*/

export function useChatInit() {
const [state, setState] = useState<ChatInitState>({
store: null,
conversations: [],
modelList: null,
currentModel: '',
apiKeyReady: false,
token: '',
shortcuts: [],
userInfo: { name: '', language: { label: 'English (EN)', value: 'en-US' } as any, avatar: '' },
currentConversationID: 0,
});


useEffect(() => {
const setup = async () => {
const storeInstance = await Store.load('store.json');


const savedConvs: Conversation[] = (await storeInstance.get('conversations')) ?? [];
const conversations = sortByLastUpdateDesc(savedConvs);


const apiKey = (await storeInstance.get('api_key')) as string | undefined;
const apiKeyReady = !!apiKey;
const token = apiKey || '';


// models
const models = await fetchOpenRouterModels();


let currentModel = (await storeInstance.get<string>('current_model')) || '';
if (!currentModel) {
currentModel = 'openai/gpt-5-chat';
await storeInstance.set('current_model', currentModel);
await storeInstance.save();
}


// shortcuts
let shortcuts = (await storeInstance.get('shortcuts')) as Shortcut[] | undefined;
if (!shortcuts) {
shortcuts = [
{ name: '翻译为中文', prompt: '将下面内容翻译为中文:' },
{ name: '用中文概括', prompt: '用中文概括以下内容:' },
];
await storeInstance.set('shortcuts', shortcuts);
await storeInstance.save();
}


// user info
const userInfo = (await storeInstance.get('user_info')) as ChatInitState['userInfo'] | undefined;


const now = Date.now();


setState({
store: storeInstance,
conversations,
modelList: models,
currentModel,
apiKeyReady,
token,
shortcuts,
userInfo: userInfo || { name: '', language: { label: 'English (EN)', value: 'en-US' } as any, avatar: '' },
currentConversationID: now,
});
};


setup();
}, []);


/**
* CN: 调用 Tauri 获取开放模型；失败则抛出。
* EN: Fetch models via Tauri; throws on failure.
*/
async function fetchOpenRouterModels(): Promise<ModelDto[]> {
const response: string = await invoke('get_open_router_models');
const result = JSON.parse(response);
if (result.success) return rankModelsByCreated(result.data.data);
throw new Error(result.error);
}


return [state, setState] as const;
}