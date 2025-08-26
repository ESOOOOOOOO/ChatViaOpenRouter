
import { message } from 'antd';
import { Conversation } from './../DTOs/Conversation.dto';


export async function* getCompletionStream(
  apiKey: string,
  model: string,
  prompt: string
): AsyncGenerator<any, void, undefined> {
  const response = await fetch('https://openrouter.ai/api/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP 错误！状态码: ${response.status}`);
  }

  const reader = response?.body!.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      const events = chunk.split('\n\n');
      for (const event of events) {
        if (event.trim().startsWith('data: ')) {
          const data = event.trim().slice(6);
          if (data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              yield json;
            } catch (e) {
              console.error('JSON 解析错误', e);
            }
          }
        }
      }
    }
  }
}

/**
* CN: 复制文本到剪贴板；文本为空时提示成功（保持原语义）。
* EN: Copy text to clipboard; show success even if empty (preserves original semantics).
*/
export const onCopy = (text: string) => {
if (!text) return message.success('Text is empty');
message.success('Text copied successfully');
navigator.clipboard.writeText(text);
};


/**
* CN: 通过创建时间找到会话索引。
* EN: Find conversation index by creation time.
*/
export const findIdxByCreateTime = (list: Conversation[], createTime: number) =>
list.findIndex((c) => c.createTime === createTime);


/**
* CN: 按最后更新时间倒序排序，会产生副本。
* EN: Sort conversations by lastUpdateTime desc; returns a new array.
*/
export const sortByLastUpdateDesc = (list: Conversation[]) =>
[...list].sort((a, b) => (b.lastUpdateTime ?? 0) - (a.lastUpdateTime ?? 0));


/**
* CN: 从文件名猜测音频格式；与原逻辑一致，默认 wav。
* EN: Guess audio format from filename; same logic as original, default to wav.
*/
export const guessAudioFormat = (filename: string) => {
const lower = filename.toLowerCase();
if (lower.endsWith('.wav')) return 'wav';
if (lower.endsWith('.mp3')) return 'mp3';
if (lower.endsWith('.m4a')) return 'm4a';
if (lower.endsWith('.aac')) return 'aac';
return 'wav';
};