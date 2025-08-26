import { Conversation } from './../DTOs/Conversation.dto';


export const findIdxByCreateTime = (list: Conversation[], createTime: number) =>
list.findIndex((c) => c.createTime === createTime);


export const sortByLastUpdateDesc = (list: Conversation[]) =>
[...list].sort((a, b) => (b.lastUpdateTime ?? 0) - (a.lastUpdateTime ?? 0));