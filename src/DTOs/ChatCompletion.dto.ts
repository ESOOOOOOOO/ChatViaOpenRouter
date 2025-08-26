// 定义内部消息的接口
interface Message {
  content: string;
  reasoning: string;
  reasoning_details: {
    format: string;
    index: number;
    text: string;
    type: string;
  }[];
  refusal: null | any; // 根据实际情况定义更具体的类型
  role: string;
}

// 定义选择项的接口
interface Choice {
  finish_reason: string;
  index: number;
  logprobs: null | any; // 根据实际情况定义更具体的类型
  message: Message;
  native_finish_reason: string;
}

// 定义使用情况的接口
interface Usage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

// 定义最外层数据传输对象的接口
export interface ChatCompletion {
  choices: Choice[];
  created: number;
  id: string;
  model: string;
  object: string;
  provider: string;
  usage: Usage;
}