import React from 'react'; // ★ 需要 useState
import { Dropdown, Image } from 'antd'; // ★ 用到 Button/Space/Tooltip
import { Bubble, Attachments } from '@ant-design/x';
import RenderMessageContent from '../components/CodeBlockRenderer';
import { Message } from '../DTOs/Message.dto';

type TypedData = Message['content'][number];

// ★：类型辅助，允许读取 meta
type TextWithMeta = TypedData & {
  text?: string;
  meta?: { kind?: string; filename?: string; bytes?: number };
};

export interface MessageListProps {
  messages: Message[];
  onCopy: (text: string) => void;
  listRef: React.RefObject<HTMLDivElement>;
}

// 聚合一条消息里的所有 text，用于复制
const extractText = (content: TypedData[]) =>
  content
    .filter((i) => i.type === 'text' && (i as TextWithMeta).text)
    .map((i) => (i as TextWithMeta).text as string)
    .join('\n');

// ★ 判断是否为 “textable 文档型文本”
const isTextableDoc = (item: TypedData) =>
  item.type === 'text' && (item as TextWithMeta).meta?.kind === 'textable';

// ★ 把消息拆分为：附件（包含文件/图片/音频 + 文档型文本）与 普通文本
const splitContent = (content: TypedData[]) => {
  const attachments: TypedData[] = [];
  const texts: TypedData[] = [];
  for (const item of content) {
    if (isTextableDoc(item)) {
      attachments.push(item); // 文档型文本进附件区
    } else if (item.type === 'text') {
      texts.push(item); // 普通文本
    } else {
      attachments.push(item); // 其它附件
    }
  }
  return { attachments, texts };
};


const MessageList: React.FC<MessageListProps> = ({ messages, onCopy, listRef }) => {
  return (
    <div ref={listRef} className="chat-messages-container">
      <Bubble.List
        items={messages.map((msg) => {
          const menuItems = [{ key: 'copy', label: '复制' }];
          const { attachments, texts } = splitContent(msg.content);

          return {
            key: msg.id,
            role: msg.role,
            content: (
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: menuItems,
                  onClick: () => onCopy(extractText(msg.content)),
                }}
              >
                {/* 统一的内层容器，负责内边距/间距 */}
                <div
                  className={`msg-content ${msg.role}`}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="msg-inner">
                    {/* ===== 附件区域（在上）===== */}
                    {attachments.length > 0 && (
                      <div className="msg-attachments">
                        <Image.PreviewGroup>
                          {attachments.map((item, index) => {
                            // ★ 文档型文本（text + meta.kind === 'textable'）
                            if (isTextableDoc(item)) {
                              const itm = item as TextWithMeta;
                              return (
                                <div className="msg-attachment" key={`doc-${msg.id}-${index}`}>
                                  <Attachments.FileCard
                                    item={{
                                      uid: `${msg.id}-${index}`,
                                      name: itm.meta?.filename ?? 'document.txt',
                                      size: itm.meta?.bytes ?? (itm.text ? new Blob([itm.text]).size : 0),
                                    }}
                                  />
                                </div>
                              );
                            }

                            // 直链图片（image_url）
                            if (item.type === 'image_url' && (item as any).image_url?.url) {
                              const url = (item as any).image_url.url as string;
                              return (
                                <div className="msg-attachment" key={`att-${index}`}>
                                  <Image
                                    src={url}
                                    alt="image"
                                    className="msg-image"
                                    preview={{ src: url }}
                                  />
                                </div>
                              );
                            }

                            // 文件（可能是图片或其它文件）
                            if (item.type === 'file' && (item as any).file) {
                              const { filename, file_data } = (item as any).file as {
                                filename?: string;
                                file_data?: string;
                              };
                              const isImage = /\.(jpe?g|png|gif|webp)$/i.test(filename ?? '');

                              if (isImage) {
                                const dataUrl = `data:image/*;base64,${file_data}`;
                                return (
                                  <div className="msg-attachment" key={`att-${index}`}>
                                    <Image
                                      src={dataUrl}
                                      alt={filename}
                                      className="msg-image"
                                      preview={{ src: dataUrl }}
                                    />
                                  </div>
                                );
                              }

                              // 非图片文件 → 文件卡片
                              return (
                                <div className="msg-attachment" key={`att-${index}`}>
                                  <Attachments.FileCard
                                    item={{
                                      uid: `${msg.id}-${index}`,
                                      name: filename ?? '未知文件',
                                      size: file_data
                                        ? Math.round((file_data.length * 3) / 4)
                                        : 0,
                                    }}
                                  />
                                </div>
                              );
                            }

                            // 音频
                            if (item.type === 'input_audio' && (item as any).input_audio) {
                              const { format, data } = (item as any).input_audio as {
                                format: string;
                                data: string;
                              };
                              return (
                                <div className="msg-attachment" key={`att-${index}`}>
                                  <audio
                                    controls
                                    className="msg-audio"
                                    src={`data:audio/${format};base64,${data}`}
                                  />
                                </div>
                              );
                            }

                            return null;
                          })}
                        </Image.PreviewGroup>
                      </div>
                    )}

                    {/* ===== 文本区域（在下）===== */}
                    {texts.length > 0 && (
                      <div className="msg-texts">
                        {texts.map((item, index) => (
                          <RenderMessageContent
                            key={`txt-${index}`}
                            content={(item as TextWithMeta).text ?? ''}
                            isTitle={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Dropdown>
            ),
          };
        })}
        roles={{
          user: {
            placement: 'end',
            variant: 'filled',
            shape: 'round',
            styles: { content: { padding: '0px' } },
          },
          assistant: {
            placement: 'start',
            variant: 'filled',
            shape: 'round',
            styles: { content: { padding: '0px' } },
          },
        }}
        autoScroll
        className="bubble-list-margin"
      />
    </div>
  );
};

export default MessageList;
