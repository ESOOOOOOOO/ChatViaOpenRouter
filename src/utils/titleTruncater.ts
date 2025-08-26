
//标题默认用30
export function truncateTextByVisualWidth(text: string, maxVisualLength: number): string {

  let visualLength = 0;
  let truncatedText = '';

  for (const char of text) {
    if (visualLength >= maxVisualLength) {
      break;
    }

    if (/[\u4e00-\u9fa5\u3000-\u303F\uFF00-\uFFEF]/.test(char)) {
      visualLength += 2;
    } else {
      visualLength += 1;
    }
    
    truncatedText += char;
  }
  if (truncatedText.length === text.length) {
    return text;
  }
  
  return `${truncatedText}...`;
}