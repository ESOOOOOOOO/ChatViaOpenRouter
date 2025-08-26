import React from 'react';
import { Button, Divider, Flex, Typography, theme, Tag, Badge } from 'antd';
import { CompressOutlined, ExpandOutlined, SettingOutlined, ToTopOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { truncateTextByVisualWidth } from '../utils/titleTruncater';
import RenderMessageContent from './CodeBlockRenderer';
import { SystemLanguageDto } from '../DTOs/systemLanguage.dto';
// ⚠️ Tauri 2.x：使用 webviewWindow 包
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const { Title } = Typography;

export interface ChatHeaderProps {
  chatTitle: string;
  currentModel: string;
  pined: boolean;
  expanded: boolean;
  onTogglePin: () => void;
  onOpenBotModel: () => void;
  onOpenSettingModel: () => void;
  onToggleExpand: () => void;
  supportedFeature: Array<string>; // 允许上层随意传，这里做运行时过滤
  apiKeyReady: boolean;
  language: SystemLanguageDto;
  /** ✅ 新增：拖拽状态回传，父组件可用来拦截“失焦隐藏” */
  onDraggingChange?: (dragging: boolean) => void;
}

const ALLOWED_FEATURES = new Set(['text', 'image', 'file', 'audio']);

/** 判断是否是交互控件：命中则不触发拖拽 */
function isInteractive(target: EventTarget | null): boolean {
  if (!target || !(target as HTMLElement).closest) return false;
  const el = (target as HTMLElement);
  // 命中任何标记为 data-nodrag 的元素/祖先，或常见交互组件
  return !!el.closest(
    [
      '[data-nodrag]',                 // 我们主动加的“非拖拽”标记
      'button',
      '[role="button"]',
      'a[href]',
      'input',
      'select',
      'textarea',
      '.ant-btn',                      // AntD 按钮
      '.ant-tag',                      // AntD Tag
      '.ant-badge',                    // AntD Badge
      '.ant-switch',
      '.ant-checkbox',
      '.ant-radio'
    ].join(',')
  );
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTitle,
  currentModel,
  pined,
  expanded,
  onTogglePin,
  onOpenBotModel,
  onOpenSettingModel,
  onToggleExpand,
  supportedFeature = [],
  apiKeyReady,
  onDraggingChange,
}) => {
  const { token } = theme.useToken();
  const iconStyle = { fontSize: 16, color: token.colorText } as const;

  // 归一化 + 过滤非法值 + 去重
  const featureTags = Array.from(
    new Set(
      (supportedFeature || [])
        .map(f => String(f).toLowerCase().trim())
        .filter(f => ALLOWED_FEATURES.has(f))
    )
  );

  // ✅ 关键：按下标题栏时启动窗口拖拽（仅在非交互区域）
  const handleHeaderMouseDown: React.MouseEventHandler<HTMLDivElement> = async (e) => {
    // 仅左键
    if (e.button !== 0) return;
    // 如果点在交互控件上，直接放行，不拖拽
    if (isInteractive(e.target)) return;

    if (!expanded) {
      e.preventDefault();
      onDraggingChange?.(true);
      try {
        const win = getCurrentWebviewWindow();
        await win.startDragging(); // 拖拽期间该 Promise 阻塞，结束后再往下
      } finally {
        onDraggingChange?.(false);
      }
    }
    // 避免选择文本/触发 click 合成事件

  };

  // ✅ 给所有可点击控件统一提供“非拖拽区”标记 + 阻止 mousedown 冒泡（双保险）
  const noDragProps = {
    'data-nodrag': '',
    onMouseDown: (ev: React.MouseEvent) => {
      ev.stopPropagation();
    }
  } as const;

  return (
    // ❗ 不再使用 data-tauri-drag-region；纯手动判断 + startDragging
    <div
      className={expanded ? "chat-dock-header-expanded" : "chat-dock-header"}
      onMouseDown={handleHeaderMouseDown}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        cursor: expanded?"default":"move" // 统一给个手势反馈
      }}
      role="toolbar"
      aria-label="Chat header"
    >
      <Flex justify="space-between" align="center">
        <div>
          {expanded ? (
            <>
              <Title level={4} style={{ margin: 0, color: token.colorText }}>
                <RenderMessageContent
                  content={truncateTextByVisualWidth(chatTitle, 40)}
                  isTitle={true}
                />
              </Title>
            </>
          ) : null}

          {/* 将按钮与特征 Tag 放在一行 */}
          {expanded ? (
            // ✅ flag=true：Button 和 Tags 同一行
            <Flex align="center" gap={6} wrap="wrap" style={{ marginTop: 4 }}>
              <Button
                {...noDragProps}
                icon={
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#00FF00",
                      boxShadow: "0 0 5px #00FF00, 0 0 10px #00FF00",
                      marginRight: 5,
                      marginLeft: 15,
                    }}
                  />
                }
                type="text"
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: token.colorTextSecondary,
                  paddingLeft: 0,
                }}
                onClick={onOpenBotModel}
              >
                {currentModel || "Loading..."}
              </Button>

              {featureTags.map((f) => (
                <Tag
                  {...noDragProps}
                  key={f}
                  bordered
                  style={{
                    opacity: 1,
                    marginInlineStart: 0,
                    fontSize: 12,
                    lineHeight: "20px",
                    height: 22,
                    paddingInline: 8,
                    color: token.colorTextSecondary,
                    background: token.colorFillSecondary,
                    borderColor: token.colorBorderSecondary,
                    marginRight: 0
                  }}
                >
                  {f}
                </Tag>
              ))}
            </Flex>
          ) : (
            // 🚀 flag=false：Button 一行，Tags 下一行
            <div style={{ marginTop: 4 }}>
              <Flex align="center" gap={6}>
                <Button
                  {...noDragProps}
                  icon={
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#00FF00",
                        boxShadow: "0 0 5px #00FF00, 0 0 10px #00FF00",
                        marginRight: 5,
                        marginLeft: 15,
                      }}
                    />
                  }
                  type="text"
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: token.colorTextSecondary,
                    paddingLeft: 0,
                  }}
                  onClick={onOpenBotModel}
                >
                  {currentModel || "Loading..."}
                </Button>
              </Flex>

              {/* Tags 独立一行 */}
              <Flex gap={6} wrap="wrap" style={{ marginTop: 0, paddingLeft: 18 }}>
                {featureTags.map((f) => (
                  <Tag
                    {...noDragProps}
                    key={f}
                    bordered
                    style={{
                      opacity: 1,
                      marginInlineStart: 0,
                      fontSize: 12,
                      lineHeight: "16px",
                      height: 18,
                      paddingInline: 6,
                      color: token.colorTextSecondary,
                      background: "#eeeeee66",
                      borderColor: 'transparent',
                      marginRight: 0
                    }}
                  >
                    {f}
                  </Tag>
                ))}
              </Flex>
            </div>
          )}

        </div>

        <Flex align="center">
          <Button
            {...noDragProps}
            type="text"
            style={{ ...iconStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            icon={pined ? <VerticalAlignTopOutlined /> : <ToTopOutlined />}
            onClick={onTogglePin}
            className={pined ? 'pined-button-active' : ''}
          />

          {expanded ? (
            <>
              <Divider type="vertical" style={{ margin: '0 1px' }} />
              <Badge dot={!apiKeyReady}>
                <Button
                  {...noDragProps}
                  type="text"
                  icon={<SettingOutlined />}
                  style={{ ...iconStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={onOpenSettingModel}
                />
              </Badge>
            </>
          ) : null}

          <Divider type="vertical" style={{ margin: '0 1px' }} />

          <Badge dot={!expanded && !apiKeyReady}>
            <Button
              {...noDragProps}
              type="text"
              icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
              style={{ ...iconStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={onToggleExpand}
            />
          </Badge>
        </Flex>
      </Flex>
    </div>
  );
};

export default ChatHeader;
