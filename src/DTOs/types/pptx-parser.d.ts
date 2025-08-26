declare module "pptx-parser" {
  // 你可以先写最宽松的 any
  export function parsePptx(data: ArrayBuffer | Uint8Array): Promise<any>;
  const _default: { parsePptx: typeof parsePptx };
  export default _default;
}
