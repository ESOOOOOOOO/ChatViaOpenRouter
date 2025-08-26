import { Message } from "./Message.dto"

export interface Conversation {
  title:string;
  createTime:number;
  lastUpdateTime:number;
  messages:Message[];
}