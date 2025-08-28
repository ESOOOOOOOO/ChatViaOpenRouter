import { Conversation } from "./Conversation.dto";
import { ModelDto } from "./OpenRouterResponse.dto";

export type StorageItem = {
    "conversations":Conversation[],
    "current_model":ModelDto;
  };
  