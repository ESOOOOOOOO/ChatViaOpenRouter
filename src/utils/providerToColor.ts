// TypeScript 映射类型
const providerColors: Record<string, { brand: string; text: string }> = {
  'openrouter':        { brand: '#6467F2', text: '#FFFFFF' },
  'mistralai':         { brand: '#FF7759', text: '#FFFFFF' },
  'qwen':              { brand: '#1F84B4', text: '#FFFFFF' },
  'z-ai':            { brand: '#7C3AED', text: '#FFFFFF' },
  'bytedance':         { brand: '#115FB3', text: '#FFFFFF' },
  'google':            { brand: '#4285F4', text: '#FFFFFF' },
  'switchpoint':       { brand: '#E43F5A', text: '#FFFFFF' },
  'moonshotai':        { brand: '#FCAF17', text: '#000000' },
  'thudm':             { brand: '#0B3E8A', text: '#FFFFFF' },
  'cognitivecomputations': { brand: '#4A148C', text: '#FFFFFF' },
  'x-ai':            { brand: '#72C5C0', text: '#000000' },
  'tencent':           { brand: '#0052D9', text: '#FFFFFF' },
  'tngtech':           { brand: '#009E73', text: '#FFFFFF' },
  'morph':             { brand: '#D81B60', text: '#FFFFFF' },
  'baidu':             { brand: '#DE3030', text: '#FFFFFF' },
  'thedrummer':        { brand: '#8D6E63', text: '#FFFFFF' },
  'inception':         { brand: '#37474F', text: '#FFFFFF' },
  'minimax':           { brand: '#FFC400', text: '#000000' },
  'openai':            { brand: '#10A37F', text: '#FFFFFF' },
  'deepseek':          { brand: '#0091EA', text: '#FFFFFF' },
  'sarvamai':          { brand: '#7A4EAA', text: '#FFFFFF' },
  'anthropic':         { brand: '#CC785C', text: '#FFFFFF' },
  'nousresearch':      { brand: '#06AED5', text: '#FFFFFF' },
  'arcee-ai':        { brand: '#FFB300', text: '#000000' },
  'microsoft':         { brand: '#F25022', text: '#FFFFFF' },
  'opengvlab':         { brand: '#4FC3F7', text: '#000000' },
  'meta-llama':      { brand: '#0081FB', text: '#FFFFFF' },
  'shisa-ai':        { brand: '#E040FB', text: '#FFFFFF' },
  'eleutherai':        { brand: '#0266B3', text: '#FFFFFF' },
  'alfredpros':        { brand: '#F4511E', text: '#FFFFFF' },
  'arliai':            { brand: '#5E35B1', text: '#FFFFFF' },
  'agentica-org':    { brand: '#3949AB', text: '#FFFFFF' },
  'nvidia':            { brand: '#76B900', text: '#000000' },
  'scb10x':            { brand: '#00796B', text: '#FFFFFF' },
  'featherless':       { brand: '#8E24AA', text: '#FFFFFF' },
  'ai21':              { brand: '#0184E2', text: '#FFFFFF' },
  'cohere':            { brand: '#00C4CC', text: '#000000' },
  'rekaai':            { brand: '#FF5722', text: '#FFFFFF' },
  'perplexity':        { brand: '#FF8D1C', text: '#000000' },
  'aion-labs':       { brand: '#00E676', text: '#000000' },
  'liquid':            { brand: '#00ACC1', text: '#FFFFFF' },
  'sao10k':            { brand: '#6D4C41', text: '#FFFFFF' },
  'amazon':            { brand: '#FF9900', text: '#000000' },
  'infermatic':        { brand: '#3F51B5', text: '#FFFFFF' },
  'raifle':            { brand: '#009688', text: '#FFFFFF' },
  'anthracite-org':  { brand: '#546E7A', text: '#FFFFFF' },
  'inflection':        { brand: '#FDD835', text: '#000000' },
  'neversleep':        { brand: '#8E24AA', text: '#FFFFFF' },
  'nothingiisreal':    { brand: '#607D8B', text: '#FFFFFF' },
  'sophosympatheia':   { brand: '#C62828', text: '#FFFFFF' },
  'undi95':            { brand: '#1976D2', text: '#FFFFFF' },
  'alpindale':         { brand: '#AD1457', text: '#FFFFFF' },
  'pygmalionai':       { brand: '#FF4081', text: '#FFFFFF' },
  'mancer':            { brand: '#43A047', text: '#FFFFFF' },
  'gryphe':            { brand: '#7CB342', text: '#FFFFFF' }
};

export function providerToColor(modelID: string): { brand: string; text: string } {
    let provider = getProvider(modelID);
  return providerColors[provider] ?? { brand: '#CCCCCC', text: '#000000' };
}

function getProvider(inputString: string): string {
  const slashIndex = inputString.indexOf('/');
  if (slashIndex === -1) {
    return inputString;
  } else {
    return inputString.substring(0, slashIndex);
  }
}
