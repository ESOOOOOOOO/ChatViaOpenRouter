import React, { useMemo, useState, useCallback } from 'react';
import { Button, Divider, Input, Space, Typography, Tooltip, message } from 'antd';
import { ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { PAGE_HEIGHT } from './../constants/settings';
import type { UserInfo } from '../DTOs/systemLanguage.dto';

type CreditData = { total?: number; used?: number } | null;

type ApiKeyTabProps = {
  apiKeyInput: string;
  setApiKeyInput: (v: string) => void;
  verifying: boolean;
  creditData: CreditData;
  onVerify: (silent?: boolean) => void;
  onFreeKeySet: (key:string) => void;
  userInfo: UserInfo;
};

const ApiKeyTab: React.FC<ApiKeyTabProps> = ({
  apiKeyInput, setApiKeyInput, verifying, creditData, onVerify, userInfo,onFreeKeySet
}) => {
  const [freeKeyLoading, setFreeKeyLoading] = useState(false);

  const remain = useMemo(() => {
    const t = creditData?.total ?? undefined;
    const u = creditData?.used ?? undefined;
    if (t === undefined || u === undefined) return undefined;
    const r = Math.max(0, t - u);
    return Math.round(r * 1_000_000) / 1_000_000;
  }, [creditData]);

  const commonPageStyle: React.CSSProperties = {
    height: PAGE_HEIGHT,
    overflowY: 'auto',
    paddingRight: 16,
  };

  /**
   * 向后端申请免费 Key：
   * no credit available, can not be recharged, but can be used to access free models. feel free to use directly.
   */
  const handleApplyFreeKey = useCallback(async () => {
    setFreeKeyLoading(true);
    const hide = message.loading(userInfo.language.applyingFreeApiKey, 0);
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer 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' },
        // 如果需要可在 body 里传递 label 等参数
        body: JSON.stringify({ name: Date.now().toString(), limit:0 }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || userInfo.language.failed+": "+` ${resp.status}`);
      }

      const data = await resp.json();
      const newKey: string | undefined = data?.key;

      if (!newKey || typeof newKey !== 'string') {
        throw new Error('后端未返回明文 API Key（key 字段缺失或无效）。');
      }

      // 自动填充到输入框
      setApiKeyInput(newKey);
      onFreeKeySet(newKey);

      hide();
      message.success(userInfo.language.freeKeyApplySuccess,3);
    } catch (err: any) {
      hide();
      message.error(err?.message || userInfo.language.failed);
    } finally {
      setFreeKeyLoading(false);
    }
  }, [onVerify, setApiKeyInput]);

  const isBusy = verifying || freeKeyLoading;

  return (
    <div style={commonPageStyle}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input.Password
            placeholder={"API-KEY.."}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            disabled={isBusy}
            autoComplete="off"
          />
          <Button
            type="primary"
            onClick={() => onVerify(false)}
            loading={verifying}
            disabled={verifying || apiKeyInput.trim() === ''}
          >
            {userInfo.language.verify}
          </Button>
        </Space.Compact>

        {/* 申请免费 Key + 帮助提示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            onClick={handleApplyFreeKey}
            loading={freeKeyLoading}
            disabled={isBusy}
          >
            {userInfo.language.getFreeApiKey}
          </Button>
          <Tooltip
            placement="right"
            title={userInfo.language.freeApikeyTip}
          >
            <QuestionCircleOutlined style={{ color: '#999', cursor: 'pointer' }} />
          </Tooltip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text style={{ fontSize: 12, color: '#999' }}>
            {userInfo.language.verifyLabel}
          </Typography.Text>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ padding: '8px 4px' }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#c79c4e', lineHeight: 1.2 }}>
            {remain !== undefined ? remain : '--'}
          </span>
          <span style={{ fontSize: 32, fontWeight: 400, color: '#000', lineHeight: 1.2, marginLeft: 8 }}>
            Credits
          </span>

          {apiKeyInput.trim() !== '' && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => onVerify(true)}
              loading={verifying}
              disabled={verifying}
              style={{ transform: "translate(0%,-20%)", marginLeft: 12 }}
            >
              {userInfo.language.refresh}
            </Button>
          )}

          <div style={{ marginTop: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
              {userInfo.language.totalCredits}: {creditData?.total ?? '--'}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
              {userInfo.language.usedCredits}: {creditData?.used ?? '--'}
            </Typography.Text>
          </div>
        </div>
      </Space>
    </div>
  );
};

export default ApiKeyTab;
