import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Tabs, message } from 'antd';
import type { TabsProps } from 'antd';
import { Store } from '@tauri-apps/plugin-store';
import { emit } from '@tauri-apps/api/event';
import { SystemLanguageDto, UserInfo } from '../DTOs/systemLanguage.dto';
import { Shortcut } from '../DTOs/Shortcuts.dto';

import ApiKeyTab from './ApiKeyTab';
import UserTab from './UserTab';
import ShortcutsTab from './ShortcutsTab';
import { API_KEY_FIELD, SHORTCUTS_FIELD, SHORTCUTS_MAX, NAME_MAX_LEN, PROMPT_MAX_LEN, USER_INFO_FIELD } from './../constants/settings';
import { languageOptions } from './../constants/languageOptions';

type Props = {
  open: boolean;
  onCancel: () => void;
  setApiKeyReady: () => void;
  setToken: (token: string) => void;
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
};

type CreditData = { total?: number; used?: number } | null;

const SettingModel: React.FC<Props> = ({ open, onCancel, setApiKeyReady, setToken, userInfo, setUserInfo }) => {
  const [activeKey, setActiveKey] = useState<string>('api');
  const [store, setStore] = useState<Store | null>(null);

  // ===== API Key Tab state =====
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [creditData, setCreditData] = useState<CreditData>(null);

  // ===== User Info Tab state =====
  //const hasAvatar = useMemo(() => !!userInfo.avatar, [userInfo.avatar]);
  const [draftName, setDraftName] = useState<string>('');
  const isUserDirty = useMemo(
    () => draftName !== userInfo.name || userInfo.language?.label !== userInfo.language.label,
    [draftName, userInfo.language, userInfo.name, userInfo.language]
  );
  const [savingUser, setSavingUser] = useState<boolean>(false);

  // ===== Shortcuts Tab state =====
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loadingShortcuts, setLoadingShortcuts] = useState<boolean>(false);
  const [savingShortcuts, setSavingShortcuts] = useState<boolean>(false);

  // -------- Helpers: Store I/O --------
  const ensureApiKeyInStore = async (s: Store) => {
    let exist = await s.get(API_KEY_FIELD);
    if (typeof exist === 'string') {
      setApiKeyInput(exist);
    } else {
      await s.set(API_KEY_FIELD, '');
      await s.save();
      setApiKeyInput('');
    }
  };

  const changeSystemLanguage = async (lang: any) => {
    await saveUserInfo({ language: (languageOptions as SystemLanguageDto[]).find(item => item.value === lang) });
  };

  const ensureUserInfoInStore = async (s: Store) => {
    let v = (await s.get(USER_INFO_FIELD)) as any;
    if (v != null && v != undefined) {
      const info = { name: v.name, language: v.language, avatar: v.avatar } as UserInfo;
      setUserInfo(info);
      setDraftName(info.name || '');
    } else {
      const empty: UserInfo = { name: 'User', language: (languageOptions as SystemLanguageDto[])[0], avatar: '' };
      await s.set(USER_INFO_FIELD, empty);
      await s.save();
      setUserInfo(empty);
      setDraftName('');
    }
  };

  const loadShortcutsFromStore = async (s: Store) => {
    setLoadingShortcuts(true);
    try {
      const raw = await s.get(SHORTCUTS_FIELD);
      if (raw === undefined || raw === null) {
        message.error(userInfo.language.noShortcuts);
        setShortcuts([]);
        return;
      }
      let list: Shortcut[] = [];
      if (Array.isArray(raw)) {
        list = raw.filter(
          (x) =>
            x &&
            typeof x === 'object' &&
            typeof x.name === 'string' &&
            typeof x.prompt === 'string'
        );
      } else if (typeof raw === 'object' && raw) {
        const obj = raw as any;
        if (typeof obj.name === 'string' && typeof obj.prompt === 'string') {
          list = [{ name: obj.name, prompt: obj.prompt }];
        }
      }
      list = list.slice(0, SHORTCUTS_MAX);
      setShortcuts(list);
    } catch (e) {
      console.error('load shortcuts error', e);
      message.error(userInfo.language.noShortcuts);
      setShortcuts([]);
    } finally {
      setLoadingShortcuts(false);
    }
  };

  const saveApiKey = async (key: string) => {
    if (!store) return;
    setApiKeyReady();
    setToken(key);
    await store.set(API_KEY_FIELD, key);
    await store.save();
  };

  const saveUserInfo = async (info: Partial<UserInfo>) => {
    if (!store) return;
    const next = { ...userInfo, ...info };
    setUserInfo(next);
    await store.set(USER_INFO_FIELD, next);
    await store.save();
  };

  const saveShortcuts = async () => {
    if (!store) return;
    if (shortcuts.length > SHORTCUTS_MAX) {
      message.warning(userInfo.language.maxShortcutWarning.replace('${SHORTCUTS_MAX}', String(SHORTCUTS_MAX)));
      return;
    }
    for (const sc of shortcuts) {
      if ((sc.name || '').length > NAME_MAX_LEN) {
        message.warning(`Name length Exceeded`);
        return;
      }
      if ((sc.prompt || '').length > PROMPT_MAX_LEN) {
        message.warning(`Prompt length Exceeded`);
        return;
      }
    }
    setSavingShortcuts(true);
    try {
      await store.set(SHORTCUTS_FIELD, shortcuts);
      await store.save();
      message.success(userInfo.language.shortcutSaved);
      await emit('shortcuts_updated', { shortcuts });
    } catch (e) {
      console.error(e);
      message.error(userInfo.language.noShortcuts);
    } finally {
      setSavingShortcuts(false);
    }
  };

  // -------- Init on open --------
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const s = await Store.load('store.json');
        setStore(s);
        await ensureApiKeyInStore(s);
        await ensureUserInfoInStore(s);
        if (activeKey === 'shortcuts') {
          await loadShortcutsFromStore(s);
        }
      } catch (e) {
        console.error('load store error', e);
        message.error('初始化存储失败');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 进入 Shortcuts 页时加载
  useEffect(() => {
    (async () => {
      if (activeKey === 'shortcuts' && store) {
        await loadShortcutsFromStore(store);
      }
    })();
  }, [activeKey, store]);

  // -------- Handlers: API Key Verify --------
  const handleVerify = async (silent: boolean = false) => {
    const key = apiKeyInput.trim();
    if (!key) {
      message.warning('Please input API Key');
      return;
    }
    setVerifying(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/credits', {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` },
      });

      let body: any = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        const errMsg = body?.error?.message || `Request Failed: ${response.status}）`;
        setCreditData(null);
        message.error(errMsg);
      } else {
        const total = Number(body?.data?.total_credits ?? 0);
        const used = Number(body?.data?.total_usage ?? 0);
        setCreditData({ total, used });
        await saveApiKey(key);
        if (!silent) {
          message.success(userInfo.language.verifySuccess);
        }
      }
    } catch (e) {
      console.error(userInfo.language.netWorkError, e);
      setCreditData(null);
      message.error(userInfo.language.netWorkError);
    } finally {
      setVerifying(false);
    }
  };

  const onFreeKeySet = async (key:string)=>{
    setCreditData({ total:0, used: 0 });
    await saveApiKey(key);
  }

  // -------- Handlers: User Info --------
  const handleSaveUser = async () => {
    setSavingUser(true);
    try {
      await saveUserInfo({ name: draftName, language: userInfo.language });
      message.success(userInfo.language.userInfoUpdated);
    } catch (e) {
      console.error(e);
      message.error(userInfo.language.userInfoUpdateFailed);
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveAvatar = async (dataURL: string) => {
    await saveUserInfo({ avatar: dataURL });
  };

  const items: TabsProps['items'] = [
    {
      key: 'api',
      label: userInfo.language.apiKeyTab,
      children: (
        <ApiKeyTab
          apiKeyInput={apiKeyInput}
          setApiKeyInput={setApiKeyInput}
          verifying={verifying}
          creditData={creditData}
          onVerify={handleVerify}
          onFreeKeySet={onFreeKeySet}
          userInfo={userInfo}
        />
      ),
    },
    {
      key: 'user',
      label: userInfo.language.userInfoTab,
      children: (
        <UserTab
          userInfo={userInfo}
          draftName={draftName}
          setDraftName={setDraftName}
          hasAvatar={!!userInfo.avatar}
          isUserDirty={isUserDirty}
          savingUser={savingUser}
          onChangeSystemLanguage={changeSystemLanguage}
          onSaveUser={handleSaveUser}
          onSaveAvatar={handleSaveAvatar}
        />
      ),
    },
    {
      key: 'shortcuts',
      label: userInfo.language.shortcutsTab,
      children: (
        <ShortcutsTab
          shortcuts={shortcuts}
          setShortcuts={setShortcuts}
          loadingShortcuts={loadingShortcuts}
          savingShortcuts={savingShortcuts}
          onSaveShortcuts={saveShortcuts}
          userInfo={userInfo}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      title={userInfo.language.setting}
      destroyOnHidden={false}
      maskClosable={!verifying}
      mask={false}
      centered
    >
      <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} tabPosition="left" animated />
    </Modal>
  );
};

export default SettingModel;
