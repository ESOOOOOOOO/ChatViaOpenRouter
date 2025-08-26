import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { DEFAULT_SHORTCUTS, SHORTCUTS_FIELD, normalizeShortcuts } from './../constants/shortcuts';

/** 初始化 store：
 *  - 调用 `reset_main_window`
 *  - 确保存在 shortcuts 字段（为空时写入默认）
 *  - 确保存在 user_info 字段（若无则写入默认）
 */
export const useInitTauriStore = () => {
  const storeRef = useRef<Store | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await invoke('reset_main_window');
        const s = await Store.load('store.json');
        storeRef.current = s;

        // 1) shortcuts 初始化与清洗
        const rawShortcuts = await s.get(SHORTCUTS_FIELD);
        const cleaned = normalizeShortcuts(rawShortcuts);
        if (!rawShortcuts || cleaned.length === 0) {
          await s.set(SHORTCUTS_FIELD, DEFAULT_SHORTCUTS);
          await s.save();
        } else {
          await s.set(SHORTCUTS_FIELD, cleaned);
          await s.save();
        }

        // 2) user_info 初始化（修复原代码逻辑：应检查 'user_info' 键，而不是复用 SHORTCUTS_FIELD）
        const userInfo = await s.get('user_info');
        if (userInfo === undefined) {
          await s.set('user_info', {
            name: 'User',
            language: {
              label: 'English (EN)',
              value: 'en-US',
              newChat: 'newChat',
              imageTag: 'image',
              audioTag: 'audio',
              textTag: 'text',
              fileTag: 'file',
              webSearch: 'web search',
              promptTag: 'Prompts',
              modelTag: 'Models',
              currentModel: 'Current Model',
              select: 'Select',
              releaseDate: 'Release Date',
              systemPrompt: 'System Prompt',
              clear: 'clear',
              save: 'save',
              apply: 'apply',
              verify: 'Verify',
              verifyLabel: 'The credit information will be displayed after the API key is verified.',
              credit: 'Credit',
              totalCredits: 'Total Credits',
              usedCredits: 'Used Credits',
              refresh: 'Refresh',
              saveChanges: 'Save Changes',
              delete: 'Delete',
              addNew: 'Add',
              shortcuts: 'Shortcuts',
              shortcutName: 'Shortcut Name',
              shortcutPrompt: 'Shortcut Prompt',
              shortcutMaxCount: 'You can only add up to 5 shortcuts',
              shortcutSaved: 'Shortcuts saved successfully',
              shortcutDeleted: 'Shortcut deleted successfully',
              saveUserInfo: 'Save User Info',
              userName: 'User Name',
              languagePreference: 'Language Preference',
              setAvatar: 'Set Avatar',
              updateAvatar: 'Update Avatar',
              setting: 'Setting',
              userInfo: 'User Info',
              apiKeyTab: 'API Key',
              userInfoTab: 'User Info',
              shortcutsTab: 'Shortcuts',
              aboutTab: 'About',
              getName: 'Your Name/Nick Name',
              inputPlaceholder: 'Please input here..',
              selectPlaceholder: 'Set System Language',
              noShortcuts: "No shortcuts yet, click 'Add' to get started",
              maxShortcutWarning: 'You can only add up to ${SHORTCUTS_MAX} shortcuts',
              shortcutNamePlaceholder: 'e.g. Translate to English',
              shortcutPromptPlaceholder: 'Input your prompt...',
              nameMaxWarning: 'Name cannot exceed ${NAME_MAX_LEN} characters',
              confirmDelete: 'Are you sure to delete this shortcut?',
              deleteText: 'Delete',
              cancelText: 'Cancel',
              chatHistory: 'Chat History',
              clearChatHistory: 'Clear Chat History',
              clearHistoryConfirm: 'Are you sure to clear chat history? This action cannot be undone.',
              historyCleared: 'Chat history cleared',
              pinChat: 'Pin Chat',
              unpinChat: 'Unpin Chat',
              expand: 'Expand',
              collapse: 'Collapse',
              selectModel: 'Select Model',
              noModelAvailable: 'No model available',
              modelReleasedOn: 'Released on',
              modelInputSupport: 'Input Support',
              modelSystemPrompt: 'System Prompt',
              modelFreeOnly: 'Free Models Only',
              modelMultiFormatSupport: 'Multi-format Input Support',
              noModelMatch: 'No model matches the filter',
              selectLanguage: 'Select Language',
              myPrompts: 'My Prompts',
              prefabPrompts: 'Prefab Prompts',
              promptName: 'Prompt Name',
              promptContent: 'Prompt Content',
              promptMaxCount: 'You can only add up to ${SHORTCUTS_MAX} prompts',
              promptSaved: 'Prompt saved successfully',
              promptDeleted: 'Prompt deleted successfully',
              savePromptChanges: 'Save Prompt Changes',
              promptNamePlaceholder: 'e.g. Translate to English',
              promptContentPlaceholder: 'Input your prompt...',
              promptNameMaxWarning: 'Prompt name cannot exceed ${NAME_MAX_LEN} characters',
              confirmDeletePrompt: 'Are you sure to delete this prompt?',
              modelSettings: 'Model Settings',
              modelSettingsSaved: 'Model settings saved successfully',
              promptHolder: 'Create system prompt for the assistant...',
              operation: 'Operation',
            },
            avatar: '',
          });
          await s.save();
        }
      } catch (e) {
        console.error('init store / shortcuts failed:', e);
      }
    })();
  }, []);

  return storeRef;
};