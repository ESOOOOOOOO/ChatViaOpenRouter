export function findConversationIndexByTime<T extends { lastUpdateTime: number }>(
  arr: T[],
  lastUpdateTime: number
): number {
  if (!arr || arr.length === 0) {
    return -1;
  }

  return arr.findIndex(item => item.lastUpdateTime === lastUpdateTime);
}