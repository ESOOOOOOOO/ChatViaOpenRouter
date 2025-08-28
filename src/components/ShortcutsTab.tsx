import React from 'react';
import { Button, Card, Divider, Empty, Input, Popconfirm, Space, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import type { Shortcut } from '../DTOs/Shortcuts.dto';
import type { UserInfo } from '../DTOs/systemLanguage.dto';
import { NAME_MAX_LEN, PROMPT_MAX_LEN, SHORTCUTS_MAX, PAGE_HEIGHT } from './../constants/settings';

type ShortcutsTabProps = {
  shortcuts: Shortcut[];
  setShortcuts: React.Dispatch<React.SetStateAction<Shortcut[]>>;
  loadingShortcuts: boolean;
  savingShortcuts: boolean;
  onSaveShortcuts: () => Promise<void> | void;
  userInfo: UserInfo;
};

const ShortcutsTab: React.FC<ShortcutsTabProps> = ({
  shortcuts, setShortcuts, loadingShortcuts, savingShortcuts, onSaveShortcuts, userInfo,
}) => {
  const commonPageStyle: React.CSSProperties = {
    height: PAGE_HEIGHT,
    overflowY: 'auto',
    paddingRight: 16,
  };

  const handleAddShortcut = () => {
    if (shortcuts.length >= SHORTCUTS_MAX) {
      message.warning(userInfo.language.maxShortcutWarning.replace('${SHORTCUTS_MAX}', String(SHORTCUTS_MAX)));
      return;
    }
    setShortcuts((prev) => [...prev, { name: '', prompt: '' }]);
  };

  const handleChangeShortcut = (idx: number, patch: Partial<Shortcut>) => {
    setShortcuts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleDeleteShortcut = (idx: number) => {
    setShortcuts((prev) => prev.filter((_, i) => i !== idx));
  };

  const TextArea = Input.TextArea;

  return (
    <div style={commonPageStyle}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {userInfo.language.shortcuts}
            </Typography.Title>
            <Typography.Text type="secondary">
              {userInfo.language.shortcutMaxCount}（{shortcuts.length}/{SHORTCUTS_MAX}）
            </Typography.Text>
          </div>
          <Space>
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddShortcut} disabled={shortcuts.length >= SHORTCUTS_MAX}>
              {userInfo.language.addNew}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={onSaveShortcuts}
              loading={savingShortcuts}
              disabled={loadingShortcuts || savingShortcuts}
            >
              {userInfo.language.save}
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '0px 0', rowGap: '0px' }} />

        {loadingShortcuts ? (
          <Card loading />
        ) : shortcuts.length === 0 ? (
          <div style={{ padding: '24px 0' }}>
            <Empty description={userInfo.language.noShortcuts} />
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {shortcuts.map((sc, idx) => (
              <Card
                key={idx}
                size="small"
                style={{ borderRadius: 10, padding: '12px 12px 18px 12px' }}
                title={
                  <Space align="center">
                    <Tag color="gold">#{idx + 1}</Tag>
                    <Typography.Text strong>{userInfo.language.shortcuts}</Typography.Text>
                  </Space>
                }
                extra={
                  <Popconfirm
                    title={userInfo.language.confirmDelete}
                    onConfirm={() => handleDeleteShortcut(idx)}
                    okText={userInfo.language.deleteText}
                    cancelText={userInfo.language.cancelText}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div>
                    <Typography.Text>
                      {userInfo.language.shortcutName}（≤{NAME_MAX_LEN}）
                    </Typography.Text>
                    <Input
                      style={{ marginTop: 6 }}
                      placeholder={userInfo.language.shortcutNamePlaceholder}
                      value={sc.name}
                      onChange={(e) =>
                        handleChangeShortcut(idx, { name: e.target.value.slice(0, NAME_MAX_LEN) })
                      }
                      maxLength={NAME_MAX_LEN}
                      showCount
                      allowClear
                    />
                  </div>
                  <div>
                    <Typography.Text>
                      {userInfo.language.shortcutPrompt}（≤{PROMPT_MAX_LEN}）
                    </Typography.Text>
                    <TextArea
                      style={{ marginTop: 6 }}
                      placeholder={userInfo.language.shortcutPromptPlaceholder}
                      value={sc.prompt}
                      onChange={(e) =>
                        handleChangeShortcut(idx, {
                          prompt: e.target.value.slice(0, PROMPT_MAX_LEN),
                        })
                      }
                      maxLength={PROMPT_MAX_LEN}
                      showCount
                      autoSize={{ minRows: 3, maxRows: 8 }}
                    />
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Space>
    </div>
  );
};

export default ShortcutsTab;
