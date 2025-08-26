import { Conversation } from "./Conversation.dto";

export type StorageItem = {
    "conversations":Conversation[],
    "current_model":string;
  };
  