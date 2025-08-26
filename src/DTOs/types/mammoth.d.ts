declare module "mammoth/mammoth.browser" {
  interface ExtractResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface ExtractOptions {
    arrayBuffer: ArrayBuffer;
  }

  function extractRawText(options: ExtractOptions): Promise<ExtractResult>;

  const mammoth: {
    extractRawText: typeof extractRawText;
  };

  export default mammoth;
}