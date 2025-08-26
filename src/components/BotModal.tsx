import React, {
  useRef,
  useState,
  useEffect,
  useTransition,
  useDeferredValue,
} from 'react';
import {
  Modal,
  Input,
  Space,
  theme,
  Form,
  Checkbox,
  Select,
  Table,
  Button,
  Tag,
  Tabs,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CloseOutlined } from '@ant-design/icons';
import { ModelDto } from '../DTOs/OpenRouterResponse.dto';
import { providerToColor } from '../utils/providerToColor';
import { Store } from '@tauri-apps/plugin-store';
import './BotModal.css';
import { SystemLanguageDto } from '../DTOs/systemLanguage.dto';

interface SettingsModalProps {
  open: boolean;
  onCancel: () => void;
  currentModel: string;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  modelList: ModelDto[] | null;
  onModelChange: (modelId: string) => void;
  setSupportedFeature:(features:string[])=>void;
  expanded:boolean;
  language:SystemLanguageDto;
}

type SortKey = 'created_desc' | 'price_desc' | 'context_desc';
type PromptItem = { id: number; tagName: string; prompt: string };

const splitProviderAndModel = (id: string) => {
  const [provider, ...rest] = String(id || '').split('/');
  return {
    provider: provider || '-',
    model: rest.length ? rest.join('/') : provider || '-',
  };
};

const hasVision = (m: ModelDto) => {
  const list = m?.architecture?.input_modalities || [];
  return list.some(
    (x) =>
      String(x).toLowerCase().includes('image') ||
      String(x).toLowerCase().includes('vision')
  );
};

const parsePrice = (v?: string): number => {
  if (v == null) return Number.NaN;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : Number.NaN;
};

const toDate = (created: number) => {
  const ms = created < 1e12 ? created * 1000 : created;
  return new Date(ms);
};

const formatDDMMYYYY = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// —— 只读预制标签（不进 store，不可删除）——
const DEFAULT_PRESETS: Array<{ id: string; label: string; value: string }> = [
  { id: 'p1', label: '严谨助理', value: '你是一个严谨、简洁的技术助理，请先给结论再给理由。' },
  { id: 'p2', label: '代码评审', value: '作为代码审查者，请指出可读性、复杂度和潜在 bug，并提供可行动的改进建议。' },
  { id: 'p3', label: '产品脑暴', value: '用 MECE 拆解思路，给出 3 个方向、每个方向 3 个创意，并附优先级。' },
];

const BotModal: React.FC<SettingsModalProps> = ({
  open,
  onCancel,
  currentModel,
  systemPrompt,
  onSystemPromptChange,
  modelList,
  onModelChange,
  setSupportedFeature,
  expanded,
  language
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();

  // == Tab ==
  const [activeTab, setActiveTab] = useState<'prompt' | 'models'>('prompt');

  // == 轻微排序/切换反馈 ==
  const [uiLoading, setUiLoading] = useState(false);
  const switchTimer = useRef<number | null>(null);
  const kickUiLoading = (ms = 120) => {
    setUiLoading(true);
    if (switchTimer.current) window.clearTimeout(switchTimer.current);
    switchTimer.current = window.setTimeout(() => setUiLoading(false), ms);
  };
  useEffect(() => {
    return () => {
      if (switchTimer.current) window.clearTimeout(switchTimer.current);
    };
  }, []);

  // ====== Tauri Store 持久化 ======
  const [_, setStore] = useState<Store | null>(null);
  const storeRef = useRef<Store | null>(null);
  const [storePrompts, setStorePrompts] = useState<PromptItem[]>([]);

  const ensureArray = (val: any): PromptItem[] => {
    return Array.isArray(val) ? (val as PromptItem[]) : [];
  };

  const loadStore = async () => {
    if (storeRef.current) return storeRef.current;
    const s = await Store.load('store.json');
    setStore(s);
    storeRef.current = s;
    return s;
  };

  const loadPromptsFromStore = async () => {
    const s = await loadStore();
    const raw = await s.get<any>('prompts');
    const arr = ensureArray(raw);
    setStorePrompts(arr);
  };

  const loadCurrentPromptIntoInput = async () => {
    const s = await loadStore();
    const cp = await s.get<string>('current_prompt');
    if (cp && typeof cp === 'string') {
      onSystemPromptChange(cp);
    }
  };

  // 打开弹窗或切换到“提示词”Tab 时，读取 current_prompt + prompts
  useEffect(() => {
    if (!open) return;
    if (activeTab !== 'prompt') return;
    (async () => {
      try {
        await loadStore();
        await loadPromptsFromStore();
        await loadCurrentPromptIntoInput();
      } catch (e) {
        console.error('load store error:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  // 保存 current_prompt
  const handleApplyToStore = async () => {
    try {
      const s = await loadStore();
      await s.set('current_prompt', systemPrompt || '');
      await s.save();
      message.success('已应用到 current_prompt');
    } catch (e) {
      console.error(e);
      message.error('写入 current_prompt 失败');
    }
  };

  // 保存为标签：写入 store.prompts
  const addPromptToStore = async (tagName: string, prompt: string) => {
    try {
      const s = await loadStore();
      const raw = await s.get<any>('prompts');
      const arr = ensureArray(raw);
      const item: PromptItem = { id: Date.now(), tagName, prompt };
      const next = [item, ...arr];
      await s.set('prompts', next);
      await s.save();
      setStorePrompts(next);
      message.success(language.promptSaved);
    } catch (e) {
      console.error(e);
      message.error('Error: Failed to save prompt');
    }
  };

  // 从 store.prompts 删除
  const removePromptFromStore = async (id: number) => {
    try {
      const s = await loadStore();
      const raw = await s.get<any>('prompts');
      const arr = ensureArray(raw);
      const next = arr.filter((p) => p.id !== id);
      await s.set('prompts', next);
      await s.save();
      setStorePrompts(next);
      message.success(language.promptDeleted);
    } catch (e) {
      console.error(e);
      message.error('Error: Failed to delete prompt');
    }
  };

  // == 保存标签弹窗 ==
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');

  const initialValues = {
    freeOnly: false,
    visionOnly: false,
    sortKey: 'created_desc' as SortKey,
  };

  const freeOnly = Form.useWatch<boolean>('freeOnly', form) ?? false;
  const visionOnly = Form.useWatch<boolean>('visionOnly', form) ?? false;
  const sortKey = Form.useWatch<SortKey>('sortKey', form) ?? 'created_desc';

  // ======== 延迟值 ========
  const deferredModelList = useDeferredValue(modelList);
  const deferredFreeOnly = useDeferredValue(freeOnly);
  const deferredVisionOnly = useDeferredValue(visionOnly);
  const deferredSortKey = useDeferredValue(sortKey);

  const [isPending, startTransition] = useTransition();
  const [viewData, setViewData] = useState<ModelDto[]>([]);
  const [computing, setComputing] = useState(false);

  // 只有在“模型列表”Tab 激活时才计算
  useEffect(() => {
    if (activeTab !== 'models') {
      setComputing(false);
      return;
    }

    if (!deferredModelList || deferredModelList.length === 0) {
      setViewData([]);
      setComputing(false);
      return;
    }

    setComputing(true);
    startTransition(() => {
      let arr = [...deferredModelList];

      if (deferredFreeOnly) {
        arr = arr.filter((m) => {
          const p = parsePrice(m?.pricing?.prompt);
          return (Number.isFinite(p) && p === 0) || m?.pricing?.prompt === '0';
        });
      }

      if (deferredVisionOnly) {
        arr = arr.filter(hasVision);
      }

      const key: SortKey = deferredSortKey || 'created_desc';
      arr.sort((a, b) => {
        if (key === 'created_desc') {
          return toDate(b.created).getTime() - toDate(a.created).getTime();
        }
        if (key === 'price_desc') {
          const pa = parsePrice(a?.pricing?.prompt);
          const pb = parsePrice(b?.pricing?.prompt);
          if (!Number.isFinite(pa) && !Number.isFinite(pb)) return 0;
          if (!Number.isFinite(pa)) return 1;
          if (!Number.isFinite(pb)) return -1;
          return pb - pa;
        }
        const ca = a?.top_provider?.context_length ?? a?.context_length ?? 0;
        const cb = b?.top_provider?.context_length ?? b?.context_length ?? 0;
        return cb - ca;
      });

      setViewData(arr);
      setComputing(false);
    });
  }, [
    activeTab,
    deferredModelList,
    deferredFreeOnly,
    deferredVisionOnly,
    deferredSortKey,
  ]);

  // 首次切到 models 时，给一个极短的 uiLoading
  useEffect(() => {
    if (activeTab === 'models') {
      kickUiLoading(80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const columns1: ColumnsType<ModelDto> = [
    {
      title: language.modelTag,
      key: 'model',
      width: 220,
      render: (_: unknown, record) => {
        const { model, provider } = splitProviderAndModel(record.id);
        return (
          <div
            style={{
              color: '#000',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '20px',
              cursor: 'default',
            }}
            title={record.description}
          >
            {model}
            <div
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {provider}
            </div>
          </div>
        );
      },
    },
    {
      title: language.modelInputSupport,
      dataIndex: ['architecture', 'input_modalities'],
      key: 'modalities',
      width: 180,
      render: (_: unknown, record) => {
        const list = record?.architecture?.input_modalities?.length
          ? record.architecture.input_modalities
          : ['text'];
        return (
          <Space size={[4, 4]} wrap>
            {list.map((m) => (
              <Tag key={m}>{m}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: language.releaseDate,
      dataIndex: 'created',
      key: 'created',
      width: 120,
      render: (created: number) => formatDDMMYYYY(toDate(created)),
    },
    {
      title: language.operation,
      key: 'action',
      width: 100,
      render: (_: unknown, record) => (
        <Button
          type={currentModel === record.id ? 'primary' : 'default'}
          size="small"
          onClick={() => {
            onModelChange(record.id);
            const list =
              (record?.architecture?.input_modalities && record.architecture.input_modalities.length > 0)
                ? record.architecture.input_modalities
                : ['text']; // 回退，保证选择后也一定有值
            setSupportedFeature(list.map(v => String(v)));
          }}
        >
          {currentModel === record.id ? language.selected : language.select}
        </Button>
      ),
    },
  ];

   const columns2: ColumnsType<ModelDto> = [
    {
      title: language.modelTag,
      key: 'model',
      width: 220,
      render: (_: unknown, record) => {
        const { model, provider } = splitProviderAndModel(record.id);
        return (
          <div
            style={{
              color: '#000',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '20px',
              cursor: 'default',
            }}
            title={record.description}
          >
            {model}
            <div
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {provider}
            </div>
          </div>
        );
      },
    },
    {
      title: language.operation,
      key: 'action',
      width: 100,
      render: (_: unknown, record) => (
        <Button
          type={currentModel === record.id ? 'primary' : 'default'}
          size="small"
          onClick={() => {
            onModelChange(record.id);
            const list =
              (record?.architecture?.input_modalities && record.architecture.input_modalities.length > 0)
                ? record.architecture.input_modalities
                : ['text']; // 回退，保证选择后也一定有值
            setSupportedFeature(list.map(v => String(v)));
          }}
        >
          {currentModel === record.id ? language.select : language.select}
        </Button>
      ),
    },
  ];

  // === 统一外层高度 ===
  const OUTER_STYLE: React.CSSProperties = {
    height: 550,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
  };

  // —— 针对“提示词”Tab
  const SCROLL_AREA_STYLE_PROMPT: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  };

  // —— 针对“模型列表”Tab
  const SCROLL_AREA_STYLE_MODELS: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'visible',
  };

  // 统一操作按钮风格
  const actionBtnCommon: Partial<React.ComponentProps<typeof Button>> = {
    type: 'primary',
    size: 'middle',
    shape: 'round',
  };

  const promptTab = (
    <div style={OUTER_STYLE}>
      <div style={SCROLL_AREA_STYLE_PROMPT}>
        <div style={{ marginBottom: 12 }}>
          <h4>{language.systemPrompt}</h4>
          <Input.TextArea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder="Set the system prompt for the assistant..."
            autoSize={{ minRows: 4, maxRows: 4 }}
          />
        </div>

        {/* 操作区 */}
        <div
          style={{
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Button
            {...actionBtnCommon}
            danger
            onClick={() => onSystemPromptChange('')}
          >
            {language.clear}
          </Button>

          <Button
            {...actionBtnCommon}
            onClick={() => {
              if (!systemPrompt?.trim()) {
                return;
              }
              setNewLabelName('');
              setSaveModalOpen(true);
            }}
          >
            {language.save}
          </Button>

          <Button {...actionBtnCommon} onClick={handleApplyToStore}>
            {language.apply}
          </Button>
        </div>

        {/* 标签区：我的标签（可删除） */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: token.colorTextTertiary, marginBottom: 6, fontSize: 12 }}>
            {language.myPrompts}
          </div>
          <div className="preset-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {storePrompts.map((p) => (
              <div
                key={p.id}
                className="preset-chip"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: token.colorFill,
                  opacity: 0.9,
                  backdropFilter: 'saturate(120%) blur(2px)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  maxWidth: 260,
                }}
                onClick={() => onSystemPromptChange(p.prompt)}
                title={p.prompt}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: 220,
                  }}
                >
                  {p.tagName}
                </span>

                <Button
                  size="small"
                  type="text"
                  aria-label={language.delete}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePromptFromStore(p.id);
                  }}
                  className="chip-close"
                  icon={<CloseOutlined />}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 预制标签（不可删除） */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: token.colorTextTertiary, marginBottom: 6, fontSize: 12 }}>
            {language.prefabPrompts}
          </div>
          <div className="preset-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DEFAULT_PRESETS.map((p) => (
              <div
                key={p.id}
                className="preset-chip"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: token.colorFill,
                  opacity: 0.7,
                  backdropFilter: 'saturate(120%) blur(2px)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  maxWidth: 260,
                }}
                onClick={() => onSystemPromptChange(p.value)}
                title={p.value}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: 220,
                  }}
                >
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 保存标签弹窗 */}
      <Modal
        open={saveModalOpen}
        title={language.save}
        onCancel={() => setSaveModalOpen(false)}
        onOk={async () => {
          const name = newLabelName.trim();
          if (!name) {
            return;
          }
          if (!systemPrompt?.trim()) {
            return;
          }
          await addPromptToStore(name, systemPrompt);
          setSaveModalOpen(false);
        }}
        okText={language.save}
        cancelText={language.cancelText}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
            {language.promptName}
          </div>
          <Input
            placeholder={language.promptNamePlaceholder}
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            maxLength={32}
            showCount
          />
        </Space>
      </Modal>
    </div>
  );

  const tableTab = (
    <div style={OUTER_STYLE}>
      <div style={{ marginBottom: 8 }}>
        <h4 style={{ marginBottom: 12 }}>{language.currentModel}: {currentModel || 'Loading...'}</h4>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          background: token.colorFillTertiary,
        }}
      >
        <Space size={16} wrap>
          <Form.Item name="freeOnly" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>{language.modelFreeOnly}</Checkbox>
          </Form.Item>
          <Form.Item name="visionOnly" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>{language.modelMultiFormatSupport}</Checkbox>
          </Form.Item>
          <Form.Item name="sortKey" style={{ marginBottom: 0, minWidth: 140 }}>
            <Select
              options={[
                { value: 'created_desc', label: `${language.releaseDate} ↓` },
                { value: 'price_desc', label: `${language.pricing} ↓` },
                { value: 'context_desc', label: `${language.contextLength} ↓` },
              ]}
              onChange={() => kickUiLoading(80)}
            />
          </Form.Item>
        </Space>
      </Form>

      <div style={SCROLL_AREA_STYLE_MODELS}>
        <Table<ModelDto>
          rowKey={(r) => r.id}
          columns={expanded?columns1:columns2}
          dataSource={activeTab === 'models' ? viewData : []}
          size="small"
          pagination={false}
          sticky
          tableLayout="fixed"
          loading={
            activeTab === 'models' &&
            (uiLoading || isPending || computing || !deferredModelList)
          }
          locale={{ emptyText: activeTab === 'models' ? language.noModelAvailable : '' }}
          scroll={{ y: 330 }}
          rowClassName={() => 'compact-row'}
          onRow={(record) => {
            const colors = providerToColor(record.id);
            return {
              style: {
                background:
                  currentModel === record.id ? token.colorFillSecondary : undefined,
                boxShadow: `inset 2px 0 0 0 ${colors?.brand || token.colorPrimary}`,
              },
            };
          }}
        />
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnHidden
      mask={false}
      centered
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'prompt' | 'models')}
        items={[
          { key: 'prompt', label: language.promptTag, children: promptTab },
          { key: 'models', label: language.modelTag, children: tableTab },
        ]}
        destroyOnHidden={false}
      />
    </Modal>
  );
};

export default BotModal;
